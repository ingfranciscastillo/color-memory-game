import { createFileRoute, Link } from "@tanstack/react-router";
import { ColorPicker } from "@/components/ColorPicker";
import { FinalScore } from "@/components/FinalScore";
import { MemorizePhase } from "@/components/MemorizePhase";
import { ResultPanel } from "@/components/ResultPanel";
import { type GameMode, isGameMode, MODE_LABELS } from "@/lib/modes";
import { SITE_URL } from "@/lib/seo";
import { useColorMemoryGame } from "@/lib/useColorMemoryGame";

export const Route = createFileRoute("/play")({
	validateSearch: (search: Record<string, unknown>): { mode: GameMode } => ({
		mode: isGameMode(search.mode) ? (search.mode as GameMode) : "classic",
	}),
	head: () => ({
		meta: [
			{ title: "Play — Color Memory" },
			{
				name: "description",
				content:
					"Memorize a full-screen color, then rebuild it from memory and see how close you got.",
			},
			{ property: "og:title", content: "Play — Color Memory" },
			{
				property: "og:description",
				content: "Memorize a color, rebuild it, and score your perception.",
			},
			{
				property: "og:url",
				content: `${SITE_URL}/play`,
			},
		],
		links: [
			{
				// One canonical for all modes — the mode search param doesn't
				// change indexable content, so it shouldn't fragment ranking signals.
				rel: "canonical",
				href: `${SITE_URL}/play`,
			},
		],
	}),
	component: Play,
});

function Play() {
	const { mode } = Route.useSearch();
	const game = useColorMemoryGame(mode);
	const isEndless = mode === "endless";
	const isLastRound = !isEndless && game.roundIndex + 1 >= game.totalRounds;

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<header className="flex items-baseline justify-between">
				<Link
					to="/"
					className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:underline"
				>
					Color Memory
				</Link>
				<span className="text-xs uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
					{MODE_LABELS[mode]}
					{isEndless && game.phase !== "final"
						? ` · Streak ×${game.streak}`
						: ""}
				</span>
			</header>

			<div className="mt-16">
				{game.phase === "memorize" && game.target && (
					<MemorizePhase
						color={game.target}
						remaining={game.remaining}
						round={game.roundIndex + 1}
						totalRounds={game.totalRounds}
					/>
				)}

				{game.phase === "recreate" && (
					<div className="animate-fade-in">
						<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
							Recreate the color
						</p>
						<div className="mt-8">
							<ColorPicker value={game.guess} onChange={game.setGuess} />
						</div>
						<button
							type="button"
							onClick={game.check}
							className="mt-10 w-full bg-foreground px-10 py-5 text-xs uppercase tracking-[0.4em] text-background transition-opacity hover:opacity-80 sm:w-auto"
						>
							Check
						</button>
					</div>
				)}

				{game.phase === "result" && game.target && game.result && (
					<ResultPanel
						target={game.target}
						guess={game.guess}
						result={game.result}
						streak={game.streak}
						onNext={game.next}
						onFinish={game.finish}
						isEndless={isEndless}
						isLastRound={isLastRound}
					/>
				)}

				{game.phase === "final" && (
					<FinalScore
						totalScore={game.totalScore}
						bestRound={game.bestRound}
						maxStreak={game.maxStreak}
						roundsPlayed={game.roundsPlayed}
						onPlayAgain={game.reset}
					/>
				)}
			</div>
		</main>
	);
}
