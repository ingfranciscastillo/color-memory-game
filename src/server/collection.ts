import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { m } from "@/paraglide/messages.js";
import { assertRateLimit } from "./rate-limit";

const MINUTE = 60_000;

/** A page of your nailed colors. null without a session. */
export const getCollection = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const page = (input as { page?: unknown } | null)?.page ?? 0;
		if (
			typeof page !== "number" ||
			!Number.isInteger(page) ||
			page < 0 ||
			page > 1000
		) {
			throw new Error(m.error_invalid_game());
		}
		return { page };
	})
	.handler(async ({ data }) => {
		const { auth } = await import("@/lib/auth");
		const session = await auth.api.getSession({ headers: getRequestHeaders() });
		if (!session) return null;
		assertRateLimit(`collection:${session.user.id}`, 30, MINUTE);
		const { loadCollection } = await import("./collection-store");
		return loadCollection(session.user.id, data.page);
	});
