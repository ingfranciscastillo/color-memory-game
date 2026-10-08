import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily cleanup (vercel.json → crons). Vercel calls it with
 * `Authorization: Bearer $CRON_SECRET`; without that variable nobody can.
 */
function authorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false;
	const expected = Buffer.from(`Bearer ${secret}`);
	const received = Buffer.from(request.headers.get("authorization") ?? "");
	return (
		expected.length === received.length && timingSafeEqual(expected, received)
	);
}

export const Route = createFileRoute("/api/cron/cleanup")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!authorized(request)) {
					return new Response("Unauthorized", { status: 401 });
				}
				const { runCleanup } = await import("@/server/cleanup");
				const report = await runCleanup();
				console.info("[cleanup]", JSON.stringify(report));
				return Response.json(report);
			},
		},
	},
});
