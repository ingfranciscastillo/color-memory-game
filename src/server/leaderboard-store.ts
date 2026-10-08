/**
 * Leaderboards. Only imported from the handlers in leaderboard.ts.
 *
 * - Daily: everyone plays the same five colors, so a day's finished games
 *   rank by total score; ties go to whoever finished first.
 * - Classic, speed, precision, endless: weekly (Monday 00:00 UTC), each
 *   player's best finished game of the week.
 *
 * Only real accounts that opted in appear. Each board is ranked with
 * row_number() over everyone in it: the top is the same for every viewer
 * (cached), and your own row is fetched apart, so you see your rank even
 * outside the top.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { LeaderboardBoard } from "@/lib/leaderboard";

export const LEADERBOARD_SIZE = 100;

export interface LeaderboardEntry {
	rank: number;
	name: string;
	avatarSeed: string;
	score: number;
	/** Weekly boards: finished games that week. */
	games: number | null;
}

export interface Leaderboard {
	board: LeaderboardBoard;
	/** Day (daily) or the week's Monday, YYYY-MM-DD. */
	period: string;
	entries: LeaderboardEntry[];
	/** Players on this board. */
	total: number;
}

interface RankedRow {
	user_id: string;
	name: string;
	seed: string;
	score: string | number;
	games: string | number | null;
	rank: string | number;
	total: string | number;
}

const optedIn = sql`u.show_in_leaderboard and coalesce(u.is_anonymous, false) = false`;

/** CTE "ranked" for a board: all its rows, with rank and total. */
function rankedQuery(board: LeaderboardBoard, period: string) {
	if (board === "daily") {
		return sql`
			with base as (
				select g.user_id, u.name, coalesce(u.avatar_seed, u.id) as seed,
					g.total_score as score, null::int as games, g.finished_at
				from games g join "user" u on u.id = g.user_id
				where g.day_key = ${period} and g.status = 'finished' and ${optedIn}
			),
			ranked as (
				select *, row_number() over (order by score desc, finished_at, user_id) as rank,
					count(*) over () as total
				from base
			)`;
	}
	const since = sql`(${period}::date)::timestamp at time zone 'UTC'`;
	const until = sql`((${period}::date) + 7)::timestamp at time zone 'UTC'`;
	return sql`
		with week as (
			select g.user_id, g.total_score, g.finished_at,
				row_number() over (
					partition by g.user_id order by g.total_score desc, g.finished_at
				) as nth,
				count(*) over (partition by g.user_id) as games
			from games g
			where g.mode = ${board} and g.status = 'finished'
				and g.finished_at >= ${since} and g.finished_at < ${until}
		),
		base as (
			select w.user_id, u.name, coalesce(u.avatar_seed, u.id) as seed,
				w.total_score as score, w.games, w.finished_at
			from week w join "user" u on u.id = w.user_id
			where w.nth = 1 and ${optedIn}
		),
		ranked as (
			select *, row_number() over (order by score desc, finished_at, user_id) as rank,
				count(*) over () as total
			from base
		)`;
}

function toEntry(row: RankedRow): LeaderboardEntry {
	return {
		rank: Number(row.rank),
		name: row.name,
		avatarSeed: row.seed,
		score: Number(row.score),
		games: row.games == null ? null : Number(row.games),
	};
}

export async function loadLeaderboard(
	board: LeaderboardBoard,
	period: string,
): Promise<Leaderboard> {
	const result = await db.execute(sql`
		${rankedQuery(board, period)}
		select * from ranked where rank <= ${LEADERBOARD_SIZE} order by rank`);
	const rows = result.rows as unknown as RankedRow[];
	return {
		board,
		period,
		entries: rows.map(toEntry),
		total: rows.length ? Number(rows[0].total) : 0,
	};
}

/** Your row on the board, or null if you're not on it. */
export async function loadLeaderboardMe(
	board: LeaderboardBoard,
	period: string,
	userId: string,
): Promise<LeaderboardEntry | null> {
	const result = await db.execute(sql`
		${rankedQuery(board, period)}
		select * from ranked where user_id = ${userId}`);
	const [row] = result.rows as unknown as RankedRow[];
	return row ? toEntry(row) : null;
}

/** Short in-memory cache per key (the same data for every viewer). */
function cached<T>(ttlMs: number) {
	const store = new Map<string, { at: number; value: T }>();
	return async (key: string, load: () => Promise<T>): Promise<T> => {
		const hit = store.get(key);
		if (hit && Date.now() - hit.at < ttlMs) return hit.value;
		const value = await load();
		store.set(key, { at: Date.now(), value });
		// Old periods stop being asked for: don't let them pile up.
		if (store.size > 200) store.delete(store.keys().next().value as string);
		return value;
	};
}

export const leaderboardCache = cached<Leaderboard>(20_000);
