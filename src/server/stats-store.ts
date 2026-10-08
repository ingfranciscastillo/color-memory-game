/**
 * A player's stats, computed on the server from their games and rounds: the
 * same on every device. Only imported from the handlers in stats.ts.
 *
 * Rounds count wherever they were played (an abandoned game's answered
 * rounds too); game totals only count finished games.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";
import { type GameMode, MODES, todayKey } from "@/lib/modes";
import { EXCELLENT_SCORE, SCORE_BUCKETS } from "@/lib/stats";

const RECENT_GAMES = 10;
const DAY_MS = 86_400_000;

export interface ModeStats {
	mode: GameMode;
	games: number;
	bestScore: number;
	averageScore: number;
	averageRound: number | null;
}

export interface ChannelStats {
	/** Mean absolute error, in degrees (hue) or percentage points. */
	hue: number;
	saturation: number;
	lightness: number;
	/** Mean signed error: >0 means the player picks more of it than there was. */
	saturationBias: number;
	lightnessBias: number;
}

export interface RecentGame {
	id: string;
	mode: GameMode;
	score: number;
	rounds: number;
	finishedAt: string;
}

export interface PlayerStats {
	gamesFinished: number;
	roundsPlayed: number;
	averageRound: number | null;
	excellentRounds: number;
	bestRound: number;
	bestStreak: number;
	daily: { currentStreak: number; maxStreak: number; playedToday: boolean };
	modes: ModeStats[];
	/** Rounds per score bucket (index 0 = 0–9). */
	distribution: number[];
	/** null until there's at least one round. */
	channels: ChannelStats | null;
	recent: RecentGame[];
}

/** Home screen summary: cheap enough for every visit. */
export interface PlayerSummary {
	bestScore: number;
	bestStreak: number;
	dailyPlayedToday: boolean;
	dailyStreak: number;
}

const num = (value: unknown) => Number(value ?? 0);
const numOrNull = (value: unknown) => (value == null ? null : Number(value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Current and longest run of consecutive days with a finished daily. */
function dailyStreaks(dayKeys: string[], today: string) {
	const days = [...new Set(dayKeys)].sort();
	let run = 0;
	let max = 0;
	let previous: number | null = null;
	for (const key of days) {
		const time = Date.parse(key);
		run = previous !== null && time - previous === DAY_MS ? run + 1 : 1;
		max = Math.max(max, run);
		previous = time;
	}
	// The current streak survives until the end of the day after the last one.
	const last = days.at(-1);
	const alive =
		last !== undefined && Date.parse(today) - Date.parse(last) <= DAY_MS;
	return { current: alive ? run : 0, max, playedToday: last === today };
}

async function finishedDailyDays(userId: string): Promise<string[]> {
	const rows = await db
		.select({ dayKey: games.dayKey })
		.from(games)
		.where(
			and(
				eq(games.userId, userId),
				eq(games.mode, "daily"),
				eq(games.status, "finished"),
			),
		);
	return rows.flatMap((row) => (row.dayKey ? [row.dayKey] : []));
}

export async function loadSummary(userId: string): Promise<PlayerSummary> {
	const [[best], days] = await Promise.all([
		db
			.select({
				bestScore: sql<number>`coalesce(max(${games.totalScore}), 0)`,
				bestStreak: sql<number>`coalesce(max(${games.maxStreak}), 0)`,
			})
			.from(games)
			.where(and(eq(games.userId, userId), eq(games.status, "finished"))),
		finishedDailyDays(userId),
	]);
	const daily = dailyStreaks(days, todayKey());
	return {
		bestScore: num(best?.bestScore),
		bestStreak: num(best?.bestStreak),
		dailyPlayedToday: daily.playedToday,
		dailyStreak: daily.current,
	};
}

export async function loadStats(userId: string): Promise<PlayerStats> {
	const [modeRows, roundRows, recentRows, days] = await Promise.all([
		db.execute(sql`
			select mode,
				count(*) as games,
				max(total_score) as best_score,
				avg(total_score) as average_score,
				sum(total_score)::float / nullif(sum(rounds_played), 0) as average_round,
				max(max_streak) as best_streak,
				max(best_round) as best_round
			from games
			where user_id = ${userId} and status = 'finished'
			group by mode`),
		db.execute(sql`
			select
				count(*) as rounds,
				avg(r.score) as average_round,
				count(*) filter (where r.score >= ${EXCELLENT_SCORE}) as excellent,
				max(r.score) as best_round,
				-- Hue wraps around: the error is the short way round the circle.
				avg(abs(mod((r.guess_h - r.target_h + 540)::numeric, 360) - 180)) as hue,
				avg(abs(r.guess_s - r.target_s)) as saturation,
				avg(abs(r.guess_l - r.target_l)) as lightness,
				avg(r.guess_s - r.target_s) as saturation_bias,
				avg(r.guess_l - r.target_l) as lightness_bias,
				${sql.raw(
					Array.from(
						{ length: SCORE_BUCKETS },
						(_, i) =>
							`count(*) filter (where least(r.score / 10, ${SCORE_BUCKETS - 1}) = ${i}) as b${i}`,
					).join(", "),
				)}
			from rounds r
			join games g on g.id = r.game_id
			where g.user_id = ${userId} and r.score is not null`),
		db
			.select({
				id: games.id,
				mode: games.mode,
				score: games.totalScore,
				rounds: games.roundsPlayed,
				finishedAt: games.finishedAt,
			})
			.from(games)
			.where(and(eq(games.userId, userId), eq(games.status, "finished")))
			.orderBy(desc(games.finishedAt))
			.limit(RECENT_GAMES),
		finishedDailyDays(userId),
	]);

	const byMode = new Map(
		modeRows.rows.map((row) => [
			String(row.mode),
			row as Record<string, unknown>,
		]),
	);
	const modes: ModeStats[] = MODES.flatMap((mode) => {
		const row = byMode.get(mode);
		if (!row) return [];
		const averageRound = numOrNull(row.average_round);
		return [
			{
				mode,
				games: num(row.games),
				bestScore: num(row.best_score),
				averageScore: Math.round(num(row.average_score)),
				averageRound: averageRound === null ? null : round1(averageRound),
			},
		];
	});

	const r = (roundRows.rows[0] ?? {}) as Record<string, unknown>;
	const roundsPlayed = num(r.rounds);
	const daily = dailyStreaks(days, todayKey());

	return {
		gamesFinished: modes.reduce((total, mode) => total + mode.games, 0),
		roundsPlayed,
		averageRound: roundsPlayed > 0 ? round1(num(r.average_round)) : null,
		excellentRounds: num(r.excellent),
		bestRound: num(r.best_round),
		bestStreak: Math.max(
			0,
			...modeRows.rows.map((row) =>
				num((row as Record<string, unknown>).best_streak),
			),
		),
		daily: {
			currentStreak: daily.current,
			maxStreak: daily.max,
			playedToday: daily.playedToday,
		},
		modes,
		distribution: Array.from({ length: SCORE_BUCKETS }, (_, i) =>
			num(r[`b${i}`]),
		),
		channels:
			roundsPlayed > 0
				? {
						hue: round1(num(r.hue)),
						saturation: round1(num(r.saturation)),
						lightness: round1(num(r.lightness)),
						saturationBias: round1(num(r.saturation_bias)),
						lightnessBias: round1(num(r.lightness_bias)),
					}
				: null,
		recent: recentRows.map((row) => ({
			id: row.id,
			mode: row.mode as GameMode,
			score: row.score,
			rounds: row.rounds,
			finishedAt: (row.finishedAt ?? new Date()).toISOString(),
		})),
	};
}
