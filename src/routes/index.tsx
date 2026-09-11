import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	type GameMode,
	MODE_DESCRIPTIONS,
	MODE_LABELS,
	MODES,
} from "@/lib/modes";
import { SITE_URL } from "@/lib/seo";
import { loadStats, type Stats } from "@/lib/storage";

const TITLE = "Color Memory — A minimal color memory game";
const DESCRIPTION =
	"See a color. Memorize it. Rebuild it. A minimal test of visual memory and perception, scored in perceptual color space.";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: TITLE },
			{
				name: "description",
				content: DESCRIPTION,
			},
			{
				property: "og:title",
				content: TITLE,
			},
			{
				property: "og:description",
				content: DESCRIPTION,
			},
			{
				property: "og:url",
				content: SITE_URL,
			},
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: "Color Memory",
					url: SITE_URL,
					description: DESCRIPTION,
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
		links: [
			{
				rel: "canonical",
				href: SITE_URL,
			},
		],
	}),
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
				How well can you remember a color?
			</p>

			<div className="mt-14">
				<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
					Mode
				</p>
				<ul className="mt-4 divide-y divide-border border-y border-border">
					{MODES.map((m) => (
						<li key={m}>
							<button
								type="button"
								onClick={() => setMode(m)}
								aria-pressed={mode === m}
								className={`flex w-full items-baseline justify-between gap-6 py-4 text-left transition-opacity ${
									mode === m ? "" : "opacity-45 hover:opacity-80"
								}`}
							>
								<span className="text-sm uppercase tracking-[0.2em]">
									{MODE_LABELS[m]}
								</span>
								<span className="text-right text-xs text-muted-foreground">
									{MODE_DESCRIPTIONS[m]}
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
				Play
			</Link>

			<p className="mt-10 text-xs uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
				Best {(stats?.bestScore ?? 0).toLocaleString()}
				{stats?.bestStreak ? ` · Streak ×${stats.bestStreak}` : ""}
			</p>
		</main>
	);
}
