/**
 * Server-side games: generating targets, timing rounds and scoring guesses.
 * Only imported from the handlers in src/server/games.ts.
 *
 * Each round is created when the player starts it (not when the previous one
 * is scored), so `issued_at` marks the moment the color is shown. If they
 * reload mid-round, the color is only sent again while there's memorize time
 * left: after that they go straight to recreating it.
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyChallenges, games, rounds } from "@/db/schema";
import type { HSL } from "@/lib/color";
import {
	dailyTargets,
	type GameMode,
	MISS_LIMIT,
	memorizeSeconds,
	nextTarget,
	PASS_SCORE,
	roundsForMode,
	todayKey,
} from "@/lib/modes";
import { type RoundScore, scoreGuess } from "@/lib/scoring";
import { m } from "@/paraglide/messages.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type GameRow = typeof games.$inferSelect;
type RoundRow = typeof rounds.$inferSelect;

export interface GameTotals {
	totalScore: number;
	roundsPlayed: number;
	misses: number;
	streak: number;
	maxStreak: number;
	bestRound: number;
}

export interface RoundView {
	index: number;
	memorizeMs: number;
	/** Memorize time left when the server answered. */
	msLeft: number;
	/** Only while there's memorize time left. */
	target: HSL | null;
}

export interface GameView {
	id: string;
	mode: GameMode;
	finished: boolean;
	totals: GameTotals;
	/** The round being played (unanswered), or null between rounds. */
	round: RoundView | null;
}

export interface GuessResult {
	result: RoundScore;
	target: HSL;
	guess: HSL;
	totals: GameTotals;
	finished: boolean;
}

class GameError extends Error {}

const invalidGame = () => new GameError(m.error_invalid_game());

function totalsOf(game: GameRow): GameTotals {
	return {
		totalScore: game.totalScore,
		roundsPlayed: game.roundsPlayed,
		misses: game.misses,
		streak: game.streak,
		maxStreak: game.maxStreak,
		bestRound: game.bestRound,
	};
}

const targetOf = (round: RoundRow): HSL => ({
	h: round.targetH,
	s: round.targetS,
	l: round.targetL,
});

/**
 * A round created by this very request gets its full memorize time: the
 * request's own latency shouldn't eat into it. A round being resumed (reload)
 * only gets what's left since it was first shown.
 */
function roundView(round: RoundRow, created: boolean): RoundView {
	const msLeft = created
		? round.memorizeMs
		: Math.max(0, round.issuedAt.getTime() + round.memorizeMs - Date.now());
	return {
		index: round.index,
		memorizeMs: round.memorizeMs,
		msLeft,
		target: msLeft > 0 ? targetOf(round) : null,
	};
}

function gameView(
	game: GameRow,
	open: RoundRow | null,
	created = false,
): GameView {
	return {
		id: game.id,
		mode: game.mode as GameMode,
		finished: game.status === "finished",
		totals: totalsOf(game),
		round: open && game.status === "playing" ? roundView(open, created) : null,
	};
}

async function openRound(tx: Tx, game: GameRow): Promise<RoundRow | null> {
	const [round] = await tx
		.select()
		.from(rounds)
		.where(
			and(
				eq(rounds.gameId, game.id),
				eq(rounds.index, game.roundsPlayed),
				isNull(rounds.score),
			),
		);
	return round ?? null;
}

/** Today's colors, created by whoever plays first. */
async function dailyColors(tx: Tx, dayKey: string): Promise<HSL[]> {
	await tx
		.insert(dailyChallenges)
		.values({ dayKey, colors: dailyTargets() })
		.onConflictDoNothing();
	const [challenge] = await tx
		.select({ colors: dailyChallenges.colors })
		.from(dailyChallenges)
		.where(eq(dailyChallenges.dayKey, dayKey));
	return challenge.colors;
}

/**
 * Creates round `game.roundsPlayed`, or returns it if it already exists
 * (`created` tells which).
 */
async function issueRound(
	tx: Tx,
	game: GameRow,
): Promise<{ round: RoundRow; created: boolean }> {
	const index = game.roundsPlayed;
	const mode = game.mode as GameMode;
	let target: HSL;
	if (mode === "daily") {
		if (!game.dayKey) throw invalidGame();
		target = (await dailyColors(tx, game.dayKey))[index];
	} else {
		const [previous] =
			index > 0
				? await tx
						.select()
						.from(rounds)
						.where(and(eq(rounds.gameId, game.id), eq(rounds.index, index - 1)))
				: [];
		target = nextTarget(mode, index, previous ? targetOf(previous) : null);
	}

	const inserted = await tx
		.insert(rounds)
		.values({
			gameId: game.id,
			index,
			targetH: target.h,
			targetS: target.s,
			targetL: target.l,
			memorizeMs: Math.round(memorizeSeconds(mode, index) * 1000),
			issuedAt: new Date(),
		})
		.onConflictDoNothing()
		.returning();
	if (inserted[0]) return { round: inserted[0], created: true };
	const [round] = await tx
		.select()
		.from(rounds)
		.where(and(eq(rounds.gameId, game.id), eq(rounds.index, index)));
	return { round, created: false };
}

/** The open round, issuing it first if there's none. */
async function currentRound(tx: Tx, game: GameRow): Promise<GameView> {
	const open = await openRound(tx, game);
	if (open) return gameView(game, open);
	const { round, created } = await issueRound(tx, game);
	return gameView(game, round, created);
}

async function lockGame(
	tx: Tx,
	userId: string,
	gameId: string,
): Promise<GameRow> {
	const [game] = await tx
		.select()
		.from(games)
		.where(and(eq(games.id, gameId), eq(games.userId, userId)))
		.for("update");
	if (!game) throw invalidGame();
	return game;
}

/**
 * Starts a game and its first round. The daily challenge is one game per
 * day: asking again returns it as it is (finished, or where it was left).
 * Starting any other mode abandons the player's previous open game.
 */
export async function startGame(
	userId: string,
	mode: GameMode,
): Promise<GameView> {
	return db.transaction(async (tx) => {
		if (mode === "daily") {
			const dayKey = todayKey();
			await dailyColors(tx, dayKey);
			await tx
				.insert(games)
				.values({ userId, mode, dayKey })
				.onConflictDoNothing();
			const [game] = await tx
				.select()
				.from(games)
				.where(and(eq(games.dayKey, dayKey), eq(games.userId, userId)))
				.for("update");
			if (game.status !== "playing") return gameView(game, null);
			return currentRound(tx, game);
		}

		await tx
			.update(games)
			.set({ status: "abandoned" })
			.where(
				and(
					eq(games.userId, userId),
					eq(games.status, "playing"),
					isNull(games.dayKey),
				),
			);
		const [game] = await tx.insert(games).values({ userId, mode }).returning();
		return currentRound(tx, game);
	});
}

/** Scores the open round. Each round accepts one guess. */
export async function submitGuess(
	userId: string,
	gameId: string,
	index: number,
	guess: HSL,
): Promise<GuessResult> {
	return db.transaction(async (tx) => {
		const game = await lockGame(tx, userId, gameId);
		if (game.status !== "playing" || index !== game.roundsPlayed) {
			throw invalidGame();
		}
		const round = await openRound(tx, game);
		if (!round) throw invalidGame();

		const target = targetOf(round);
		const result = scoreGuess(target, guess);
		const passed = result.score >= PASS_SCORE;
		const streak = passed ? game.streak + 1 : 0;
		const misses = game.misses + (passed ? 0 : 1);
		const roundsPlayed = game.roundsPlayed + 1;
		const mode = game.mode as GameMode;
		const finished =
			roundsPlayed >= roundsForMode(mode) ||
			(mode === "endless" && misses >= MISS_LIMIT);

		await tx
			.update(rounds)
			.set({
				guessH: guess.h,
				guessS: guess.s,
				guessL: guess.l,
				score: result.score,
				answeredAt: new Date(),
			})
			.where(and(eq(rounds.gameId, game.id), eq(rounds.index, index)));

		const [updated] = await tx
			.update(games)
			.set({
				totalScore: game.totalScore + result.score,
				roundsPlayed,
				misses,
				streak,
				maxStreak: Math.max(game.maxStreak, streak),
				bestRound: Math.max(game.bestRound, result.score),
				...(finished ? { status: "finished", finishedAt: sql`now()` } : {}),
			})
			.where(eq(games.id, game.id))
			.returning();

		return { result, target, guess, totals: totalsOf(updated), finished };
	});
}

/** Starts the next round (idempotent: a repeated call returns the same one). */
export async function nextRound(
	userId: string,
	gameId: string,
): Promise<GameView> {
	return db.transaction(async (tx) => {
		const game = await lockGame(tx, userId, gameId);
		if (game.status !== "playing") throw invalidGame();
		return currentRound(tx, game);
	});
}

/** Endless: the player stops between rounds. Keeps the score so far. */
export async function finishGame(
	userId: string,
	gameId: string,
): Promise<GameView> {
	return db.transaction(async (tx) => {
		const game = await lockGame(tx, userId, gameId);
		if (game.status !== "playing" || game.mode !== "endless") {
			throw invalidGame();
		}
		// A round that was started but not answered doesn't count.
		await tx
			.delete(rounds)
			.where(and(eq(rounds.gameId, game.id), isNull(rounds.score)));
		const [updated] = await tx
			.update(games)
			.set({ status: "finished", finishedAt: sql`now()` })
			.where(eq(games.id, game.id))
			.returning();
		return gameView(updated, null);
	});
}
