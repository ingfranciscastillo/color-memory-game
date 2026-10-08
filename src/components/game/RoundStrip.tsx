import { m } from "@/paraglide/messages.js";

/** Endless shows only the most recent rounds. */
const ENDLESS_VISIBLE = 8;

/**
 * One cell per round, filled once the round is scored. White cells on the
 * gray stage (no color: they sit next to the target).
 */
export function RoundStrip({
	scores,
	total,
	current,
}: {
	/** Scores of the rounds played so far, in order. */
	scores: number[];
	/** Rounds in the game; Infinity in endless. */
	total: number;
	/** 0-based index of the round on screen. */
	current: number;
}) {
	const endless = !Number.isFinite(total);
	const count = endless ? ENDLESS_VISIBLE : total;
	const offset = endless ? Math.max(0, current + 1 - ENDLESS_VISIBLE) : 0;

	return (
		<ol
			aria-label={
				endless
					? m.round({ round: current + 1 })
					: m.round_of({ round: current + 1, total })
			}
			className="flex gap-1"
		>
			{Array.from({ length: count }, (_, i) => {
				const index = offset + i;
				const score = scores[index];
				const done = score !== undefined;
				return (
					<li
						key={index}
						className={`h-2 flex-1 rounded-sm transition-colors duration-300 ${
							done
								? "bg-white"
								: index === current
									? "bg-white/50"
									: "bg-black/15"
						}`}
					>
						{done && <span className="sr-only">{score}</span>}
					</li>
				);
			})}
		</ol>
	);
}
