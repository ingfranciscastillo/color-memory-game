import { lazy, Suspense, useEffect, useState } from "react";

const load = () => import("./AuthDialog");

const AuthDialog = lazy(() =>
	load().then((module) => ({ default: module.AuthDialog })),
);

/**
 * Fetches the dialog's code ahead of the first open: on intent (hover or
 * focus on a sign-in button) or once the page is idle. Calling it again is
 * free, the module is cached.
 */
export function preloadAuthDialog() {
	void load();
}

/** Preloads the dialog when the browser is idle, off the critical path. */
export function usePreloadAuthDialog(active: boolean) {
	useEffect(() => {
		if (!active) return;
		if (typeof window.requestIdleCallback === "function") {
			const id = window.requestIdleCallback(preloadAuthDialog, {
				timeout: 5000,
			});
			return () => window.cancelIdleCallback(id);
		}
		const timer = window.setTimeout(preloadAuthDialog, 2000);
		return () => window.clearTimeout(timer);
	}, [active]);
}

/**
 * The sign-in dialog, loaded on demand: its forms, Turnstile and the email
 * code input stay out of every page's initial JavaScript. Once opened it
 * stays mounted, so its step and notices survive closing and reopening.
 */
export function LazyAuthDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [requested, setRequested] = useState(open);
	if (open && !requested) setRequested(true);
	if (!requested) return null;
	return (
		<Suspense fallback={null}>
			<AuthDialog open={open} onClose={onClose} />
		</Suspense>
	);
}
