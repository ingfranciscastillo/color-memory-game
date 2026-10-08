import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { ColorPicker } from "@/components/ColorPicker";
import { FinalScore } from "@/components/FinalScore";
import { RoundStrip } from "@/components/game/RoundStrip";
import { Stage } from "@/components/game/Stage";
import { MemorizePhase } from "@/components/MemorizePhase";
import { PageHeader } from "@/components/PageHeader";
import { ResultPanel } from "@/components/ResultPanel";
import { SwatchCard } from "@/components/swatch/SwatchCard";
import { type HSL, hslToCss } from "@/lib/color";
import { localizedHead, modeLabel } from "@/lib/i18n";
import { type GameMode, isGameMode } from "@/lib/modes";
import { isMotionReduced } from "@/lib/motion";
import { useColorMemoryGame } from "@/lib/useColorMemoryGame";
import { m } from "@/paraglide/messages.js";

export const Route = createFileRoute("/play")({
	validateSearch: (search: Record<string, unknown>): { mode: GameMode } => ({
		mode: isGameMode(search.mode) ? (search.mode as GameMode) : "classic",
	}),
	head: () => {
		const localized = localizedHead("/play");
		return {
			meta: [
				{ title: m.play_title() },
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

function Play() {
	const { mode } = Route.useSearch();
	const game = useColorMemoryGame(mode);
	const isEndless = mode === "endless";

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
				<div className="mt-12">
					<FinalScore
						totalScore={game.totalScore}
						bestRound={game.bestRound}
						maxStreak={game.maxStreak}
						roundsPlayed={game.roundsPlayed}
						onPlayAgain={mode === "daily" ? undefined : game.reset}
						note={mode === "daily" ? m.daily_done() : undefined}
					/>
				</div>
				{errorBlock}
			</main>
		);
	}

	return (
		<Stage>
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
