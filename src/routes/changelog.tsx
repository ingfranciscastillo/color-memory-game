import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CHANGELOG, type ChangeKind } from "@/content/changelog";
import { localizedHead } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";

export const Route = createFileRoute("/changelog")({
	head: () => {
		const localized = localizedHead("/changelog");
		return {
			meta: [
				{ title: m.changelog_title() },
				{ name: "description", content: m.changelog_description() },
				{ property: "og:type", content: "article" },
				{ property: "og:title", content: m.changelog_title() },
				{ property: "og:description", content: m.changelog_description() },
				...localized.meta,
			],
			links: localized.links,
		};
	},
	component: ChangelogPage,
});

const KIND_LABEL: Record<ChangeKind, () => string> = {
	added: m.change_added,
	improved: m.change_improved,
	fixed: m.change_fixed,
};

/** Staggered entrance: 60 ms per release, capped so long lists don't drag. */
const stagger = (index: number): CSSProperties => ({
	animationDelay: `${Math.min(index, 4) * 60}ms`,
});

function ChangelogPage() {
	const locale = getLocale();
	const dateFormat = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<PageHeader />
			<h1 className="mt-16 text-4xl font-light uppercase tracking-[0.2em]">
				{m.changelog_heading()}
			</h1>

			<div className="mt-12 divide-y divide-border border-y border-border">
				{CHANGELOG.map((release, index) => (
					<article
						key={release.version}
						aria-labelledby={`version-${release.version}`}
						className="animate-rise-in py-8"
						style={stagger(index)}
					>
						<header className="flex items-baseline justify-between gap-4">
							<h2
								id={`version-${release.version}`}
								className="text-sm uppercase tracking-[0.2em]"
							>
								{m.changelog_version({ version: release.version })}
							</h2>
							<time
								dateTime={release.date}
								className="text-xs text-muted-foreground tabular-nums"
							>
								{dateFormat.format(new Date(release.date))}
							</time>
						</header>
						<ul className="mt-5 space-y-3 text-sm">
							{release.changes.map((change) => (
								<li key={change.text.en} className="flex gap-4">
									<span className="w-16 shrink-0 pt-0.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
										{KIND_LABEL[change.kind]()}
									</span>
									<span>{change.text[locale]}</span>
								</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</main>
	);
}
