/**
 * Leaderboard server function: the top (the same for everyone) plus your
 * own row, even outside the top. The daily board is the day you ask for
 * (today or earlier); the others are this week's.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	getRequestHeader,
	getRequestHeaders,
} from "@tanstack/react-start/server";
import { isBoard, isDayKey, weekStart } from "@/lib/leaderboard";
import { todayKey } from "@/lib/modes";
import { m } from "@/paraglide/messages.js";
import { assertRateLimit } from "./rate-limit";

const MINUTE = 60_000;

/** Vercel sets x-real-ip to the client and overwrites what clients send. */
function clientIp(): string {
	return getRequestHeader("x-real-ip")?.trim() || "local";
}

async function sessionUser() {
	const { auth } = await import("@/lib/auth");
	// Skip the 5-minute cookie cache: opting in should show your row at once.
	const session = await auth.api.getSession({
		headers: getRequestHeaders(),
		query: { disableCookieCache: true },
	});
	if (!session) return null;
	// The anonymous plugin's field isn't in the inferred server type.
	const user = session.user as typeof session.user & {
		isAnonymous?: boolean | null;
	};
	const anonymous = Boolean(user.isAnonymous);
	return {
		id: user.id,
		anonymous,
		visible: Boolean(user.showInLeaderboard) && !anonymous,
	};
}

export const getLeaderboard = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const { board, day } = (input ?? {}) as { board?: unknown; day?: unknown };
		if (!isBoard(board)) throw new Error(m.error_invalid_board());
		if (day != null && !isDayKey(day)) throw new Error(m.error_invalid_board());
		return { board, day: (day as string | undefined) ?? null };
	})
	.handler(async ({ data }) => {
		assertRateLimit(`leaderboard:${clientIp()}`, 60, MINUTE);
		const today = todayKey();
		let period: string;
		if (data.board === "daily") {
			period = data.day ?? today;
			// Tomorrow's board doesn't exist yet.
			if (period > today) throw new Error(m.error_invalid_board());
		} else {
			period = weekStart();
		}

		const [store, user] = await Promise.all([
			import("./leaderboard-store"),
			sessionUser(),
		]);
		const [board, me] = await Promise.all([
			store.leaderboardCache(`${data.board}:${period}`, () =>
				store.loadLeaderboard(data.board, period),
			),
			user?.visible
				? store.loadLeaderboardMe(data.board, period, user.id)
				: null,
		]);
		return {
			...board,
			today,
			me,
			/** To invite you in: you have a session but don't appear. */
			you: user ? { anonymous: user.anonymous, visible: user.visible } : null,
		};
	});
