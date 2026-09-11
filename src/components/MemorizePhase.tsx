import { type HSL, hslToCss } from "@/lib/color";

export function MemorizePhase({
	color,
	remaining,
	round,
	totalRounds,
}: {
	color: HSL;
	remaining: number;
	round: number;
	totalRounds: number;
}) {
	return (
		<div
			className="fixed inset-0 z-10 animate-fade-in"
			style={{ backgroundColor: hslToCss(color) }}
		>
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 sm:p-10">
				<span className="text-xs uppercase tracking-[0.3em] mix-blend-difference text-white">
					Round {round}
					{Number.isFinite(totalRounds) ? ` / ${totalRounds}` : ""}
				</span>
				<span className="font-mono text-sm tabular-nums mix-blend-difference text-white sm:text-base">
					{remaining.toFixed(1)}s
				</span>
			</div>
		</div>
	);
}
