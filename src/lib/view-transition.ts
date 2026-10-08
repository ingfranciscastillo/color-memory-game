import { flushSync } from "react-dom";
import { isMotionReduced } from "./motion";

/**
 * Runs a React state update inside a View Transition, so elements sharing a
 * `view-transition-name` (the swatch) morph between phases. Falls back to a
 * plain update where the API is missing or motion is reduced.
 */
export function withViewTransition(update: () => void) {
	if (
		typeof document === "undefined" ||
		typeof document.startViewTransition !== "function" ||
		isMotionReduced()
	) {
		update();
		return;
	}
	document.startViewTransition(() => flushSync(update));
}
