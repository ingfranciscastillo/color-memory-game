import { createFileRoute } from "@tanstack/react-router";
import { LATEST_RELEASE } from "@/content/changelog";
import { SITE_URL } from "@/lib/seo";
import { baseLocale, locales, localizeHref } from "@/paraglide/runtime.js";

/**
 * Indexable pages only. The play screen, stats, profile and reset-password
 * are noindex: they're app screens with no content of their own on load.
 */
const PATHS = ["/", "/how-to-play", "/leaderboard", "/changelog"];

const url = (path: string, locale: (typeof locales)[number]) =>
	`${SITE_URL}${localizeHref(path, { locale })}`;

/** One entry per page and language, each listing every alternate. */
function sitemap(): string {
	const entries = PATHS.flatMap((path) =>
		locales.map((locale) =>
			[
				"  <url>",
				`    <loc>${url(path, locale)}</loc>`,
				`    <lastmod>${LATEST_RELEASE.date}</lastmod>`,
				...locales.map(
					(alt) =>
						`    <xhtml:link rel="alternate" hreflang="${alt}" href="${url(path, alt)}" />`,
				),
				`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(path, baseLocale)}" />`,
				"  </url>",
			].join("\n"),
		),
	);
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...entries,
		"</urlset>",
		"",
	].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () =>
				new Response(sitemap(), {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				}),
		},
	},
});
