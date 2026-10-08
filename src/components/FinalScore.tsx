import { Link } from "@tanstack/react-router";
import { formatNumber } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";

export function FinalScore({
	totalScore,
	bestRound,
	maxStreak,
	roundsPlayed,
	onPlayAgain,
}: {
	totalScore: number;
	bestRound: number;
	maxStreak: number;
	roundsPlayed: number;
	onPlayAgain: () => void;
}) {
	const rows = [
		[m.final_best_round(), formatNumber(bestRound)],
		[m.final_max_streak(), `×${formatNumber(maxStreak)}`],
		[m.final_rounds_played(), formatNumber(roundsPlayed)],
	] as const;

	return (
		<div className="animate-rise-in">
			<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
				{m.final_score()}
			</p>
			<p className="mt-4 text-7xl font-light tabular-nums sm:text-8xl">
				{formatNumber(totalScore)}
			</p>

			<dl className="mt-14 divide-y divide-border border-y border-border">
				{rows.map(([label, value]) => (
					<div key={label} className="flex items-baseline justify-between py-4">
						<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
							{label}
						</dt>
						<dd className="tabular-nums">{value}</dd>
					</div>
				))}
			</dl>

			<div className="mt-12 flex items-center gap-8">
				<button
					type="button"
					onClick={onPlayAgain}
					className="bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-80"
				>
					{m.final_play_again()}
				</button>
				<Link
					to="/"
					className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:underline"
				>
					{m.final_home()}
				</Link>
			</div>
		</div>
	);
}
