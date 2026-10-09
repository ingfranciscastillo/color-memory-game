import handler from "@tanstack/react-start/server-entry";
import { isUnlocalizedPath } from "./lib/seo";
import { paraglideMiddleware } from "./paraglide/server.js";

/**
 * The middleware only redirects document requests. Endpoints such as the
 * OAuth callback (/api/auth/callback/discord), robots.txt or the sitemap
 * can be document navigations too, but must never get a locale prefix, so
 * the middleware sees them without that header. It still picks their locale
 * (cookie, then Accept-Language).
 */
function forLocaleDetection(req: Request): Request {
	if (!isUnlocalizedPath(new URL(req.url).pathname)) return req;
	const headers = new Headers(req.headers);
	headers.delete("Sec-Fetch-Dest");
	return new Request(req.url, { method: req.method, headers });
}

export default {
	fetch(req: Request): Promise<Response> {
		// The router localizes URLs itself (rewrite in router.tsx), so pass the
		// original request: the middleware only detects the locale, redirects
		// "/" and scopes getLocale() to this request.
		return paraglideMiddleware(forLocaleDetection(req), () =>
			handler.fetch(req),
		);
	},
};
