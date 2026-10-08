import { ScoreStamp } from "@/components/game/ScoreStamp";
import { SwatchCard } from "@/components/swatch/SwatchCard";
import { type HSL, hslToHex } from "@/lib/color";
import { colorName } from "@/lib/color-name";
import { formatPercent } from "@/lib/i18n";
import { formatSigned, type RoundScore } from "@/lib/scoring";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";

/** Cards land first; the stamp drops once both are down. */
const TARGET_DELAY_MS = 120;
const STAMP_DELAY_MS = 320;

/**
 * Your swatch and the target's, side by side and slightly tilted, with the
 * score stamped between them. Your card keeps the "swatch" transition name,
 * so the card you were filling slides into place.
 */
export function ResultPanel({
	target,
	guess,
	result,
	streak,
	onNext,
	onFinish,
	isEndless,
	isLastRound,
	busy,
}: {
	target: HSL;
	guess: HSL;
	result: RoundScore;
	streak: number;
	onNext: () => void;
	onFinish: () => void;
	isEndless: boolean;
	isLastRound: boolean;
	busy: boolean;
}) {
	const locale = getLocale();
	const deltas: [string, string][] = [
		[m.result_hue(), formatSigned(result.hueError, "°")],
		[m.result_saturation(), formatSigned(result.saturationError)],
		[m.result_lightness(), formatSigned(result.lightnessError)],
	];

	return (
		<div className="flex flex-col items-center">
			<div className="relative flex justify-center gap-3 pb-20">
				<SwatchCard
					color={guess}
					size="md"
					title={colorName(guess, locale)}
					subtitle={m.result_your_color()}
					footer={<span>{hslToHex(guess)}</span>}
					viewTransitionName="swatch"
					className="animate-slide-in"
					style={{
						transform: "rotate(-4deg)",
						["--rest" as string]: "rotate(-4deg)",
						["--from-x" as string]: "-48px",
					}}
				/>
				<SwatchCard
					color={target}
					size="md"
					title={colorName(target, locale)}
					subtitle={m.result_target()}
					footer={<span>{hslToHex(target)}</span>}
					className="animate-slide-in"
					style={{
						transform: "rotate(4deg)",
						animationDelay: `${TARGET_DELAY_MS}ms`,
						["--rest" as string]: "rotate(4deg)",
						["--from-x" as string]: "48px",
					}}
				/>
				<div className="absolute bottom-0 left-1/2 -translate-x-1/2">
					<ScoreStamp score={result.score} delayMs={STAMP_DELAY_MS} />
				</div>
			</div>

			<p className="mt-5 text-sm">
				{m.result_difference({ percent: formatPercent(result.differencePct) })}
				{isEndless ? ` · ${m.streak({ count: streak })}` : ""}
			</p>

			<dl className="mt-4 grid w-full max-w-sm grid-cols-3 gap-px overflow-hidden rounded-xl bg-black/10">
				{deltas.map(([label, value]) => (
					<div key={label} className="bg-white px-3 py-3 text-center">
						<dt className="text-[0.7rem] text-[#5c5b57]">{label}</dt>
						<dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
					</div>
				))}
			</dl>

			<div className="mt-6 flex w-full max-w-sm flex-col items-center gap-4">
				<button
					type="button"
					onClick={onNext}
					disabled={busy}
					aria-busy={busy}
					className="w-full rounded-xl bg-[#1a1a1a] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
				>
					{isLastRound ? m.result_finish() : m.result_next()}
				</button>
				{isEndless && (
					<button
						type="button"
						onClick={onFinish}
						disabled={busy}
						className="text-sm underline-offset-4 hover:underline disabled:opacity-45"
					>
						{m.result_end_session()}
					</button>
				)}
			</div>
		</div>
	);
}
