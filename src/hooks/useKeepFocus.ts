import { type RefObject, useEffect } from "react";

/**
 * When a screen change removes the control that was just pressed (Check,
 * Next, Finish), focus falls back to <body>. This puts it on `target`
 * instead (a heading with tabIndex -1), so keyboard and screen reader users
 * carry on from the new content, not from the top of the page.
 *
 * Runs on mount and whenever `key` changes; focus that is somewhere else
 * on purpose is left alone.
 */
export function useKeepFocus(
	target: RefObject<HTMLElement | null>,
	key?: unknown,
) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: key is the trigger: check after every change.
	useEffect(() => {
		const active = document.activeElement;
		if (!active || active === document.body) {
			target.current?.focus({ preventScroll: true });
		}
	}, [key, target]);
}
