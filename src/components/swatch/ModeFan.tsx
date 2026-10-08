import { useEffect, useRef, useState } from "react";
import { modeDescription, modeLabel } from "@/lib/i18n";
import { type GameMode, MODE_COLORS, MODES } from "@/lib/modes";
import { isMotionReduced } from "@/lib/motion";
import { m } from "@/paraglide/messages.js";
import { DeckCard } from "./DeckCard";

const CARD_WIDTH = 112; // px, w-28
const SPREAD = 14; // degrees between neighbouring cards
const LIFT = 14; // px the selected card rises
const DEAL_STAGGER = 40; // ms between dealt cards
const DEAL_MS = 420;
/** Horizontal drag (px) that moves the selection one card. */
const DRAG_STEP = 36;

interface ModeFanProps {
	value: GameMode;
	onChange: (mode: GameMode) => void;
	/** Extra line per card, e.g. the daily's streak. */
	meta?: Partial<Record<GameMode, string>>;
}

/**
 * The modes as a painter's sample deck, fanned out. Native radio buttons
 * underneath, so arrow keys and screen readers work as for any radio group;
 * dragging sideways on touch screens turns the fan. Cards are dealt in on
 * first render.
 *
 * The selected card carries the view-transition name "swatch", so starting
 * a game morphs it into the swatch on the play screen.
 */
export function ModeFan({ value, onChange, meta = {} }: ModeFanProps) {
	const [dealt, setDealt] = useState(false);
	const drag = useRef<number | null>(null);
	const index = MODES.indexOf(value);

	// After the deal, cards move with transitions instead of the animation.
	useEffect(() => {
		if (isMotionReduced()) {
			setDealt(true);
			return;
		}
		const timer = setTimeout(
			() => setDealt(true),
			DEAL_MS + DEAL_STAGGER * MODES.length,
		);
		return () => clearTimeout(timer);
	}, []);

	return (
		<fieldset
			onPointerDown={(event) => {
				if (event.pointerType !== "mouse") drag.current = event.clientX;
			}}
			onPointerMove={(event) => {
				if (drag.current === null) return;
				const delta = event.clientX - drag.current;
				if (Math.abs(delta) < DRAG_STEP) return;
				// Dragging left brings the cards on the right forward.
				const next = index + (delta < 0 ? 1 : -1);
				if (next >= 0 && next < MODES.length) onChange(MODES[next]);
				drag.current = event.clientX;
			}}
			onPointerUp={() => {
				drag.current = null;
			}}
			onPointerCancel={() => {
				drag.current = null;
			}}
			className="relative mx-auto h-72 w-full max-w-sm touch-pan-y select-none"
		>
			<legend className="sr-only">{m.home_modes()}</legend>
			{MODES.map((mode, i) => {
				const selected = i === index;
				const angle = (i - (MODES.length - 1) / 2) * SPREAD;
				const rest = `rotate(${angle}deg) translateY(${selected ? -LIFT : 0}px)`;
				return (
					<label
						key={mode}
						className={`absolute bottom-2 h-64 w-28 origin-[50%_115%] cursor-pointer rounded-xl has-focus-visible:ring-2 has-focus-visible:ring-ink has-focus-visible:ring-offset-4 has-focus-visible:ring-offset-paper ${
							dealt
								? "transition-transform duration-200 ease-out"
								: "animate-deal-in"
						}`}
						style={{
							left: `calc(50% - ${CARD_WIDTH / 2}px)`,
							zIndex: selected ? 10 : i,
							transform: rest,
							animationDelay: dealt ? undefined : `${i * DEAL_STAGGER}ms`,
							viewTransitionName: selected ? "swatch" : undefined,
							["--rest" as string]: rest,
						}}
					>
						<input
							type="radio"
							name="mode"
							value={mode}
							checked={selected}
							onChange={() => onChange(mode)}
							className="sr-only"
						/>
						<DeckCard
							colors={MODE_COLORS[mode]}
							title={modeLabel(mode)}
							description={modeDescription(mode)}
							meta={meta[mode]}
							selected={selected}
						/>
					</label>
				);
			})}
		</fieldset>
	);
}
