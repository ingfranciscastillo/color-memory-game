import type { GameMode } from "./modes";

/** Leaderboard rules shared by the server and the leaderboard page. */

export type LeaderboardBoard = GameMode;

/** Daily first, then the weekly boards in the menu's order. */
export const BOARDS: LeaderboardBoard[] = [
	"daily",
	"classic",
	"speed",
	"precision",
	"endless",
];

export function isBoard(value: unknown): value is LeaderboardBoard {
	return typeof value === "string" && (BOARDS as string[]).includes(value);
}

const DAY_MS = 86_400_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: unknown): value is string {
	return (
		typeof value === "string" &&
		DAY_KEY.test(value) &&
		!Number.isNaN(Date.parse(value))
	);
}

/** The week's Monday (UTC) for a day, YYYY-MM-DD. */
export function weekStart(now = new Date()): string {
	const day = (now.getUTCDay() + 6) % 7; // 0 = Monday
	return new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day),
	)
		.toISOString()
		.slice(0, 10);
}

/** `dayKey` moved by `days` (negative for earlier). */
export function shiftDay(dayKey: string, days: number): string {
	return new Date(Date.parse(dayKey) + days * DAY_MS)
		.toISOString()
		.slice(0, 10);
}
