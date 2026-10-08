import { useHydrated } from "@tanstack/react-router";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import { LOCALE_NAMES } from "@/lib/i18n";
import { DARK } from "@/lib/theme";
import { m } from "@/paraglide/messages.js";
import { getLocale, locales, setLocale } from "@/paraglide/runtime.js";

const itemClass = (on: boolean) =>
	`flex items-center gap-2 text-xs uppercase tracking-[0.3em] transition-opacity ${
		on ? "" : "opacity-45 hover:opacity-80"
	}`;

/** Theme, motion and language settings. */
export function SettingsBar() {
	const { theme, toggleTheme } = useTheme();
	const { reduced, toggleReducedMotion } = useReducedMotion();
	// The server can't know the saved preferences: show switch state after hydration.
	const hydrated = useHydrated();
	const locale = getLocale();

	const switches = [
		{
			label: m.settings_dark_mode(),
			on: hydrated && theme === DARK,
			toggle: toggleTheme,
		},
		{
			label: m.settings_reduce_motion(),
			on: hydrated && reduced,
			toggle: toggleReducedMotion,
		},
	];

	return (
		<div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
			<div className="flex flex-wrap gap-x-8 gap-y-3">
				{switches.map(({ label, on, toggle }) => (
					<button
						key={label}
						type="button"
						role="switch"
						aria-checked={on}
						onClick={toggle}
						className={itemClass(on)}
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

			<fieldset className="flex gap-4">
				<legend className="sr-only">{m.settings_language()}</legend>
				{locales.map((l) => (
					<button
						key={l}
						type="button"
						lang={l}
						aria-pressed={l === locale}
						aria-label={LOCALE_NAMES[l]}
						// Loads the same page in the other language and remembers the choice.
						onClick={() => l !== locale && setLocale(l)}
						className={itemClass(l === locale)}
					>
						{l}
					</button>
				))}
			</fieldset>
		</div>
	);
}
