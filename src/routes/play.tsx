import { createFileRoute, Link } from "@tanstack/react-router";
import { ColorPicker } from "@/components/ColorPicker";
import { FinalScore } from "@/components/FinalScore";
import { MemorizePhase } from "@/components/MemorizePhase";
import { ResultPanel } from "@/components/ResultPanel";
import { localizedHead, modeLabel } from "@/lib/i18n";
import { type GameMode, isGameMode } from "@/lib/modes";
import { SITE_NAME } from "@/lib/seo";
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
					{SITE_NAME}
				</Link>
				<span className="text-xs uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
					{modeLabel(mode)}
					{isEndless && game.phase !== "final"
						? ` · ${m.streak({ count: game.streak })}`
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
					<div className="animate-rise-in">
						<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
							{m.recreate_prompt()}
						</p>
						<div className="mt-8">
							<ColorPicker value={game.guess} onChange={game.setGuess} />
						</div>
						<button
							type="button"
							onClick={game.check}
							className="mt-10 w-full bg-foreground px-10 py-5 text-xs uppercase tracking-[0.4em] text-background transition-opacity hover:opacity-80 sm:w-auto"
						>
							{m.check()}
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
