import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useId, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ScoreDistribution } from "@/components/stats/ScoreDistribution";
import { CollectionGrid } from "@/components/swatch/CollectionGrid";
import { ModeChip } from "@/components/swatch/ModeChip";
import { authClient } from "@/lib/auth-client";
import { formatNumber } from "@/lib/i18n";
import { EXCELLENT_SCORE } from "@/lib/stats";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import { getStats } from "@/server/stats";
import type { ChannelStats, PlayerStats } from "@/server/stats-store";

export const Route = createFileRoute("/stats")({
	head: () => ({
		meta: [{ title: m.stats_title() }, { name: "robots", content: "noindex" }],
	}),
	component: StatsPage,
});

/** A channel bias smaller than this (points) isn't called a tendency. */
const BIAS_THRESHOLD = 5;

const LABEL = "text-xs text-ink-muted";
const SECTION_TITLE = "text-lg font-semibold";

function StatsPage() {
	const [stats, setStats] = useState<PlayerStats | null | undefined>(undefined);
	const userId = authClient.useSession().data?.user.id;

	// biome-ignore lint/correctness/useExhaustiveDependencies: userId is the trigger: reload when the player changes.
	useEffect(() => {
		let cancelled = false;
		getStats()
			.then((next) => {
				if (!cancelled) setStats(next);
			})
			.catch(() => {
				if (!cancelled) setStats(null);
			});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<PageHeader />
			<h1 className="mt-12 text-4xl font-bold tracking-tight">
				{m.stats_heading()}
			</h1>
			{stats === undefined ? (
				<p role="status" className={`mt-10 animate-fade-in ${LABEL}`}>
					{m.loading()}
				</p>
			) : !stats || stats.roundsPlayed === 0 ? (
				<p className="mt-10 animate-rise-in text-sm text-ink-muted">
					{m.stats_empty()}
				</p>
			) : (
				<StatsBody stats={stats} userId={userId ?? ""} />
			)}
		</main>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	const id = useId();
	return (
		<section aria-labelledby={id} className="mt-16">
			<h2 id={id} className={SECTION_TITLE}>
				{title}
			</h2>
			<div className="mt-6">{children}</div>
		</section>
	);
}

function Tiles({ items }: { items: [label: string, value: string][] }) {
	return (
		<dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{items.map(([label, value]) => (
				<div
					key={label}
					className="rounded-xl bg-card p-4 shadow-(--shadow-card)"
				>
					<dt className={LABEL}>{label}</dt>
					<dd className="mt-2 text-3xl font-bold tabular-nums">{value}</dd>
				</div>
			))}
		</dl>
	);
}

function StatsBody({ stats, userId }: { stats: PlayerStats; userId: string }) {
	const distributionId = useId();
	const dateFormat = new Intl.DateTimeFormat(getLocale(), {
		day: "numeric",
		month: "short",
	});
	const dash = "—";

	return (
		<div className="animate-rise-in">
			<div className="mt-10">
				<Tiles
					items={[
						[m.stats_games(), formatNumber(stats.gamesFinished)],
						[m.stats_rounds(), formatNumber(stats.roundsPlayed)],
						[
							m.stats_average_round(),
							stats.averageRound === null
								? dash
								: formatNumber(stats.averageRound),
						],
						[
							m.stats_excellent({ score: EXCELLENT_SCORE }),
							formatNumber(stats.excellentRounds),
						],
						[m.stats_best_round(), formatNumber(stats.bestRound)],
						[m.stats_best_streak(), `×${formatNumber(stats.bestStreak)}`],
					]}
				/>
			</div>

			<Section title={m.stats_daily()}>
				<Tiles
					items={[
						[
							m.stats_daily_streak(),
							`×${formatNumber(stats.daily.currentStreak)}`,
						],
						[m.stats_daily_max(), `×${formatNumber(stats.daily.maxStreak)}`],
						[
							m.stats_daily_today(),
							stats.daily.playedToday
								? m.stats_daily_done()
								: m.stats_daily_pending(),
						],
					]}
				/>
			</Section>

			{stats.modes.length > 0 && (
				<Section title={m.stats_modes()}>
					<div className="overflow-x-auto">
						<div className="rounded-xl bg-card px-4 py-1 shadow-(--shadow-card)">
							<table className="w-full text-sm tabular-nums">
								<thead>
									<tr className="border-b border-border text-left">
										<th scope="col" className={`py-3 font-normal ${LABEL}`}>
											{m.stats_col_mode()}
										</th>
										<th
											scope="col"
											className={`py-3 text-right font-normal ${LABEL}`}
										>
											{m.stats_col_games()}
										</th>
										<th
											scope="col"
											className={`py-3 text-right font-normal ${LABEL}`}
										>
											{m.stats_col_best()}
										</th>
										<th
											scope="col"
											className={`py-3 text-right font-normal ${LABEL}`}
										>
											{m.stats_col_average()}
										</th>
										<th
											scope="col"
											className={`py-3 text-right font-normal ${LABEL}`}
										>
											{m.stats_col_per_round()}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{stats.modes.map((row) => (
										<tr key={row.mode}>
											<th
												scope="row"
												className="py-3 text-left text-sm font-semibold"
											>
												<ModeChip mode={row.mode} />
											</th>
											<td className="py-3 text-right">
												{formatNumber(row.games)}
											</td>
											<td className="py-3 text-right">
												{formatNumber(row.bestScore)}
											</td>
											<td className="py-3 text-right">
												{formatNumber(row.averageScore)}
											</td>
											<td className="py-3 text-right">
												{row.averageRound === null
													? dash
													: formatNumber(row.averageRound)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</Section>
			)}

			<section aria-labelledby={distributionId} className="mt-16">
				<h2 id={distributionId} className={SECTION_TITLE}>
					{m.stats_distribution()}
				</h2>
				<p className="mt-2 text-sm text-ink-muted">
					{m.stats_distribution_hint()}
				</p>
				<div className="mt-8">
					<ScoreDistribution
						distribution={stats.distribution}
						headingId={distributionId}
					/>
				</div>
			</section>

			{stats.channels && (
				<Section title={m.stats_channels()}>
					<Channels channels={stats.channels} />
				</Section>
			)}

			<Section title={m.collection_title()}>
				<CollectionGrid userId={userId} />
			</Section>

			{stats.recent.length > 0 && (
				<Section title={m.stats_recent()}>
					<div className="rounded-xl bg-card px-4 py-1 shadow-(--shadow-card)">
						<table className="w-full text-sm tabular-nums">
							<thead>
								<tr className="border-b border-border text-left">
									<th scope="col" className={`py-3 font-normal ${LABEL}`}>
										{m.stats_col_mode()}
									</th>
									<th
										scope="col"
										className={`py-3 text-right font-normal ${LABEL}`}
									>
										{m.stats_col_score()}
									</th>
									<th
										scope="col"
										className={`py-3 text-right font-normal ${LABEL}`}
									>
										{m.stats_col_rounds()}
									</th>
									<th
										scope="col"
										className={`py-3 text-right font-normal ${LABEL}`}
									>
										{m.stats_col_date()}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{stats.recent.map((game) => (
									<tr key={game.id}>
										<th
											scope="row"
											className="py-3 text-left text-sm font-semibold"
										>
											<ModeChip mode={game.mode} />
										</th>
										<td className="py-3 text-right">
											{formatNumber(game.score)}
										</td>
										<td className="py-3 text-right">
											{formatNumber(game.rounds)}
										</td>
										<td className="py-3 text-right text-ink-muted">
											{dateFormat.format(new Date(game.finishedAt))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Section>
			)}
		</div>
	);
}

/**
 * Mean error per channel, each on its own scale (hue misses at most 180°,
 * saturation and lightness 100 points), plus the clearest tendency.
 */
function Channels({ channels }: { channels: ChannelStats }) {
	const rows: [label: string, value: number, max: number, unit: string][] = [
		[m.result_hue(), channels.hue, 180, "°"],
		[m.result_saturation(), channels.saturation, 100, ""],
		[m.result_lightness(), channels.lightness, 100, ""],
	];

	const tendencies = [
		channels.lightnessBias >= BIAS_THRESHOLD
			? m.stats_bias_lighter()
			: channels.lightnessBias <= -BIAS_THRESHOLD
				? m.stats_bias_darker()
				: null,
		channels.saturationBias >= BIAS_THRESHOLD
			? m.stats_bias_more_saturated()
			: channels.saturationBias <= -BIAS_THRESHOLD
				? m.stats_bias_less_saturated()
				: null,
	].filter((text) => text !== null);

	return (
		<>
			<p className="text-sm text-ink-muted">{m.stats_channels_hint()}</p>
			<dl className="mt-6 space-y-5">
				{rows.map(([label, value, max, unit]) => (
					<div key={label}>
						<div className="flex items-baseline justify-between">
							<dt className={LABEL}>{label}</dt>
							<dd className="tabular-nums">
								{formatNumber(value)}
								{unit}
							</dd>
						</div>
						<div className="mt-2 h-0.5 bg-border" aria-hidden="true">
							<div
								className="h-full bg-ink"
								style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
							/>
						</div>
					</div>
				))}
			</dl>
			<ul className="mt-8 space-y-2 text-sm">
				{(tendencies.length > 0 ? tendencies : [m.stats_bias_none()]).map(
					(text) => (
						<li key={text}>{text}</li>
					),
				)}
			</ul>
		</>
	);
}
