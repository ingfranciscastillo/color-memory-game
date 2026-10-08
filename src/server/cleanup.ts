/**
 * Daily database cleanup (Vercel cron, src/routes/api/cron/cleanup.ts).
 *
 * - Anonymous users with no live session: sessions last 60 days from last
 *   use, so nobody can get back to them. Their games go with them.
 * - Expired sessions, stale verification codes and old rate-limit rows.
 * - Daily challenges left half-played on a past day: abandoned, since that
 *   day can't be resumed any more.
 * - Games abandoned or left open without a single answered round.
 *
 * Deletes in batches with a time budget, so it never holds the database for
 * long or outlives the function's time limit.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { todayKey } from "@/lib/modes";

const BATCH = 1000;
const TIME_BUDGET_MS = 20_000;
const DAY_MS = 86_400_000;

export interface CleanupReport {
	anonymousUsers: number;
	sessions: number;
	verifications: number;
	rateLimits: number;
	staleDailies: number;
	emptyGames: number;
	/** true if time ran out and work is left for tomorrow. */
	partial: boolean;
	ms: number;
}

/** Repeats a batched statement until nothing is left or time runs out. */
async function inBatches(
	statement: () => ReturnType<typeof sql>,
	deadline: number,
): Promise<{ count: number; partial: boolean }> {
	let count = 0;
	while (Date.now() < deadline) {
		const result = await db.execute(statement());
		const affected = result.rowCount ?? 0;
		count += affected;
		if (affected < BATCH) return { count, partial: false };
	}
	return { count, partial: true };
}

export async function runCleanup(): Promise<CleanupReport> {
	const started = Date.now();
	const deadline = started + TIME_BUDGET_MS;
	// Better Auth's columns are timestamps without time zone (UTC): compare
	// with this server's clock, not Postgres'.
	const now = new Date();
	const yesterday = new Date(started - DAY_MS);

	const anonymousUsers = await inBatches(
		() => sql`
			delete from "user" where id in (
				select u.id from "user" u
				where coalesce(u.is_anonymous, false)
					and u.created_at < ${yesterday}
					and not exists (
						select 1 from "session" s
						where s.user_id = u.id and s.expires_at > ${now}
					)
				limit ${BATCH}
			)`,
		deadline,
	);
	const sessions = await inBatches(
		() => sql`
			delete from "session" where id in (
				select id from "session" where expires_at < ${now} limit ${BATCH}
			)`,
		deadline,
	);
	const verifications = await inBatches(
		() => sql`
			delete from "verification" where id in (
				select id from "verification" where expires_at < ${now} limit ${BATCH}
			)`,
		deadline,
	);
	const rateLimits = await inBatches(
		() => sql`
			delete from "rate_limit" where id in (
				select id from "rate_limit"
				where last_request < ${started - DAY_MS} limit ${BATCH}
			)`,
		deadline,
	);
	const staleDailies = await inBatches(
		() => sql`
			update "games" set status = 'abandoned' where id in (
				select id from "games"
				where status = 'playing' and day_key < ${todayKey()}
				limit ${BATCH}
			)`,
		deadline,
	);
	const emptyGames = await inBatches(
		() => sql`
			delete from "games" where id in (
				select id from "games"
				where rounds_played = 0
					and status in ('playing', 'abandoned')
					and day_key is null
					and created_at < ${yesterday}
				limit ${BATCH}
			)`,
		deadline,
	);

	const steps = [
		anonymousUsers,
		sessions,
		verifications,
		rateLimits,
		staleDailies,
		emptyGames,
	];
	return {
		anonymousUsers: anonymousUsers.count,
		sessions: sessions.count,
		verifications: verifications.count,
		rateLimits: rateLimits.count,
		staleDailies: staleDailies.count,
		emptyGames: emptyGames.count,
		partial: steps.some((step) => step.partial),
		ms: Date.now() - started,
	};
}
