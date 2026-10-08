import { useMemo } from "react";
import { EXCELLENT_SCORE } from "@/lib/stats";
import { m } from "@/paraglide/messages.js";

/** Paper confetti directions for a nailed round (dx, dy, spin). */
const CONFETTI: [string, string, string][] = [
	["-46px", "-34px", "-120deg"],
	["44px", "-40px", "150deg"],
	["-34px", "38px", "90deg"],
	["40px", "30px", "-80deg"],
];

/**
 * The round's score, stamped onto the result like an ink seal. At
 * EXCELLENT_SCORE or more it becomes "Nailed it" with four bits of paper
 * (white and ink only: it sits next to the colors being compared).
 */
export function ScoreStamp({
	score,
	delayMs = 0,
}: {
	score: number;
	/** Wait for the cards to land before stamping. */
	delayMs?: number;
}) {
	const nailed = score >= EXCELLENT_SCORE;
	const pieces = useMemo(() => (nailed ? CONFETTI : []), [nailed]);

	return (
		<div className="relative">
			{pieces.map(([dx, dy, spin]) => (
				<span
					key={`${dx}${dy}`}
					aria-hidden="true"
					className="absolute top-1/2 left-1/2 size-2.5 animate-confetti rounded-[2px] bg-white opacity-0 shadow-sm"
					style={{
						animationDelay: `${delayMs + 260}ms`,
						["--dx" as string]: dx,
						["--dy" as string]: dy,
						["--spin" as string]: spin,
					}}
				/>
			))}
			<div
				role="img"
				aria-label={`${score} / 100${nailed ? ` · ${m.stamp_nailed()}` : ""}`}
				style={{ animationDelay: `${delayMs}ms` }}
				className={`flex size-24 animate-stamp-drop flex-col items-center justify-center rounded-full border-[3px] border-[#1a1a1a] ${
					nailed ? "bg-[#1a1a1a] text-white" : "bg-white text-[#1a1a1a]"
				}`}
			>
				<span className="text-3xl font-extrabold leading-none tabular-nums">
					{score}
				</span>
				<span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
					{nailed ? m.stamp_nailed() : m.stamp_out_of()}
				</span>
			</div>
		</div>
	);
}
