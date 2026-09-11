import { type HSL, hueDelta, oklabDistance } from "./color";

export type RoundScore = {
	score: number;
	differencePct: number;
	hueError: number;
	saturationError: number;
	lightnessError: number;
};

/**
 * Perceptual OKLab distance mapped to 0..100.
 * A near-identical color lands close to 100; grossly wrong colors near 0.
 */
export function scoreGuess(target: HSL, guess: HSL): RoundScore {
	const distance = oklabDistance(target, guess);
	// 0.45 in OKLab is already a very wrong answer.
	const normalized = Math.min(1, distance / 0.45);
	const score = Math.round(100 * (1 - normalized) ** 1.6);

	return {
		score: Math.max(0, Math.min(100, score)),
		differencePct: Math.round(normalized * 1000) / 10,
		hueError: Math.round(hueDelta(target.h, guess.h)),
		saturationError: Math.round(guess.s - target.s),
		lightnessError: Math.round(guess.l - target.l),
	};
}

export const formatSigned = (n: number, unit = "") =>
	`${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}${unit}`;
