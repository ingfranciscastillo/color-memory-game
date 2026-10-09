import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ColorPicker } from "@/components/ColorPicker";
import { PaletteSummary } from "@/components/game/PaletteSummary";
import { RoundStrip } from "@/components/game/RoundStrip";
import { ShareSheet } from "@/components/game/ShareSheet";
import { Stage } from "@/components/game/Stage";
import { MemorizePhase } from "@/components/MemorizePhase";
import { PageHeader } from "@/components/PageHeader";
import { ResultPanel } from "@/components/ResultPanel";
import { SwatchCard } from "@/components/swatch/SwatchCard";
import { useKeepFocus } from "@/hooks/useKeepFocus";
import { type HSL, hslToCss } from "@/lib/color";
import { colorName } from "@/lib/color-name";
import { formatPercent, localizedHead, modeLabel } from "@/lib/i18n";
import { type GameMode, isGameMode, todayKey } from "@/lib/modes";
import { isMotionReduced } from "@/lib/motion";
import { EXCELLENT_SCORE } from "@/lib/stats";
import { type Phase, useColorMemoryGame } from "@/lib/useColorMemoryGame";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import type { GuessResult } from "@/server/games-store";
import { getLeaderboard } from "@/server/leaderboard";

export const Route = createFileRoute("/play")({
	validateSearch: (search: Record<string, unknown>): { mode: GameMode } => ({
		mode: isGameMode(search.mode) ? (search.mode as GameMode) : "classic",
	}),
	head: () => {
		const localized = localizedHead("/play");
		return {
			meta: [
				{ title: m.play_title() },
				// The game screen has no content of its own until it loads a round:
				// keep it out of the index, but let crawlers follow its links.
				{ name: "robots", content: "noindex, follow" },
				{ name: "description", content: m.play_description() },
				{ property: "og:title", content: m.play_title() },
				{ property: "og:description", content: m.play_og_description() },
				...localized.meta,
			],
			// One canonical per language for all modes — the mode search param
			// doesn't change indexable content, so it shouldn't fragment ranking.
			links: localized.links,
		};
	},
	component: Play,
});

/** The complementary color: what an afterimage of `color` looks like. */
const complement = ({ h, s, l }: HSL): HSL => ({ h: (h + 180) % 360, s, l });

/** Your rank on today's daily board, once the game is over (null if hidden). */
function useDailyRank(active: boolean) {
	const [rank, setRank] = useState<number | null>(null);
	useEffect(() => {
		if (!active) return;
		let cancelled = false;
		getLeaderboard({ data: { board: "daily" } })
			.then((board) => {
				if (!cancelled) setRank(board.me?.rank ?? null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [active]);
	return rank;
}

/**
 * What screen readers hear when the phase changes: the same things sighted
 * players see appear (the color's name, the prompt, the score).
 */
function phaseAnnouncement(
	phase: Phase,
	target: HSL | null,
	result: GuessResult | null,
): string {
	if (phase === "memorize" && target) {
		return `${m.memorize_hint()}: ${colorName(target, getLocale())}`;
	}
	if (phase === "recreate") return m.recreate_prompt();
	if (phase === "result" && result) {
		const { score, differencePct } = result.result;
		return [
			`${score} ${m.stamp_out_of()}`,
			score >= EXCELLENT_SCORE ? m.stamp_nailed() : null,
			m.result_difference({ percent: formatPercent(differencePct) }),
		]
			.filter(Boolean)
			.join(" · ");
	}
	return "";
}

function Play() {
	const { mode } = Route.useSearch();
	const game = useColorMemoryGame(mode);
	const isEndless = mode === "endless";
	const rank = useDailyRank(mode === "daily" && game.phase === "final");
	const heading = useRef<HTMLHeadingElement>(null);
	useKeepFocus(heading, game.phase);
	const announcement = useMemo(
		() => phaseAnnouncement(game.phase, game.target, game.result),
		[game.phase, game.target, game.result],
	);

	const errorBlock = game.error && (
		<div role="alert" className="mt-6 animate-rise-in space-y-3 text-center">
			<p className="text-sm font-medium">{game.error}</p>
			<button
				type="button"
				onClick={game.retry}
				disabled={game.busy}
				className="text-sm font-semibold underline underline-offset-4 disabled:opacity-45"
			>
				{m.retry()}
			</button>
		</div>
	);

	if (game.phase === "final") {
		return (
			<main className="mx-auto min-h-screen max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
				<PageHeader />
				<div className="mt-10">
					<PaletteSummary
						mode={mode}
						rounds={game.history}
						total={game.totalScore}
						bestRound={game.bestRound}
						maxStreak={game.maxStreak}
						rank={rank}
						note={mode === "daily" ? m.daily_done() : undefined}
						onPlayAgain={mode === "daily" ? undefined : game.reset}
						share={
							mode === "daily" && game.history.length > 0 ? (
								<ShareSheet
									dayKey={todayKey()}
									scores={game.history.map((round) => round.score)}
									total={game.totalScore}
								/>
							) : undefined
						}
					/>
				</div>
				{errorBlock}
			</main>
		);
	}

	const roundLabel = isEndless
		? m.round({ round: game.roundIndex + 1 })
		: m.round_of({ round: game.roundIndex + 1, total: game.totalRounds });

	return (
		<Stage>
			<h1 ref={heading} tabIndex={-1} className="sr-only">
				{modeLabel(mode)} · {roundLabel}
			</h1>
			{/* Mounted for the whole game, so every change is read out. */}
			<p aria-live="polite" className="sr-only">
				{announcement}
			</p>
			<header className="mx-auto w-full max-w-md px-5 pt-5">
				<div className="flex items-center justify-between gap-4 text-sm font-semibold">
					<Link
						to="/"
						className="flex items-center gap-2 transition-opacity hover:opacity-75"
					>
						<BrandMark size={24} />
						{modeLabel(mode)}
					</Link>
					{isEndless && (
						<span className="tabular-nums">
							{m.streak({ count: game.streak })}
						</span>
					)}
				</div>
				<div className="mt-4">
					<RoundStrip
						scores={game.history.map((round) => round.score)}
						total={game.totalRounds}
						current={game.roundIndex}
					/>
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-8">
				{(game.phase === "loading" || game.phase === "error") && (
					<SwatchCard
						color={null}
						size="lg"
						title={game.phase === "loading" ? m.loading() : modeLabel(mode)}
						viewTransitionName="swatch"
					/>
				)}

				{game.phase === "memorize" && game.target && (
					<MemorizePhase
						color={game.target}
						remaining={game.remaining}
						duration={game.duration}
					/>
				)}

				{game.phase === "recreate" && (
					<div className="flex w-full flex-col items-center">
						<SwatchCard
							color={game.guess}
							size="md"
							title={m.result_your_color()}
							subtitle={m.recreate_prompt()}
							viewTransitionName="swatch"
						>
							{/* One soft flash of the afterimage as the target leaves. */}
							{game.target && !isMotionReduced() && (
								<span
									aria-hidden="true"
									className="absolute inset-0 animate-afterimage opacity-0"
									style={{ backgroundColor: hslToCss(complement(game.target)) }}
								/>
							)}
						</SwatchCard>
						<div className="mt-6 w-full">
							<ColorPicker value={game.guess} onChange={game.setGuess} />
						</div>
						<button
							type="button"
							onClick={game.check}
							disabled={game.busy}
							aria-busy={game.busy}
							className="mt-6 w-full rounded-xl bg-[#1a1a1a] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
						>
							{m.check()}
						</button>
					</div>
				)}

				{game.phase === "result" && game.result && (
					<ResultPanel
						target={game.result.target}
						guess={game.result.guess}
						result={game.result.result}
						streak={game.streak}
						onNext={game.next}
						onFinish={game.finish}
						isEndless={isEndless}
						isLastRound={game.result.finished}
						busy={game.busy}
					/>
				)}

				{errorBlock}
			</main>
		</Stage>
	);
}
