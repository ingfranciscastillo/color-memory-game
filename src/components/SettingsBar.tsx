import { useHydrated } from "@tanstack/react-router";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import { DARK } from "@/lib/theme";

/** Theme and motion switches. */
export function SettingsBar() {
	const { theme, toggleTheme } = useTheme();
	const { reduced, toggleReducedMotion } = useReducedMotion();
	// The server can't know the saved preferences: show switch state after hydration.
	const hydrated = useHydrated();

	const switches = [
		{ label: "Dark mode", on: hydrated && theme === DARK, toggle: toggleTheme },
		{
			label: "Reduce motion",
			on: hydrated && reduced,
			toggle: toggleReducedMotion,
		},
	];

	return (
		<div className="flex flex-wrap gap-x-8 gap-y-3">
			{switches.map(({ label, on, toggle }) => (
				<button
					key={label}
					type="button"
					role="switch"
					aria-checked={on}
					onClick={toggle}
					className={`flex items-center gap-2 text-xs uppercase tracking-[0.3em] transition-opacity ${
						on ? "" : "opacity-45 hover:opacity-80"
					}`}
				>
					<span
						aria-hidden="true"
						className={`size-2 rounded-full border border-current transition-colors ${
							on ? "bg-current" : ""
						}`}
					/>
					{label}
				</button>
			))}
		</div>
	);
}
