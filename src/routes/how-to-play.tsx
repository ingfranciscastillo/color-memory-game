import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ModeChip } from "@/components/swatch/ModeChip";
import { SwatchCard } from "@/components/swatch/SwatchCard";
import type { HSL } from "@/lib/color";
import { colorName } from "@/lib/color-name";
import { localizedHead } from "@/lib/i18n";
import { type GameMode, MODES } from "@/lib/modes";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";

export const Route = createFileRoute("/how-to-play")({
	head: () => {
		const localized = localizedHead("/how-to-play");
		return {
			meta: [
				{ title: m.howto_title() },
				{ name: "description", content: m.howto_description() },
				{ property: "og:type", content: "article" },
				{ property: "og:title", content: m.howto_title() },
				{ property: "og:description", content: m.howto_description() },
				...localized.meta,
			],
			links: localized.links,
		};
	},
	component: HowToPlayPage,
});

/** Example colors for the illustrations (decoration, never a game target). */
const EXAMPLE: HSL = { h: 12, s: 76, l: 54 };
const GUESS: HSL = { h: 18, s: 70, l: 58 };

const MODE_DETAIL: Record<GameMode, () => string> = {
	daily: m.howto_mode_daily,
	classic: m.howto_mode_classic,
	speed: m.howto_mode_speed,
	precision: m.howto_mode_precision,
	endless: m.howto_mode_endless,
};

function Step({
	number,
	title,
	text,
	children,
}: {
	number: number;
	title: string;
	text: string;
	children: ReactNode;
}) {
	return (
		<li className="flex animate-rise-in flex-col items-center gap-5 rounded-2xl bg-card p-5 shadow-(--shadow-card) sm:flex-row sm:items-center">
			<div className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl bg-stage sm:w-44">
				{children}
			</div>
			<div>
				<p className="text-xs font-semibold text-ink-muted tabular-nums">
					{number}
				</p>
				<h2 className="text-xl font-bold tracking-tight">{title}</h2>
				<p className="mt-1 text-sm text-ink-muted">{text}</p>
			</div>
		</li>
	);
}

function HowToPlayPage() {
	const locale = getLocale();

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-8 sm:px-10 sm:py-12">
			<PageHeader />
			<h1 className="mt-12 text-4xl font-bold tracking-tight">
				{m.howto_heading()}
			</h1>
			<p className="mt-3 text-ink-muted">{m.howto_intro()}</p>

			<ol className="mt-10 space-y-4">
				<Step
					number={1}
					title={m.howto_step1_title()}
					text={m.howto_step1_text()}
				>
					<SwatchCard
						color={EXAMPLE}
						size="sm"
						title={colorName(EXAMPLE, locale)}
						className="scale-150"
					/>
				</Step>
				<Step
					number={2}
					title={m.howto_step2_title()}
					text={m.howto_step2_text()}
				>
					<SwatchCard
						color={null}
						size="sm"
						title={m.result_your_color()}
						className="scale-150"
					/>
				</Step>
				<Step
					number={3}
					title={m.howto_step3_title()}
					text={m.howto_step3_text()}
				>
					<div className="relative flex gap-2">
						<SwatchCard
							color={GUESS}
							size="sm"
							title={m.result_your_color()}
							style={{ transform: "rotate(-5deg)" }}
						/>
						<SwatchCard
							color={EXAMPLE}
							size="sm"
							title={m.result_target()}
							style={{ transform: "rotate(5deg)" }}
						/>
						<span
							aria-hidden="true"
							className="absolute -bottom-5 left-1/2 flex size-11 -translate-x-1/2 -rotate-8 items-center justify-center rounded-full border-2 border-black bg-white text-sm font-extrabold text-black"
						>
							92
						</span>
					</div>
				</Step>
			</ol>

			<section aria-labelledby="scoring" className="mt-14">
				<h2 id="scoring" className="text-lg font-semibold">
					{m.howto_scoring_title()}
				</h2>
				<p className="mt-2 text-sm text-ink-muted">{m.howto_scoring_text()}</p>
				<ul className="mt-4 space-y-2 text-sm">
					{[
						["90+", m.howto_band_nailed()],
						["50+", m.howto_band_pass()],
						["< 50", m.howto_band_miss()],
					].map(([band, text]) => (
						<li
							key={band}
							className="flex items-baseline gap-3 rounded-lg bg-card px-4 py-3 shadow-(--shadow-card)"
						>
							<span className="w-10 shrink-0 font-bold tabular-nums">
								{band}
							</span>
							<span>{text}</span>
						</li>
					))}
				</ul>
			</section>

			<section aria-labelledby="modes" className="mt-14">
				<h2 id="modes" className="text-lg font-semibold">
					{m.howto_modes_title()}
				</h2>
				<dl className="mt-4 space-y-2">
					{MODES.map((mode) => (
						<div
							key={mode}
							className="rounded-lg bg-card px-4 py-3 shadow-(--shadow-card)"
						>
							<dt className="text-sm font-semibold">
								<ModeChip mode={mode} />
							</dt>
							<dd className="mt-1 text-sm text-ink-muted">
								{MODE_DETAIL[mode]()}
							</dd>
						</div>
					))}
				</dl>
			</section>

			<section aria-labelledby="tips" className="mt-14">
				<h2 id="tips" className="text-lg font-semibold">
					{m.howto_tips_title()}
				</h2>
				<ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
					<li>{m.howto_tip1()}</li>
					<li>{m.howto_tip2()}</li>
					<li>{m.howto_tip3()}</li>
				</ul>
			</section>

			<Link
				to="/play"
				search={{ mode: "daily" }}
				className="mt-12 inline-block rounded-xl bg-ink px-8 py-4 font-semibold text-paper transition-opacity hover:opacity-85"
			>
				{m.howto_cta()}
			</Link>
		</main>
	);
}
