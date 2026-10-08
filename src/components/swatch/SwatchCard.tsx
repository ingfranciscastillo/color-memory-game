import type { CSSProperties, ReactNode } from "react";
import { type HSL, hslToCss } from "@/lib/color";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { card: string; block: string; label: string }> = {
	sm: {
		card: "w-16 rounded-md p-1",
		block: "h-12 rounded-sm",
		label: "px-0.5 pt-1",
	},
	md: {
		card: "w-40 rounded-lg p-1.5 sm:w-48",
		block: "h-44 rounded-md sm:h-56",
		label: "px-1 pt-2",
	},
	lg: {
		card: "w-[min(22rem,100%)] rounded-xl p-2",
		block: "h-[min(52vh,22rem)] rounded-lg",
		label: "px-1.5 pt-3 pb-1",
	},
};

interface SwatchCardProps {
	/** The block's color; null shows a blank block (recreate phase). */
	color: HSL | null;
	size: Size;
	title: string;
	subtitle?: string;
	/** Small line at the bottom of the label (brand, score, code). */
	footer?: ReactNode;
	/** Overlays inside the color block: the timer line, the stamp. */
	children?: ReactNode;
	viewTransitionName?: string;
	className?: string;
	style?: CSSProperties;
}

/**
 * The classic paint chip: a color block on a white label with an invented
 * name. Every color in the game is one of these. The label always uses the
 * card and ink tokens, so text never sits on the color itself.
 */
export function SwatchCard({
	color,
	size,
	title,
	subtitle,
	footer,
	children,
	viewTransitionName,
	className = "",
	style,
}: SwatchCardProps) {
	const s = SIZES[size];
	return (
		<figure
			className={`bg-card text-ink shadow-[var(--shadow-card)] ${s.card} ${className}`}
			style={{ viewTransitionName, ...style }}
		>
			<div
				className={`relative overflow-hidden transition-colors duration-150 ${s.block} ${
					color ? "" : "bg-muted"
				}`}
				style={color ? { backgroundColor: hslToCss(color) } : undefined}
			>
				{children}
			</div>
			{size !== "sm" ? (
				<figcaption className={s.label}>
					<span
						className={`block font-semibold leading-tight ${size === "lg" ? "text-lg" : "text-sm"}`}
					>
						{title}
					</span>
					{subtitle && (
						<span className="mt-0.5 block text-xs text-ink-muted tabular-nums">
							{subtitle}
						</span>
					)}
					{footer && (
						<span className="mt-2 flex justify-between text-[0.65rem] uppercase tracking-[0.12em] text-ink-muted tabular-nums">
							{footer}
						</span>
					)}
				</figcaption>
			) : (
				<figcaption className="sr-only">{title}</figcaption>
			)}
		</figure>
	);
}
