import { useEffect, useState } from "react";
import { isMotionReduced } from "@/lib/motion";

/**
 * Keeps an element mounted while its exit animation plays.
 *
 * - `mounted`: whether to render it (open or closing).
 * - `closing`: whether it's in its exit animation (adds `is-closing`).
 *
 * With reduced motion (setting or system) it unmounts at once.
 */
export function usePresence(open: boolean, exitMs: number) {
	const [mounted, setMounted] = useState(open);
	const [closing, setClosing] = useState(false);

	useEffect(() => {
		if (open) {
			setMounted(true);
			setClosing(false);
			return;
		}
		if (!mounted) return;

		if (isMotionReduced() || exitMs <= 0) {
			setMounted(false);
			setClosing(false);
			return;
		}

		setClosing(true);
		const timer = setTimeout(() => {
			setMounted(false);
			setClosing(false);
		}, exitMs);
		return () => clearTimeout(timer);
	}, [open, mounted, exitMs]);

	return { mounted, closing };
}
