import { useEffect } from "react";

/**
 * Registers public/sw.js in production builds only: on the dev server it
 * would cache modules that Vite serves fresh on every change. Rendered once,
 * by the root route's component.
 */
export function RegisterServiceWorker() {
	useEffect(() => {
		if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
			// No offline support this visit; the game works the same online.
		});
	}, []);
	return null;
}
