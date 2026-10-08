import { SwatchCard } from "@/components/swatch/SwatchCard";
import type { HSL } from "@/lib/color";
import { colorName } from "@/lib/color-name";
import { formatSeconds } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";

/**
 * The target as a large swatch with its name. Time drains as a thin line
 * along the block's bottom edge, with the seconds in the label: no big
 * numbers over the color.
 */
export function MemorizePhase({
	color,
	remaining,
	duration,
}: {
	color: HSL;
	remaining: number;
	duration: number;
}) {
	const left =
		duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;

	return (
		<SwatchCard
			color={color}
			size="lg"
			title={colorName(color, getLocale())}
			subtitle={m.memorize_hint()}
			footer={
				<>
					<span>Color Memory</span>
					<span role="timer" aria-live="off">
						{formatSeconds(remaining)}
					</span>
				</>
			}
			viewTransitionName="swatch"
		>
			<span
				aria-hidden="true"
				className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/85"
				style={{ transform: `scaleX(${left})` }}
			/>
		</SwatchCard>
	);
}
