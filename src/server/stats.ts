/**
 * Player stats. Both return null without a session: looking at the home
 * screen or the stats page shouldn't create an anonymous user.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { assertRateLimit } from "./rate-limit";

const MINUTE = 60_000;

async function sessionUserId(): Promise<string | null> {
	const { auth } = await import("@/lib/auth");
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	return session?.user.id ?? null;
}

export const getSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const userId = await sessionUserId();
		if (!userId) return null;
		assertRateLimit(`stats:summary:${userId}`, 60, MINUTE);
		const { loadSummary } = await import("./stats-store");
		return loadSummary(userId);
	},
);

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
	const userId = await sessionUserId();
	if (!userId) return null;
	assertRateLimit(`stats:full:${userId}`, 30, MINUTE);
	const { loadStats } = await import("./stats-store");
	return loadStats(userId);
});
