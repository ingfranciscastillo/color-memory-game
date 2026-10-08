import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SettingsBar } from "@/components/SettingsBar";
import {
	formatNumber,
	localizedHead,
	modeDescription,
	modeLabel,
} from "@/lib/i18n";
import { type GameMode, MODES } from "@/lib/modes";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { loadStats, type Stats } from "@/lib/storage";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";

export const Route = createFileRoute("/")({
	head: () => {
		const localized = localizedHead("/");
		return {
			meta: [
				{ title: m.site_title() },
				{ name: "description", content: m.site_description() },
				{ property: "og:title", content: m.site_title() },
				{ property: "og:description", content: m.site_description() },
				...localized.meta,
				{
					"script:ld+json": {
						"@context": "https://schema.org",
						"@type": "WebApplication",
						name: SITE_NAME,
						url: SITE_URL,
						description: m.site_description(),
						inLanguage: getLocale(),
						applicationCategory: "GameApplication",
						browserRequirements: "Requires JavaScript",
						offers: {
							"@type": "Offer",
							price: "0",
							priceCurrency: "USD",
						},
					},
				},
			],
			links: localized.links,
		};
	},
	component: Home,
});

function Home() {
	const [mode, setMode] = useState<GameMode>("classic");
	const [stats, setStats] = useState<Stats | null>(null);

	useEffect(() => {
		setStats(loadStats());
	}, []);

	return (
		<main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 sm:px-10">
			<h1 className="text-4xl font-light uppercase tracking-[0.2em] sm:text-6xl">
				Color
				<br />
				Memory
			</h1>
			<p className="mt-6 max-w-sm text-sm text-muted-foreground sm:text-base">
				{m.home_tagline()}
			</p>

			<div className="mt-14">
				<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
					{m.home_mode()}
				</p>
				<ul className="mt-4 divide-y divide-border border-y border-border">
					{MODES.map((option) => (
						<li key={option}>
							<button
								type="button"
								onClick={() => setMode(option)}
								aria-pressed={mode === option}
								className={`flex w-full items-baseline justify-between gap-6 py-4 text-left transition-opacity ${
									mode === option ? "" : "opacity-45 hover:opacity-80"
								}`}
							>
								<span className="text-sm uppercase tracking-[0.2em]">
									{modeLabel(option)}
								</span>
								<span className="text-right text-xs text-muted-foreground">
									{modeDescription(option)}
								</span>
							</button>
						</li>
					))}
				</ul>
			</div>

			<Link
				to="/play"
				search={{ mode }}
				className="mt-12 self-start bg-foreground px-12 py-5 text-xs uppercase tracking-[0.4em] text-background transition-opacity hover:opacity-80"
			>
				{m.home_play()}
			</Link>

			<p className="mt-10 text-xs uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
				{m.home_best({ score: formatNumber(stats?.bestScore ?? 0) })}
				{stats?.bestStreak ? ` · ${m.streak({ count: stats.bestStreak })}` : ""}
			</p>

			<div className="mt-16 border-t border-border pt-6">
				<SettingsBar />
			</div>
		</main>
	);
}
