import { formatNumber } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";

const CHART_HEIGHT = 160;

const rangeLabel = (index: number, buckets: number) =>
	index === buckets - 1
		? `${index * 10}–100`
		: `${index * 10}–${index * 10 + 9}`;

/**
 * Histogram of round scores. One series, so no legend: the heading names it.
 * Each bar is a list item whose text ("0–9: 6 rounds") screen readers read;
 * sighted players see the same text as a tooltip on hover or focus.
 */
export function ScoreDistribution({
	distribution,
	headingId,
}: {
	distribution: number[];
	headingId: string;
}) {
	const max = Math.max(1, ...distribution);
	const buckets = distribution.length;

	return (
		// pt-10: room for the tallest bar's tooltip.
		<figure aria-labelledby={headingId} className="pt-10">
			<ol
				className="flex items-end gap-0.5 border-b border-border"
				style={{ height: CHART_HEIGHT }}
			>
				{distribution.map((count, index) => {
					const label = m.stats_distribution_bar({
						range: rangeLabel(index, buckets),
						count: formatNumber(count),
					});
					return (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed buckets.
							key={index}
							// biome-ignore lint/a11y/noNoninteractiveTabindex: focus shows the bar's value, like hover.
							tabIndex={0}
							className="group relative flex h-full flex-1 items-end outline-none"
						>
							<span className="sr-only">{label}</span>
							<span
								aria-hidden="true"
								className="block w-full rounded-t-sm bg-ink transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70"
								style={{
									height: count ? `${(count / max) * 100}%` : 0,
									minHeight: count ? 2 : 0,
								}}
							/>
							<span
								aria-hidden="true"
								className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-3 py-2 shadow-(--shadow-card) text-xs tabular-nums group-hover:block group-focus-visible:block"
							>
								{label}
							</span>
						</li>
					);
				})}
			</ol>
			<div
				className="mt-2 flex justify-between text-xs text-ink-muted tabular-nums"
				aria-hidden="true"
			>
				<span>0</span>
				<span>50</span>
				<span>100</span>
			</div>
		</figure>
	);
}
