import { useCallback, useRef } from "react";
import { type HSL, hslToCss } from "@/lib/color";

type Props = {
	value: HSL;
	onChange: (value: HSL) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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
			// x = saturation, y = value (top bright) — mapped to HSL
			const sv = x;
			const vv = 1 - y;
			const l = (vv * (2 - sv)) / 2;
			const denom = 1 - Math.abs(2 * l - 1);
			const s = denom === 0 ? 0 : (vv * sv) / denom;
			onChange({ h: value.h, s: clamp01(s) * 100, l: l * 100 });
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

	return (
		<div className="w-full select-none">
			<div
				ref={areaRef}
				onPointerDown={drag(handleArea)}
				onPointerMove={move(handleArea)}
				className="relative h-56 w-full touch-none sm:h-64"
				style={{
					backgroundColor: `hsl(${value.h} 100% 50%)`,
					backgroundImage:
						"linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
				}}
				role="slider"
				aria-label="Saturation and lightness"
				aria-valuenow={Math.round(value.s)}
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
				className="relative mt-4 h-8 w-full touch-none"
				style={{
					backgroundImage:
						"linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
				}}
				role="slider"
				aria-label="Hue"
				aria-valuenow={Math.round(value.h)}
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
