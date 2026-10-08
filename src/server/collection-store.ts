/**
 * Your collection: every target you nailed (EXCELLENT_SCORE or more), once
 * per color, newest first. Only imported from collection.ts.
 *
 * Today's daily colors stay out until tomorrow, so the collection can't
 * spoil them for anyone looking over your shoulder.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { HSL } from "@/lib/color";
import { todayKey } from "@/lib/modes";
import { EXCELLENT_SCORE } from "@/lib/stats";

export const COLLECTION_PAGE = 60;

export interface CollectionItem {
	target: HSL;
	score: number;
	at: string;
}

export interface Collection {
	items: CollectionItem[];
	total: number;
	page: number;
}

interface Row {
	target_h: number;
	target_s: number;
	target_l: number;
	score: number;
	answered_at: Date | string;
	total: string | number;
}

export async function loadCollection(
	userId: string,
	page: number,
): Promise<Collection> {
	const result = await db.execute(sql`
		with nailed as (
			select r.target_h, r.target_s, r.target_l, r.score, r.answered_at,
				-- The same color nailed twice counts once: keep the latest.
				row_number() over (
					partition by round(r.target_h::numeric), round(r.target_s::numeric),
						round(r.target_l::numeric)
					order by r.answered_at desc
				) as nth
			from rounds r join games g on g.id = r.game_id
			where g.user_id = ${userId}
				and r.score >= ${EXCELLENT_SCORE}
				and not (g.mode = 'daily' and g.day_key = ${todayKey()})
		)
		select target_h, target_s, target_l, score, answered_at,
			count(*) over () as total
		from nailed
		where nth = 1
		order by answered_at desc
		limit ${COLLECTION_PAGE} offset ${page * COLLECTION_PAGE}`);
	const rows = result.rows as unknown as Row[];
	return {
		items: rows.map((row) => ({
			target: { h: row.target_h, s: row.target_s, l: row.target_l },
			score: Number(row.score),
			at: new Date(row.answered_at).toISOString(),
		})),
		total: rows.length ? Number(rows[0].total) : 0,
		page,
	};
}
