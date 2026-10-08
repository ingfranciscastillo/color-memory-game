/**
 * Game tables. Better Auth's (user, session…) live in auth-schema.ts.
 *
 * Every color is generated and every guess scored on the server: the client
 * only shows what it's sent, so scores (and leaderboards) can't be invented.
 */

import { sql } from "drizzle-orm";
import {
	date,
	doublePrecision,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import type { HSL } from "@/lib/color";
import { user } from "./auth-schema";

/**
 * The daily challenge's colors, the same for everyone. Generated at random
 * the first time someone plays that day: they can't be derived from the code
 * (the repository is public).
 */
export const dailyChallenges = pgTable("daily_challenges", {
	dayKey: date("day_key", { mode: "string" }).primaryKey(),
	colors: jsonb("colors").$type<HSL[]>().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/**
 * One game of any mode. Totals are kept here as rounds are scored, so stats
 * and leaderboards don't have to add up rounds.
 *
 * A player's games are deleted with their account (anonymous or not).
 */
export const games = pgTable(
	"games",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/** GameMode */
		mode: text("mode").notNull(),
		/** Daily challenge day; null for the other modes. */
		dayKey: date("day_key", { mode: "string" }).references(
			() => dailyChallenges.dayKey,
		),
		/** "playing" | "finished" | "abandoned" */
		status: text("status").notNull().default("playing"),
		totalScore: integer("total_score").notNull().default(0),
		roundsPlayed: integer("rounds_played").notNull().default(0),
		misses: integer("misses").notNull().default(0),
		streak: integer("streak").notNull().default(0),
		maxStreak: integer("max_streak").notNull().default(0),
		bestRound: integer("best_round").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		finishedAt: timestamp("finished_at", { withTimezone: true }),
	},
	(table) => [
		// Your games by mode, and your open game.
		index("games_user_mode_idx").on(table.userId, table.mode, table.status),
		// One daily challenge per player and day.
		uniqueIndex("games_daily_user_idx")
			.on(table.dayKey, table.userId)
			.where(sql`${table.dayKey} is not null`),
		// Leaderboards: finished games of a mode in a period.
		index("games_mode_finished_idx")
			.on(table.mode, table.finishedAt)
			.where(sql`${table.status} = 'finished'`),
	],
);

/**
 * One round: the target, when it was shown, and the player's answer.
 * Channels are stored as columns so stats can average errors per channel.
 */
export const rounds = pgTable(
	"rounds",
	{
		gameId: uuid("game_id")
			.notNull()
			.references(() => games.id, { onDelete: "cascade" }),
		/** 0-based. */
		index: integer("index").notNull(),
		targetH: doublePrecision("target_h").notNull(),
		targetS: doublePrecision("target_s").notNull(),
		targetL: doublePrecision("target_l").notNull(),
		memorizeMs: integer("memorize_ms").notNull(),
		/** When the server sent the color: the memorize clock starts here. */
		issuedAt: timestamp("issued_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		guessH: doublePrecision("guess_h"),
		guessS: doublePrecision("guess_s"),
		guessL: doublePrecision("guess_l"),
		/** 0..100, null until answered. */
		score: integer("score"),
		answeredAt: timestamp("answered_at", { withTimezone: true }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.index] })],
);
