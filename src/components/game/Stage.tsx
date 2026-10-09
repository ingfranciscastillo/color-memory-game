import { type ReactNode, useEffect } from "react";
import { currentTheme, setThemeColor, THEME_COLORS } from "@/lib/theme";

/** `--stage` (oklch(0.6 0 0)) as hex, for the browser UI color. */
const STAGE_HEX = "#808080";

/**
 * The playing surface: neutral mid gray, the same in both themes, with
 * nothing colorful on it but the swatches. Text on it is always black,
 * whatever the theme: 5.3:1 on this gray, where #1a1a1a only reaches 4.4:1.
 * The browser's UI turns gray too, so no theme color frames the target.
 */
export function Stage({ children }: { children: ReactNode }) {
	useEffect(() => {
		setThemeColor(STAGE_HEX);
		return () => setThemeColor(THEME_COLORS[currentTheme()]);
	}, []);

	return (
		<div className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-stage text-black [scrollbar-color:rgb(0_0_0/0.35)_transparent]">
			{children}
		</div>
	);
}
