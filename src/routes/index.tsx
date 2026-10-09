import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ModeFan } from "@/components/swatch/ModeFan";
import { LATEST_RELEASE } from "@/content/changelog";
import { authClient } from "@/lib/auth-client";
import { formatNumber, localizedHead, modeLabel } from "@/lib/i18n";
import type { GameMode } from "@/lib/modes";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { m } from "@/paraglide/messages.js";
import { getLocale, localizeHref } from "@/paraglide/runtime.js";
import { getSummary } from "@/server/stats";
import type { PlayerSummary } from "@/server/stats-store";

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
						url: `${SITE_URL}${localizeHref("/")}`,
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
	const [mode, setMode] = useState<GameMode>("daily");
	const [summary, setSummary] = useState<PlayerSummary | null>(null);
	const userId = authClient.useSession().data?.user.id;

	// biome-ignore lint/correctness/useExhaustiveDependencies: userId is the trigger: reload when the player changes (sign in, sign out).
	useEffect(() => {
		let cancelled = false;
		getSummary()
			.then((next) => {
				if (!cancelled) setSummary(next);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	const dailyMeta = !summary
		? m.mode_meta_today()
		: summary.dailyPlayedToday
			? m.mode_meta_done()
			: summary.dailyStreak
				? m.mode_meta_streak({ count: summary.dailyStreak })
				: m.mode_meta_today();

	const tiles = summary
		? [
				[m.home_tile_best(), formatNumber(summary.bestScore)],
				[m.home_tile_streak(), `×${formatNumber(summary.bestStreak)}`],
				[m.home_tile_daily(), `×${formatNumber(summary.dailyStreak)}`],
			]
		: [];

	const link =
		"underline-offset-4 transition-colors hover:text-ink hover:underline";

	return (
		<main className="mx-auto flex min-h-screen max-w-2xl flex-col overflow-x-clip px-6 py-8 sm:px-10 sm:py-12">
			<PageHeader />

			<div className="mt-14 text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					{m.home_greeting()}
				</h1>
				<p className="mt-3 text-ink-muted">{m.home_greeting_hint()}</p>
			</div>

			<div className="mt-10">
				<ModeFan value={mode} onChange={setMode} meta={{ daily: dailyMeta }} />
			</div>

			<Link
				to="/play"
				search={{ mode }}
				viewTransition
				className="mx-auto mt-8 w-full max-w-sm rounded-xl bg-ink px-8 py-4 text-center font-semibold text-paper transition-opacity hover:opacity-85"
			>
				{m.home_play_mode({ mode: modeLabel(mode) })}
			</Link>

			{tiles.length > 0 && (
				<dl className="mx-auto mt-10 grid w-full max-w-sm grid-cols-3 gap-3">
					{tiles.map(([label, value]) => (
						<div
							key={label}
							className="rounded-lg bg-card px-3 py-3 shadow-(--shadow-card)"
						>
							<dt className="text-[0.7rem] text-ink-muted">{label}</dt>
							<dd className="mt-1 text-xl font-semibold tabular-nums">
								{value}
							</dd>
						</div>
					))}
				</dl>
			)}

			<nav className="mx-auto mt-8 mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
				<Link to="/stats" className={link}>
					{m.stats_link()}
				</Link>
				<Link to="/leaderboard" className={link}>
					{m.leaderboard_link()}
				</Link>
				<Link to="/how-to-play" className={link}>
					{m.howto_link()}
				</Link>
				<Link
					to="/changelog"
					aria-label={m.changelog_link({ version: LATEST_RELEASE.version })}
					className={`${link} tabular-nums`}
				>
					v{LATEST_RELEASE.version}
				</Link>
			</nav>
		</main>
	);
}
