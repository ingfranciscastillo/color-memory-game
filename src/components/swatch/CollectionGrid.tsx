import { useEffect, useState } from "react";
import { colorName } from "@/lib/color-name";
import { formatNumber } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import { getCollection } from "@/server/collection";
import type { CollectionItem } from "@/server/collection-store";
import { SwatchCard } from "./SwatchCard";

/**
 * Your sample deck: every color you nailed, as small swatches with their
 * names, newest first, loaded a page at a time.
 */
export function CollectionGrid({ userId }: { userId: string }) {
	const [items, setItems] = useState<CollectionItem[] | null>(null);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	const locale = getLocale();

	// biome-ignore lint/correctness/useExhaustiveDependencies: userId is the trigger: start over when the player changes.
	useEffect(() => {
		let cancelled = false;
		getCollection({ data: { page: 0 } })
			.then((result) => {
				if (cancelled) return;
				setItems(result?.items ?? []);
				setTotal(result?.total ?? 0);
				setPage(0);
			})
			.catch(() => !cancelled && setItems([]));
		return () => {
			cancelled = true;
		};
	}, [userId]);

	const more = async () => {
		setLoading(true);
		setFailed(false);
		try {
			const result = await getCollection({ data: { page: page + 1 } });
			if (result) {
				setItems((current) => [...(current ?? []), ...result.items]);
				setPage(result.page);
			}
		} catch {
			// The button stays, so trying again is one click.
			setFailed(true);
		} finally {
			setLoading(false);
		}
	};

	if (items === null) return null;

	return (
		<div>
			<p className="text-sm text-ink-muted">
				{items.length === 0
					? m.collection_empty()
					: m.collection_count({ count: formatNumber(total) })}
			</p>
			{items.length > 0 && (
				<ul className="mt-4 grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6">
					{items.map((item) => {
						const name = colorName(item.target, locale);
						return (
							<li
								key={`${item.at}-${item.target.h}-${item.target.s}-${item.target.l}`}
								className="flex flex-col items-center"
							>
								<SwatchCard color={item.target} size="sm" title={name} />
								<span
									aria-hidden="true"
									className="mt-1.5 line-clamp-2 text-center text-xs leading-tight"
								>
									{name}
								</span>
							</li>
						);
					})}
				</ul>
			)}
			{items.length < total && (
				<button
					type="button"
					onClick={more}
					disabled={loading}
					className="mt-4 text-sm font-semibold underline underline-offset-4 disabled:opacity-45"
				>
					{m.collection_more()}
				</button>
			)}
			{failed && (
				<p role="alert" className="mt-2 text-sm text-destructive">
					{m.error_network()}
				</p>
			)}
		</div>
	);
}
