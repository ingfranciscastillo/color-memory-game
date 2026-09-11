import { Link } from "@tanstack/react-router";

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
		["Best round", `${bestRound}`],
		["Max streak", `×${maxStreak}`],
		["Rounds played", `${roundsPlayed}`],
	] as const;

	return (
		<div className="animate-fade-in">
			<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
				Final score
			</p>
			<p className="mt-4 text-7xl font-light tabular-nums sm:text-8xl">
				{totalScore.toLocaleString()}
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
					Play again
				</button>
				<Link
					to="/"
					className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:underline"
				>
					Home
				</Link>
			</div>
		</div>
	);
}
