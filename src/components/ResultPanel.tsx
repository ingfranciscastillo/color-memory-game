import { type HSL, hslToCss } from "@/lib/color";
import { formatSigned, type RoundScore } from "@/lib/scoring";

export function ResultPanel({
	target,
	guess,
	result,
	streak,
	onNext,
	onFinish,
	isEndless,
	isLastRound,
}: {
	target: HSL;
	guess: HSL;
	result: RoundScore;
	streak: number;
	onNext: () => void;
	onFinish: () => void;
	isEndless: boolean;
	isLastRound: boolean;
}) {
	return (
		<div className="animate-rise-in">
			<div className="grid grid-cols-2">
				<div>
					<div
						className="h-40 w-full sm:h-56"
						style={{ backgroundColor: hslToCss(guess) }}
					/>
					<p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
						Your color
					</p>
				</div>
				<div>
					<div
						className="h-40 w-full sm:h-56"
						style={{ backgroundColor: hslToCss(target) }}
					/>
					<p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
						Target
					</p>
				</div>
			</div>

			<div className="mt-12 flex flex-wrap items-baseline justify-between gap-4">
				<p className="text-5xl font-light tabular-nums sm:text-6xl">
					{result.score}
					<span className="text-2xl text-muted-foreground"> / 100</span>
				</p>
				<p className="text-sm text-muted-foreground">
					{result.differencePct}% difference
					{isEndless ? ` · Streak ×${streak}` : ""}
				</p>
			</div>

			<dl className="mt-8 grid grid-cols-3 border-t border-border pt-4 text-sm">
				<div>
					<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
						Hue
					</dt>
					<dd className="mt-1 tabular-nums">
						{formatSigned(result.hueError, "°")}
					</dd>
				</div>
				<div>
					<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
						Saturation
					</dt>
					<dd className="mt-1 tabular-nums">
						{formatSigned(result.saturationError, "%")}
					</dd>
				</div>
				<div>
					<dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
						Lightness
					</dt>
					<dd className="mt-1 tabular-nums">
						{formatSigned(result.lightnessError, "%")}
					</dd>
				</div>
			</dl>

			<div className="mt-12 flex items-center gap-6">
				<button
					type="button"
					onClick={onNext}
					className="bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-80"
				>
					{isLastRound ? "Finish" : "Next"}
				</button>
				{isEndless && (
					<button
						type="button"
						onClick={onFinish}
						className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:underline"
					>
						End session
					</button>
				)}
			</div>
		</div>
	);
}
