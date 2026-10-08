import { m } from "@/paraglide/messages.js";
import {
	baseLocale,
	getLocale,
	type Locale,
	locales,
	localizeHref,
} from "@/paraglide/runtime.js";
import type { GameMode } from "./modes";
import { SITE_URL } from "./seo";

export const LOCALE_NAMES: Record<Locale, string> = {
	en: "English",
	es: "Español",
};

/** Open Graph locale codes. */
const OG_LOCALES: Record<Locale, string> = {
	en: "en_US",
	es: "es_ES",
};

export function modeLabel(mode: GameMode) {
	return {
		daily: m.mode_daily,
		classic: m.mode_classic,
		speed: m.mode_speed,
		precision: m.mode_precision,
		endless: m.mode_endless,
	}[mode]();
}

export function modeDescription(mode: GameMode) {
	return {
		daily: m.mode_daily_description,
		classic: m.mode_classic_description,
		speed: m.mode_speed_description,
		precision: m.mode_precision_description,
		endless: m.mode_endless_description,
	}[mode]();
}

export const formatNumber = (n: number) =>
	new Intl.NumberFormat(getLocale()).format(n);

/** `2.5` → "2.5 s" in English, "2,5 s" in Spanish; always one decimal. */
export const formatSeconds = (seconds: number) =>
	`${new Intl.NumberFormat(getLocale(), {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(seconds)} s`;

/** `12.5` → "12.5%" in English, "12,5 %" in Spanish. */
export const formatPercent = (n: number) =>
	new Intl.NumberFormat(getLocale(), {
		style: "percent",
		maximumFractionDigits: 1,
	}).format(n / 100);

/**
 * Canonical, hreflang alternates and og:locale for a route path written
 * without a locale ("/play"). Each language version is its own canonical.
 */
export function localizedHead(path: string) {
	const locale = getLocale();
	const url = (l: Locale) => `${SITE_URL}${localizeHref(path, { locale: l })}`;
	return {
		meta: [
			{ property: "og:url", content: url(locale) },
			{ property: "og:locale", content: OG_LOCALES[locale] },
		],
		links: [
			{ rel: "canonical", href: url(locale) },
			...locales.map((l) => ({ rel: "alternate", hrefLang: l, href: url(l) })),
			{ rel: "alternate", hrefLang: "x-default", href: url(baseLocale) },
		],
	};
}
