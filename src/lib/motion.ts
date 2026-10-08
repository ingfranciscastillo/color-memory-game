/**
 * Reduced-motion preference.
 *
 * Same pattern as the theme: until the player picks, the game follows
 * `prefers-reduced-motion`. The result is applied as the `reduce-motion`
 * class on <html>, which styles.css uses to switch animations off.
 */

const MOTION_KEY = "color-memory:motion:v1";
const REDUCE_MOTION_CLASS = "reduce-motion";

const REDUCED = "reduced";
const FULL = "full";

export function systemReducedMotion(): boolean {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function")
		return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Saved preference (true = reduce), or null if the player never chose. */
export function loadReducedMotionPreference(): boolean | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = window.localStorage.getItem(MOTION_KEY);
		if (stored === REDUCED) return true;
		if (stored === FULL) return false;
		return null;
	} catch {
		return null;
	}
}

export function saveReducedMotionPreference(reduced: boolean) {
	try {
		window.localStorage.setItem(MOTION_KEY, reduced ? REDUCED : FULL);
	} catch {
		/* storage unavailable */
	}
}

export function applyReducedMotion(reduced: boolean) {
	document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, reduced);
}

/** Are animations reduced right now? Reads the class already applied. */
export function isMotionReduced(): boolean {
	if (typeof document === "undefined") return false;
	return document.documentElement.classList.contains(REDUCE_MOTION_CLASS);
}

/** Inline <head> script: applies the preference before first paint. */
export const MOTION_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(MOTION_KEY)});var r=m===${JSON.stringify(REDUCED)}?true:m===${JSON.stringify(FULL)}?false:!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);document.documentElement.classList.toggle(${JSON.stringify(REDUCE_MOTION_CLASS)},r);}catch(e){}})();`;
