import { useEffect, useState } from "react";
import {
	loadSoundPreference,
	playSound,
	saveSoundPreference,
	setSoundEnabled,
} from "@/lib/sound";

/** The sound switch: off until the player turns it on, then remembered. */
export function useSound() {
	const [on, setOn] = useState(false);

	// Read the saved choice on the client only (the server can't know it).
	useEffect(() => {
		const saved = loadSoundPreference();
		setOn(saved);
		setSoundEnabled(saved);
	}, []);

	const toggle = () => {
		const next = !on;
		saveSoundPreference(next);
		setSoundEnabled(next);
		setOn(next);
		// Turning it on is a gesture: confirm with a tap.
		if (next) playSound("tap");
	};

	return { on, toggle };
}
