import { LOCALE_NAMES } from "@/lib/i18n";
import { m } from "@/paraglide/messages.js";
import { getLocale, locales, setLocale } from "@/paraglide/runtime.js";

/** EN | ES in the header. Loads the same page in the other language. */
export function LanguageSwitch() {
	const locale = getLocale();
	return (
		<fieldset className="flex rounded-lg bg-muted p-0.5">
			<legend className="sr-only">{m.settings_language()}</legend>
			{locales.map((l) => (
				<button
					key={l}
					type="button"
					lang={l}
					aria-pressed={l === locale}
					// Starts with the visible code, so voice control ("click ES") works.
					aria-label={`${l.toUpperCase()}, ${LOCALE_NAMES[l]}`}
					onClick={() => l !== locale && setLocale(l)}
					className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase transition-colors ${
						l === locale
							? "bg-card text-ink shadow-sm"
							: "text-ink-muted hover:text-ink"
					}`}
				>
					{l}
				</button>
			))}
		</fieldset>
	);
}
