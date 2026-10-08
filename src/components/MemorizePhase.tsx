import { useEffect } from "react";
import { type HSL, hslToCss, hslToHex } from "@/lib/color";
import { currentTheme, setThemeColor, THEME_COLORS } from "@/lib/theme";
import { m } from "@/paraglide/messages.js";

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
	// Tint the browser UI with the target too, so the color really fills the screen.
	useEffect(() => {
		setThemeColor(hslToHex(color));
		return () => setThemeColor(THEME_COLORS[currentTheme()]);
	}, [color]);

	return (
		<div
			className="fixed inset-0 z-10 animate-fade-in"
			style={{ backgroundColor: hslToCss(color) }}
		>
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 sm:p-10">
				<span className="text-xs uppercase tracking-[0.3em] mix-blend-difference text-white">
					{Number.isFinite(totalRounds)
						? m.round_of({ round, total: totalRounds })
						: m.round({ round })}
				</span>
				<span className="font-mono text-sm tabular-nums mix-blend-difference text-white sm:text-base">
					{remaining.toFixed(1)}s
				</span>
			</div>
		</div>
	);
}
