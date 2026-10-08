import {
	type ColorFamily,
	type LightnessBand,
	NOUNS,
	QUALIFIERS,
} from "@/content/color-names";
import type { HSL } from "./color";

type Locale = "en" | "es";

/** Hue ranges (start, inclusive) for each family; red wraps around 0°. */
const HUE_FAMILIES: [start: number, family: ColorFamily][] = [
	[0, "red"],
	[15, "orange"],
	[40, "yellow"],
	[65, "lime"],
	[90, "green"],
	[150, "teal"],
	[175, "cyan"],
	[200, "blue"],
	[235, "indigo"],
	[260, "violet"],
	[290, "magenta"],
	[320, "pink"],
	[345, "red"],
];

export function colorFamily({ h, s, l }: HSL): ColorFamily {
	if (s < 8 || l <= 3 || l >= 97) return "neutral";
	const hue = ((h % 360) + 360) % 360;
	let family: ColorFamily = "red";
	for (const [start, name] of HUE_FAMILIES) {
		if (hue >= start) family = name;
	}
	return family;
}

const bandOf = (l: number): LightnessBand =>
	l < 35 ? "dark" : l > 70 ? "light" : "mid";

/** FNV-1a: a small, stable string hash. */
function hash(text: string): number {
	let value = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		value ^= text.charCodeAt(i);
		value = Math.imul(value, 0x01000193);
	}
	return value >>> 0;
}

const pick = <T>(list: readonly T[], seed: number) => list[seed % list.length];

/**
 * An invented paint-chip name for a color: the same color always gets the
 * same name, for every player (the daily colors too).
 */
export function colorName(color: HSL, locale: Locale): string {
	const family = colorFamily(color);
	const band = bandOf(color.l);
	const key = `${Math.round(color.h)},${Math.round(color.s)},${Math.round(color.l)}`;
	const seed = hash(key);

	// A word list missing in one language falls back to English.
	const nouns = NOUNS[locale][family]?.[band] ?? NOUNS.en[family][band];
	const qualifiers =
		QUALIFIERS[locale][color.s < 40 ? "muted" : "vivid"] ?? QUALIFIERS.en.vivid;

	// Different bits of the hash for each part, so they vary independently.
	return `${pick(nouns, seed)} ${pick(qualifiers, seed >>> 11)}`;
}
