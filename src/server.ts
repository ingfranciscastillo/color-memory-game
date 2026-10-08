import handler from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "./paraglide/server.js";

export default {
	fetch(req: Request): Promise<Response> {
		// The router localizes URLs itself (rewrite in router.tsx), so pass the
		// original request: the middleware only detects the locale, sets the
		// cookie, redirects "/" and scopes getLocale() to this request.
		return paraglideMiddleware(req, () => handler.fetch(req));
	},
};
