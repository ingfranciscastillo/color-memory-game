import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { deLocalizeUrl, localizeUrl } from "./paraglide/runtime.js";
import { routeTree } from "./routeTree.gen";

/**
 * A fresh nonce for each server render. The router puts it on its own
 * inline scripts (hydration data, ScriptOnce) and the root route sends it
 * in the Content-Security-Policy header.
 */
const getSsrOptions = createIsomorphicFn().server(() => {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return { nonce: btoa(String.fromCharCode(...bytes)) };
});

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		ssr: getSsrOptions(),
		// Routes are written without a locale ("/play"); URLs carry one ("/es/jugar").
		rewrite: {
			input: ({ url }) => deLocalizeUrl(url),
			output: ({ url }) => localizeUrl(url),
		},
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
