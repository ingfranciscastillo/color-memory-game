import { useCallback, useRef } from "react";
import { type HSL, hslToCss } from "@/lib/color";

type Props = {
	value: HSL;
	onChange: (value: HSL) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** HSV saturation/value (0..1) at a hue, mapped to HSL. */
function fromSv(h: number, sv: number, vv: number): HSL {
	const l = (vv * (2 - sv)) / 2;
	const denom = 1 - Math.abs(2 * l - 1);
	const s = denom === 0 ? 0 : (vv * sv) / denom;
	return { h, s: clamp01(s) * 100, l: l * 100 };
}

/** Arrow keys nudge by 1 step; Shift (or Page Up/Down) by 10. */
function keyDelta(e: React.KeyboardEvent, horizontal: boolean) {
	const step = e.shiftKey ? 10 : 1;
	switch (e.key) {
		case "ArrowRight":
			return horizontal ? [step, 0] : null;
		case "ArrowLeft":
			return horizontal ? [-step, 0] : null;
		case "ArrowUp":
			return [0, step];
		case "ArrowDown":
			return [0, -step];
		case "PageUp":
			return [0, 10];
		case "PageDown":
			return [0, -10];
		default:
			return null;
	}
}

export function ColorPicker({ value, onChange }: Props) {
	const areaRef = useRef<HTMLDivElement>(null);
	const hueRef = useRef<HTMLDivElement>(null);

	const handleArea = useCallback(
		(clientX: number, clientY: number) => {
			const el = areaRef.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			const x = clamp01((clientX - r.left) / r.width);
			const y = clamp01((clientY - r.top) / r.height);
			// x = saturation, y = value (top bright)
			onChange(fromSv(value.h, x, 1 - y));
		},
		[onChange, value.h],
	);

	const handleHue = useCallback(
		(clientX: number) => {
			const el = hueRef.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			onChange({ ...value, h: clamp01((clientX - r.left) / r.width) * 360 });
		},
		[onChange, value],
	);

	const drag =
		(fn: (x: number, y: number) => void) =>
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			fn(e.clientX, e.clientY);
		};

	const move =
		(fn: (x: number, y: number) => void) =>
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (e.buttons === 0 && e.pointerType === "mouse") return;
			if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
			fn(e.clientX, e.clientY);
		};

	// Marker position derived back from HSL
	const l = value.l / 100;
	const s = value.s / 100;
	const v = l + s * Math.min(l, 1 - l);
	const sv = v === 0 ? 0 : 2 * (1 - l / v);

	const onAreaKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const d = keyDelta(e, true);
		if (!d) return;
		e.preventDefault();
		onChange(
			fromSv(value.h, clamp01(sv + d[0] / 100), clamp01(v + d[1] / 100)),
		);
	};

	const onHueKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		let h: number;
		if (e.key === "Home") h = 0;
		else if (e.key === "End") h = 360;
		else {
			const d = keyDelta(e, true);
			if (!d) return;
			h = value.h + d[0] + d[1];
		}
		e.preventDefault();
		onChange({ ...value, h: Math.min(360, Math.max(0, h)) });
	};

	const focusRing =
		"outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";

	return (
		<div className="w-full select-none">
			<div
				ref={areaRef}
				onPointerDown={drag(handleArea)}
				onPointerMove={move(handleArea)}
				onKeyDown={onAreaKey}
				className={`relative h-56 w-full touch-none sm:h-64 ${focusRing}`}
				style={{
					backgroundColor: `hsl(${value.h} 100% 50%)`,
					backgroundImage:
						"linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
				}}
				role="slider"
				aria-label="Saturation and brightness"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(sv * 100)}
				aria-valuetext={`Saturation ${Math.round(sv * 100)}%, brightness ${Math.round(v * 100)}%`}
				tabIndex={0}
			>
				<span
					className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-1 ring-black/40"
					style={{ left: `${sv * 100}%`, top: `${(1 - v) * 100}%` }}
				/>
			</div>

			<div
				ref={hueRef}
				onPointerDown={drag((x) => handleHue(x))}
				onPointerMove={move((x) => handleHue(x))}
				onKeyDown={onHueKey}
				className={`relative mt-4 h-8 w-full touch-none ${focusRing}`}
				style={{
					backgroundImage:
						"linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
				}}
				role="slider"
				aria-label="Hue"
				aria-valuemin={0}
				aria-valuemax={360}
				aria-valuenow={Math.round(value.h)}
				aria-valuetext={`${Math.round(value.h)}°`}
				tabIndex={0}
			>
				<span
					className="pointer-events-none absolute top-0 h-8 w-1.5 -translate-x-1/2 border border-black/40 bg-background"
					style={{ left: `${(value.h / 360) * 100}%` }}
				/>
			</div>

			<div
				className="mt-6 h-24 w-full transition-colors duration-150"
				style={{ backgroundColor: hslToCss(value) }}
				role="img"
				aria-label="Your current color"
			/>
		</div>
	);
}
