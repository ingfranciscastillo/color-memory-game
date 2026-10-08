import { useHydrated } from "@tanstack/react-router";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSound } from "@/hooks/useSound";
import { useTheme } from "@/hooks/useTheme";
import { LOCALE_NAMES } from "@/lib/i18n";
import { DARK } from "@/lib/theme";
import { m } from "@/paraglide/messages.js";
import { getLocale, locales, setLocale } from "@/paraglide/runtime.js";

/** Theme, motion and language settings. */
export function SettingsBar() {
	const { theme, toggleTheme } = useTheme();
	const { reduced, toggleReducedMotion } = useReducedMotion();
	const sound = useSound();
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
		{
			label: m.settings_sound(),
			on: hydrated && sound.on,
			toggle: sound.toggle,
		},
	];

	return (
		<div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-sm">
			<div className="flex flex-wrap gap-x-6 gap-y-3">
				{switches.map(({ label, on, toggle }) => (
					<button
						key={label}
						type="button"
						role="switch"
						aria-checked={on}
						onClick={toggle}
						className="flex items-center gap-2.5 text-ink-muted transition-colors hover:text-ink aria-checked:text-ink"
					>
						{/* A small toggle: track with a sliding knob. */}
						<span
							aria-hidden="true"
							className={`relative h-5 w-9 rounded-full transition-colors ${
								on ? "bg-ink" : "bg-input"
							}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-sm transition-transform duration-150 ${
									on ? "translate-x-4" : ""
								}`}
							/>
						</span>
						{label}
					</button>
				))}
			</div>

			<fieldset className="flex rounded-lg bg-muted p-0.5">
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
						className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition-colors ${
							l === locale
								? "bg-card text-ink shadow-sm"
								: "text-ink-muted hover:text-ink"
						}`}
					>
						{l}
					</button>
				))}
			</fieldset>
		</div>
	);
}
