import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { AuthDialog } from "@/components/account/AuthDialog";
import { PageHeader } from "@/components/PageHeader";
import { ModeChip } from "@/components/swatch/ModeChip";
import { authClient } from "@/lib/auth-client";
import { formatNumber, localizedHead } from "@/lib/i18n";
import {
	BOARDS,
	isBoard,
	isDayKey,
	type LeaderboardBoard,
	shiftDay,
} from "@/lib/leaderboard";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import { getLeaderboard } from "@/server/leaderboard";
import type { LeaderboardEntry } from "@/server/leaderboard-store";

interface Search {
	board?: LeaderboardBoard;
	/** Daily board's day; today when absent. */
	day?: string;
}

export const Route = createFileRoute("/leaderboard")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		board: isBoard(search.board) ? search.board : undefined,
		day: isDayKey(search.day) ? search.day : undefined,
	}),
	head: () => {
		// One canonical per language: the board/day params don't change what's indexable.
		const localized = localizedHead("/leaderboard");
		return {
			meta: [
				{ title: m.leaderboard_title() },
				{ name: "description", content: m.leaderboard_description() },
				{ property: "og:title", content: m.leaderboard_title() },
				{ property: "og:description", content: m.leaderboard_description() },
				...localized.meta,
			],
			links: localized.links,
		};
	},
	component: LeaderboardPage,
});

type Data = Awaited<ReturnType<typeof getLeaderboard>>;

const LABEL = "text-xs text-ink-muted";
const LINK =
	"text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline";

function LeaderboardPage() {
	const { board = "daily", day } = Route.useSearch();
	const [data, setData] = useState<Data | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [reload, setReload] = useState(0);
	const userId = authClient.useSession().data?.user.id;

	// biome-ignore lint/correctness/useExhaustiveDependencies: userId and reload are triggers: refetch when the player or their visibility changes.
	useEffect(() => {
		let cancelled = false;
		setError(null);
		getLeaderboard({
			data: { board, day: board === "daily" ? day : undefined },
		})
			.then((next) => {
				if (!cancelled) setData(next);
			})
			.catch((thrown: unknown) => {
				if (!cancelled)
					setError(
						thrown instanceof Error ? thrown.message : m.error_network(),
					);
			});
		return () => {
			cancelled = true;
		};
	}, [board, day, userId, reload]);

	// Keep showing the previous board until the new one arrives, unless it's stale.
	const current = data && data.board === board ? data : null;

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<PageHeader />
			<h1 className="mt-12 text-4xl font-bold tracking-tight">
				{m.leaderboard_heading()}
			</h1>

			<nav aria-label={m.leaderboard_boards()} className="mt-10">
				<ul className="flex flex-wrap gap-2">
					{BOARDS.map((option) => (
						<li key={option}>
							<Link
								to="/leaderboard"
								search={{ board: option }}
								aria-current={option === board ? "page" : undefined}
								className={`flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
									option === board
										? "bg-card shadow-(--shadow-card)"
										: "text-ink-muted hover:text-ink"
								}`}
							>
								<ModeChip mode={option} />
							</Link>
						</li>
					))}
				</ul>
			</nav>

			{error ? (
				<p role="alert" className="mt-10 text-sm text-destructive">
					{error}
				</p>
			) : !current ? (
				<p role="status" className={`mt-10 animate-fade-in ${LABEL}`}>
					{m.loading()}
				</p>
			) : (
				<Board data={current} onJoined={() => setReload((n) => n + 1)} />
			)}
		</main>
	);
}

function Board({ data, onJoined }: { data: Data; onJoined: () => void }) {
	const locale = getLocale();
	const daily = data.board === "daily";
	const dateFormat = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		timeZone: "UTC",
	});
	const periodLabel = daily
		? data.period === data.today
			? m.leaderboard_today()
			: dateFormat.format(new Date(data.period))
		: m.leaderboard_week({ date: dateFormat.format(new Date(data.period)) });

	const meInTop =
		data.me !== null &&
		data.entries.some((entry) => entry.rank === data.me?.rank);

	return (
		<div key={`${data.board}-${data.period}`} className="mt-10 animate-rise-in">
			<div className="flex flex-wrap items-baseline justify-between gap-4">
				<p className="text-sm font-semibold">{periodLabel}</p>
				{daily && (
					<div className="flex gap-6">
						<Link
							to="/leaderboard"
							search={{ board: "daily", day: shiftDay(data.period, -1) }}
							className={LINK}
						>
							{m.leaderboard_prev_day()}
						</Link>
						{data.period < data.today && (
							<Link
								to="/leaderboard"
								search={{
									board: "daily",
									day:
										shiftDay(data.period, 1) === data.today
											? undefined
											: shiftDay(data.period, 1),
								}}
								className={LINK}
							>
								{m.leaderboard_next_day()}
							</Link>
						)}
					</div>
				)}
			</div>
			<p className="mt-2 text-sm text-ink-muted">
				{daily ? m.leaderboard_rules_daily() : m.leaderboard_rules_weekly()}
			</p>

			<Invite you={data.you} onJoined={onJoined} />

			{data.entries.length === 0 && !data.me ? (
				<p className="mt-10 text-sm text-ink-muted">{m.leaderboard_empty()}</p>
			) : (
				<>
					<div className="mt-10 rounded-xl bg-card px-4 py-1 shadow-(--shadow-card)">
						<table className="w-full text-sm tabular-nums">
							<thead>
								<tr className="border-b border-border text-left">
									<th scope="col" className={`w-16 py-3 font-normal ${LABEL}`}>
										{m.leaderboard_col_rank()}
									</th>
									<th scope="col" className={`py-3 font-normal ${LABEL}`}>
										{m.leaderboard_col_player()}
									</th>
									{!daily && (
										<th
											scope="col"
											className={`py-3 text-right font-normal ${LABEL}`}
										>
											{m.leaderboard_col_games()}
										</th>
									)}
									<th
										scope="col"
										className={`py-3 text-right font-normal ${LABEL}`}
									>
										{m.leaderboard_col_score()}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data.entries.map((entry) => (
									<Row
										key={entry.rank}
										entry={entry}
										mine={data.me?.rank === entry.rank}
										daily={daily}
									/>
								))}
								{data.me && !meInTop && (
									<Row entry={data.me} mine daily={daily} separated />
								)}
							</tbody>
						</table>
					</div>
					<p className={`mt-4 ${LABEL}`}>
						{m.leaderboard_total({
							// The cached top may predate your row: never show fewer than your rank.
							count: formatNumber(Math.max(data.total, data.me?.rank ?? 0)),
						})}
					</p>
				</>
			)}

			{data.you?.visible && !data.me && data.entries.length > 0 && (
				<p className="mt-6 text-sm text-ink-muted">
					{m.leaderboard_not_ranked()}
				</p>
			)}
		</div>
	);
}

function Row({
	entry,
	mine,
	daily,
	separated = false,
}: {
	entry: LeaderboardEntry;
	mine: boolean;
	daily: boolean;
	/** Your row, shown below the top because you're outside it. */
	separated?: boolean;
}) {
	return (
		<tr className={separated ? "border-t-2 border-border" : undefined}>
			<td className="py-3 pl-2 text-ink-muted">{formatNumber(entry.rank)}</td>
			{/* Your row stands out by weight and "· You", not by a background. */}
			<th
				scope="row"
				className={`py-3 text-left ${mine ? "font-semibold" : "font-normal"}`}
			>
				<span className="flex items-center gap-3">
					<Avatar seed={entry.avatarSeed} size={24} />
					<span className="truncate">{entry.name}</span>
					{mine && (
						<span className="text-xs text-ink-muted">
							· {m.leaderboard_you()}
						</span>
					)}
				</span>
			</th>
			{!daily && (
				<td className="py-3 text-right text-ink-muted">
					{formatNumber(entry.games ?? 0)}
				</td>
			)}
			<td className="py-3 pr-2 text-right">{formatNumber(entry.score)}</td>
		</tr>
	);
}

/** Invites players who don't appear: anonymous ones to sign in, others to opt in. */
function Invite({ you, onJoined }: { you: Data["you"]; onJoined: () => void }) {
	const [signInOpen, setSignInOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [failed, setFailed] = useState(false);

	if (you?.visible) return null;

	const join = async () => {
		setBusy(true);
		setFailed(false);
		const { error } = await authClient.updateUser({ showInLeaderboard: true });
		setBusy(false);
		if (error) setFailed(true);
		else onJoined();
	};

	const anonymous = !you || you.anonymous;

	return (
		<div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-(--shadow-card)">
			<p className="text-sm">
				{anonymous ? m.leaderboard_join_anon() : m.leaderboard_join_hidden()}
			</p>
			<button
				type="button"
				disabled={busy}
				onClick={() => (anonymous ? setSignInOpen(true) : void join())}
				className="rounded-xl bg-ink px-6 py-3 font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-60"
			>
				{anonymous ? m.account_sign_in() : m.leaderboard_join_button()}
			</button>
			{failed && (
				<p role="alert" className="w-full text-sm text-destructive">
					{m.profile_error()}
				</p>
			)}
			<AuthDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
		</div>
	);
}
