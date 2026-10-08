CREATE TABLE "daily_challenges" (
	"day_key" date PRIMARY KEY NOT NULL,
	"colors" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"day_key" date,
	"status" text DEFAULT 'playing' NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"rounds_played" integer DEFAULT 0 NOT NULL,
	"misses" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"best_round" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"game_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"target_h" double precision NOT NULL,
	"target_s" double precision NOT NULL,
	"target_l" double precision NOT NULL,
	"memorize_ms" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guess_h" double precision,
	"guess_s" double precision,
	"guess_l" double precision,
	"score" integer,
	"answered_at" timestamp with time zone,
	CONSTRAINT "rounds_game_id_index_pk" PRIMARY KEY("game_id","index")
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_day_key_daily_challenges_day_key_fk" FOREIGN KEY ("day_key") REFERENCES "public"."daily_challenges"("day_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_user_mode_idx" ON "games" USING btree ("user_id","mode","status");--> statement-breakpoint
CREATE UNIQUE INDEX "games_daily_user_idx" ON "games" USING btree ("day_key","user_id") WHERE "games"."day_key" is not null;--> statement-breakpoint
CREATE INDEX "games_mode_finished_idx" ON "games" USING btree ("mode","finished_at") WHERE "games"."status" = 'finished';