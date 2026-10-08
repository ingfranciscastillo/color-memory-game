interface DeckCardProps {
	/** One color fills the block; several (the daily) stack as bands. */
	colors: readonly string[];
	title: string;
	description: string;
	/** Extra line, e.g. "Today · streak ×4". */
	meta?: string;
	selected: boolean;
}

/**
 * A long fan-deck card with a punched hole, like a painter's sample deck.
 * Presentational only: ModeFan positions, rotates and selects it.
 */
export function DeckCard({
	colors,
	title,
	description,
	meta,
	selected,
}: DeckCardProps) {
	return (
		<span
			className={`relative flex h-full w-full flex-col rounded-xl bg-card p-2 text-left text-ink transition-shadow duration-200 ${
				selected
					? "shadow-[0_0_0_2px_var(--ink),var(--shadow-card-lifted)]"
					: "shadow-[var(--shadow-card)]"
			}`}
		>
			<span className="flex h-[58%] flex-col overflow-hidden rounded-lg">
				{colors.map((color) => (
					<span
						key={color}
						className="block flex-1"
						style={{ backgroundColor: color }}
					/>
				))}
			</span>
			<span className="mt-2 block px-0.5 text-sm font-semibold leading-tight">
				{title}
			</span>
			<span className="mt-1 block px-0.5 text-[0.7rem] leading-snug text-ink-muted">
				{description}
			</span>
			{meta && (
				<span className="mt-1 block px-0.5 text-[0.7rem] font-medium leading-snug">
					{meta}
				</span>
			)}
			{/* The punched hole that holds the deck together. */}
			<span
				aria-hidden="true"
				className="absolute bottom-2.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-paper shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]"
			/>
		</span>
	);
}
