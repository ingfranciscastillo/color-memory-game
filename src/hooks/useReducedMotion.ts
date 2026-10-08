import { useEffect, useState } from "react";
import {
	applyReducedMotion,
	loadReducedMotionPreference,
	saveReducedMotionPreference,
	systemReducedMotion,
} from "@/lib/motion";

/**
 * Follows `prefers-reduced-motion` until the player picks, then remembers it.
 * Same pattern as useTheme.
 */
export function useReducedMotion() {
	const [preference, setPreference] = useState<boolean | null>(
		loadReducedMotionPreference,
	);
	const [system, setSystem] = useState<boolean>(systemReducedMotion);

	const reduced = preference ?? system;

	useEffect(() => {
		applyReducedMotion(reduced);
	}, [reduced]);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onChange = (event: MediaQueryListEvent) => setSystem(event.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	const toggleReducedMotion = () => {
		const next = !reduced;
		saveReducedMotionPreference(next);
		setPreference(next);
	};

	return { reduced, toggleReducedMotion };
}
