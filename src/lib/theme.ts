/**
 * Light/dark theme.
 *
 * The player's choice is stored in the browser. Until they pick one, the game
 * follows the operating system theme.
 */

const THEME_KEY = "color-memory:theme:v1";
export const LIGHT = "light";
export const DARK = "dark";

export type Theme = typeof LIGHT | typeof DARK;

/** Browser UI color for each theme — matches `--background` in styles.css. */
export const THEME_COLORS: Readonly<Record<Theme, string>> = {
	[LIGHT]: "#FFFFFF",
	[DARK]: "#020618",
};

export function systemTheme(): Theme {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function")
		return LIGHT;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? DARK
		: LIGHT;
}

/** Saved preference, or null if the player never chose. */
export function loadThemePreference(): Theme | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = window.localStorage.getItem(THEME_KEY);
		return stored === LIGHT || stored === DARK ? stored : null;
	} catch {
		return null;
	}
}

export function saveThemePreference(theme: Theme) {
	try {
		window.localStorage.setItem(THEME_KEY, theme);
	} catch {
		/* storage unavailable */
	}
}

/** Sets the browser UI color (mobile address bar, PWA title bar). */
export function setThemeColor(color: string) {
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", color);
}

export function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === DARK);
	setThemeColor(THEME_COLORS[theme]);
}

export function currentTheme(): Theme {
	return document.documentElement.classList.contains("dark") ? DARK : LIGHT;
}

/**
 * Inline <head> script: applies the saved (or system) theme before first
 * paint so the light theme never flashes. Mirrors loadThemePreference,
 * systemTheme and applyTheme without modules.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!==${JSON.stringify(LIGHT)}&&t!==${JSON.stringify(DARK)})t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?${JSON.stringify(DARK)}:${JSON.stringify(LIGHT)};document.documentElement.classList.toggle("dark",t===${JSON.stringify(DARK)});var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",${JSON.stringify(THEME_COLORS)}[t]);}catch(e){}})();`;
