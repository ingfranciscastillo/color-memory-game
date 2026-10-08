/**
 * When an anonymous player creates an account or signs in to one, their
 * games move to that account. If the account already played a day's daily
 * challenge (another device), the account's game stays; the anonymous one is
 * deleted with the anonymous user (on delete cascade).
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";

export async function moveGames(fromUserId: string, toUserId: string) {
	if (fromUserId === toUserId) return;
	await db
		.update(games)
		.set({ userId: toUserId })
		.where(
			and(
				eq(games.userId, fromUserId),
				sql`(${games.dayKey} is null or not exists (
					select 1 from ${games} as mine
					where mine.user_id = ${toUserId} and mine.day_key = ${games.dayKey}
				))`,
			),
		);
}
