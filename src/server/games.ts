/**
 * Server functions for every mode. The player comes from their Better Auth
 * session (anonymous or not), never from the request body. The logic lives
 * in games-store.ts.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { parseHsl } from "@/lib/color";
import { isGameMode } from "@/lib/modes";
import { m } from "@/paraglide/messages.js";
import { assertRateLimit } from "./rate-limit";

const MINUTE = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireUserId(): Promise<string> {
	const { auth } = await import("@/lib/auth");
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!session) throw new Error(m.error_no_session());
	return session.user.id;
}

function readId(value: unknown): string {
	if (typeof value !== "string" || !UUID.test(value)) {
		throw new Error(m.error_invalid_game());
	}
	return value;
}

const readGameId = (input: unknown) => ({
	id: readId((input as { id?: unknown } | null)?.id),
});

/** Starts a game (or returns today's daily challenge as it stands). */
export const startGame = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const mode = (input as { mode?: unknown } | null)?.mode;
		if (!isGameMode(mode)) throw new Error(m.error_invalid_game());
		return { mode };
	})
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		assertRateLimit(`games:start:${userId}`, 30, MINUTE);
		const store = await import("./games-store");
		return store.startGame(userId, data.mode);
	});

/** Sends the player's color for the open round; the server scores it. */
export const submitGuess = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const { id, index, guess } = (input ?? {}) as {
			id?: unknown;
			index?: unknown;
			guess?: unknown;
		};
		const color = parseHsl(guess);
		if (
			!color ||
			typeof index !== "number" ||
			!Number.isInteger(index) ||
			index < 0 ||
			index > 10_000
		) {
			throw new Error(m.error_invalid_game());
		}
		return { id: readId(id), index, guess: color };
	})
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		assertRateLimit(`games:guess:${userId}`, 60, MINUTE);
		const store = await import("./games-store");
		return store.submitGuess(userId, data.id, data.index, data.guess);
	});

/** Starts the next round: its memorize clock begins now. */
export const nextRound = createServerFn({ method: "POST" })
	.validator(readGameId)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		assertRateLimit(`games:next:${userId}`, 60, MINUTE);
		const store = await import("./games-store");
		return store.nextRound(userId, data.id);
	});

/** Endless: end the session between rounds. */
export const finishGame = createServerFn({ method: "POST" })
	.validator(readGameId)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		assertRateLimit(`games:finish:${userId}`, 30, MINUTE);
		const store = await import("./games-store");
		return store.finishGame(userId, data.id);
	});
