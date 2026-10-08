import { useEffect, useState } from "react";
import {
	applyTheme,
	DARK,
	LIGHT,
	loadThemePreference,
	saveThemePreference,
	systemTheme,
	type Theme,
} from "@/lib/theme";

/**
 * Follows the system theme until the player picks one, then remembers it.
 */
export function useTheme() {
	const [preference, setPreference] = useState<Theme | null>(
		loadThemePreference,
	);
	const [system, setSystem] = useState<Theme>(systemTheme);

	const theme = preference ?? system;

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (event: MediaQueryListEvent) =>
			setSystem(event.matches ? DARK : LIGHT);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	const toggleTheme = () => {
		const next = theme === DARK ? LIGHT : DARK;
		saveThemePreference(next);
		setPreference(next);
	};

	return { theme, toggleTheme };
}
