import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { SwatchCard } from "@/components/swatch/SwatchCard";
import { colorName } from "@/lib/color-name";
import { formatNumber, modeLabel } from "@/lib/i18n";
import { type GameMode, roundsForMode } from "@/lib/modes";
import { isMotionReduced } from "@/lib/motion";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import type { AnsweredRound } from "@/server/games-store";

const COUNT_MS = 800;
const ROW_STAGGER_MS = 60;
/** Stagger only the first rows: long endless games shouldn't drag. */
const STAGGERED_ROWS = 8;

/** Counts up to `value` over COUNT_MS (straight to it with reduced motion). */
function useCountUp(value: number) {
	const [shown, setShown] = useState(0);
	useEffect(() => {
		if (isMotionReduced() || value === 0) {
			setShown(value);
			return;
		}
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / COUNT_MS);
			// Ease out: fast at first, settling on the total.
			setShown(Math.round(value * (1 - (1 - t) ** 3)));
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [value]);
	return shown;
}

interface PaletteSummaryProps {
	mode: GameMode;
	rounds: AnsweredRound[];
	total: number;
	bestRound: number;
	maxStreak: number;
	/** Today's rank on the daily board, when the player appears on it. */
	rank: number | null;
	note?: string;
	onPlayAgain?: () => void;
	/** Share controls (daily only). */
	share?: ReactNode;
}

/**
 * The end of a game as a palette: each target next to your attempt, with
 * the target's name and the round's score. Rows deal in one after another
 * while the total counts up.
 */
export function PaletteSummary({
	mode,
	rounds,
	total,
	bestRound,
	maxStreak,
	rank,
	note,
	onPlayAgain,
	share,
}: PaletteSummaryProps) {
	const locale = getLocale();
	const shown = useCountUp(total);
	const max = Number.isFinite(roundsForMode(mode))
		? roundsForMode(mode) * 100
		: rounds.length * 100;

	return (
		<div>
			<p className="text-sm font-semibold text-ink-muted">
				{modeLabel(mode)} · {m.final_score()}
			</p>
			<p className="mt-1 flex items-baseline gap-3">
				{/* Screen readers get the total, not every number of the count-up. */}
				<span className="sr-only">{formatNumber(total)}</span>
				<span
					aria-hidden="true"
					className="text-6xl font-bold tracking-tight tabular-nums"
				>
					{formatNumber(shown)}
				</span>
				<span className="text-lg text-ink-muted tabular-nums">
					/ {formatNumber(max)}
				</span>
			</p>
			{rank !== null && (
				<p className="mt-1 text-sm">{m.final_rank_today({ rank })}</p>
			)}
			{note && <p className="mt-3 text-sm text-ink-muted">{note}</p>}

			<ol
				className={`mt-8 space-y-2 ${rounds.length > 12 ? "max-h-[55vh] overflow-y-auto pr-1" : ""}`}
			>
				{rounds.map((round, i) => (
					<li
						key={round.index}
						className="flex animate-rise-in items-center gap-3 rounded-xl bg-card p-2 shadow-[var(--shadow-card)]"
						style={{
							animationDelay: `${Math.min(i, STAGGERED_ROWS) * ROW_STAGGER_MS}ms`,
						}}
					>
						<SwatchCard
							color={round.target}
							size="sm"
							title={m.result_target()}
						/>
						<SwatchCard
							color={round.guess}
							size="sm"
							title={m.result_your_color()}
						/>
						<span className="min-w-0 flex-1">
							<span className="block truncate text-sm font-semibold">
								{colorName(round.target, locale)}
							</span>
							<span className="block text-xs text-ink-muted">
								{m.round({ round: round.index + 1 })}
							</span>
						</span>
						<span className="pr-2 text-xl font-bold tabular-nums">
							{round.score}
						</span>
					</li>
				))}
			</ol>

			<dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
				<div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
					<dt className="text-xs text-ink-muted">{m.final_best_round()}</dt>
					<dd className="font-semibold tabular-nums">
						{formatNumber(bestRound)}
					</dd>
				</div>
				<div className="rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]">
					<dt className="text-xs text-ink-muted">{m.final_max_streak()}</dt>
					<dd className="font-semibold tabular-nums">
						×{formatNumber(maxStreak)}
					</dd>
				</div>
			</dl>

			<div className="mt-8 flex flex-wrap items-center gap-4">
				{share}
				{onPlayAgain && (
					<button
						type="button"
						onClick={onPlayAgain}
						className="rounded-xl bg-ink px-6 py-3 font-semibold text-paper transition-opacity hover:opacity-85"
					>
						{m.final_play_again()}
					</button>
				)}
				<Link
					to={mode === "daily" ? "/leaderboard" : "/"}
					className="rounded-xl bg-muted px-6 py-3 font-semibold transition-colors hover:bg-border"
				>
					{mode === "daily" ? m.leaderboard_link() : m.final_home()}
				</Link>
			</div>
		</div>
	);
}
