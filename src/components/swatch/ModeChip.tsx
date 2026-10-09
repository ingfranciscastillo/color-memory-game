import { modeLabel } from "@/lib/i18n";
import { type GameMode, MODE_COLORS } from "@/lib/modes";

/**
 * A mode's name with a tiny chip of its identity color. The color only
 * decorates: the name is always there, so it never carries meaning alone.
 */
export function ModeChip({ mode }: { mode: GameMode }) {
	const colors = MODE_COLORS[mode];
	return (
		<span className="inline-flex items-center gap-2 align-middle">
			<span
				aria-hidden="true"
				className="flex h-3 w-2.5 shrink-0 flex-col overflow-hidden rounded-[2px]"
			>
				{colors.map((color) => (
					<span
						key={color}
						className="flex-1"
						style={{ backgroundColor: color }}
					/>
				))}
			</span>
			{modeLabel(mode)}
		</span>
	);
}
