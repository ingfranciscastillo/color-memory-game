/**
 * In-memory request limit for the game's server functions.
 *
 * It's per server instance (Vercel may run several), so it isn't an exact
 * cap: it stops bursts and loops from one player without a database query on
 * every guess. Better Auth's endpoints have their own limit, in the database.
 */

import { m } from "@/paraglide/messages.js";

interface Window {
	count: number;
	resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = 0;

/** Drops expired windows now and then so memory doesn't pile up. */
function sweep(now: number) {
	if (now - lastSweep < 60_000) return;
	lastSweep = now;
	for (const [key, window] of windows) {
		if (window.resetAt <= now) windows.delete(key);
	}
}

/** Counts a request for `key`; throws once it exceeds `max` per `windowMs`. */
export function assertRateLimit(key: string, max: number, windowMs: number) {
	const now = Date.now();
	sweep(now);
	const window = windows.get(key);
	if (!window || window.resetAt <= now) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		return;
	}
	window.count += 1;
	if (window.count > max) throw new Error(m.error_too_many());
}
