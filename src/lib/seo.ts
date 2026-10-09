// Public URL without a trailing slash, from VITE_SITE_URL (set on Vercel).
// The placeholder only keeps canonical/OG URLs well-formed locally.
export const SITE_URL = (
	import.meta.env.VITE_SITE_URL ?? "https://color-memory-game.example.com"
).replace(/\/+$/, "");
export const SITE_NAME = "Color Memory";

/** Social preview image (1200×630, language-neutral), in /public. */
export const OG_IMAGE = {
	url: `${SITE_URL}/og-image.png`,
	width: 1200,
	height: 630,
};

/**
 * Paths served the same in every language: never redirected to a locale
 * prefix (server.ts) and never localized by the router.
 */
export const UNLOCALIZED_PATHS = [
	"/api/",
	"/robots.txt",
	"/sitemap.xml",
	"/manifest.webmanifest",
];

export const isUnlocalizedPath = (pathname: string) =>
	UNLOCALIZED_PATHS.some((path) =>
		path.endsWith("/") ? pathname.startsWith(path) : pathname === path,
	);
