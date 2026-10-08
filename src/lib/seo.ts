// Public URL without a trailing slash. Set VITE_SITE_URL in production; the
// placeholder only keeps canonical/OG URLs well-formed until there's a domain.
export const SITE_URL =
	import.meta.env.VITE_SITE_URL ?? "https://color-memory-game.example.com";
export const SITE_NAME = "Color Memory";
