import { useMemo } from "react";
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
	const locale = getLocale();
	const name = useMemo(() => colorName(color, locale), [color, locale]);

	return (
		<SwatchCard
			color={color}
			size="lg"
			title={name}
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
				// Steps every tenth of a second; the transition glides between them.
				className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/85 transition-transform duration-100 ease-linear"
				style={{ transform: `scaleX(${left})` }}
			/>
		</SwatchCard>
	);
}
