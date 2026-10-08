import {
	generateNearColor,
	generateTargetColor,
	type HSL,
	normalizeHsl,
} from "./color";

/**
 * Game rules shared by the server (which generates and scores every round)
 * and the client (which only displays them).
 */

export type GameMode = "daily" | "classic" | "speed" | "precision" | "endless";

export const MODES: GameMode[] = [
	"daily",
	"classic",
	"speed",
	"precision",
	"endless",
];

/** A round at or above this score keeps the streak; below it is a miss. */
export const PASS_SCORE = 50;
/** Endless ends after this many misses. */
export const MISS_LIMIT = 3;
export const DAILY_ROUNDS = 5;

const SPEED_TIMES = [3, 2.5, 2, 1.5, 1, 0.75, 0.5];

export function isGameMode(value: unknown): value is GameMode {
	return typeof value === "string" && (MODES as string[]).includes(value);
}

export function roundsForMode(mode: GameMode) {
	if (mode === "endless") return Infinity;
	if (mode === "daily") return DAILY_ROUNDS;
	return 8;
}

/** Memorize duration in seconds for a 0-based round index. */
export function memorizeSeconds(mode: GameMode, roundIndex: number) {
	if (mode === "speed") {
		return SPEED_TIMES[Math.min(roundIndex, SPEED_TIMES.length - 1)] ?? 0.5;
	}
	if (mode === "endless") {
		return Math.max(1, 3 - roundIndex * 0.2);
	}
	return 3;
}

/** 0..1 — how subtle the generated color should be. */
export function difficultyFor(mode: GameMode, roundIndex: number) {
	if (mode === "precision") return Math.min(1, 0.3 + roundIndex / 6);
	if (mode === "daily") return Math.min(1, roundIndex / (DAILY_ROUNDS - 1));
	return Math.min(1, roundIndex / 8);
}

/**
 * Target for a round of any mode but daily (whose colors are fixed per day).
 * Precision drifts from the previous target, so rounds get harder to tell apart.
 */
export function nextTarget(
	mode: Exclude<GameMode, "daily">,
	roundIndex: number,
	previous: HSL | null,
): HSL {
	const difficulty = difficultyFor(mode, roundIndex);
	return normalizeHsl(
		mode === "precision" && previous
			? generateNearColor(previous, difficulty)
			: generateTargetColor(difficulty),
	);
}

/** The day's colors: the same for every player. */
export function dailyTargets(): HSL[] {
	return Array.from({ length: DAILY_ROUNDS }, (_, i) =>
		normalizeHsl(generateTargetColor(difficultyFor("daily", i))),
	);
}

/** Today's daily challenge key (UTC), YYYY-MM-DD. */
export function todayKey(now = new Date()) {
	return now.toISOString().slice(0, 10);
}
