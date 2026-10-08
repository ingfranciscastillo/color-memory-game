export type GameMode = "classic" | "speed" | "precision" | "endless";

export const MODES: GameMode[] = ["classic", "speed", "precision", "endless"];

const SPEED_TIMES = [3, 2.5, 2, 1.5, 1, 0.75, 0.5];

export function isGameMode(value: unknown): value is GameMode {
	return typeof value === "string" && (MODES as string[]).includes(value);
}

export function roundsForMode(mode: GameMode) {
	return mode === "endless" ? Infinity : 8;
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
	const base = Math.min(1, roundIndex / 8);
	return mode === "precision" ? Math.min(1, 0.3 + roundIndex / 6) : base;
}
