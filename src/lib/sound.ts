/**
 * Optional sounds, synthesized with Web Audio (no files): a card tap, the
 * thud of the score stamp and a short chord for a nailed round.
 *
 * Off by default; the choice is saved in the browser like reduced motion.
 * Nothing plays until the first user gesture (browsers block audio before
 * that anyway), or while the tab is hidden.
 */

const SOUND_KEY = "color-memory:sound:v1";
const PEAK = 0.2;

export type SoundName = "tap" | "stamp" | "nailed";

let enabled = false;
let context: AudioContext | null = null;
let unlocked = false;

export function loadSoundPreference(): boolean {
	try {
		return window.localStorage.getItem(SOUND_KEY) === "on";
	} catch {
		return false;
	}
}

export function saveSoundPreference(on: boolean) {
	try {
		window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
	} catch {
		/* storage unavailable */
	}
}

/** Kept in sync by useSound, so playSound needs no React state. */
export function setSoundEnabled(on: boolean) {
	enabled = on;
}

/** Waits for the first gesture before an AudioContext may start. */
function listenForUnlock() {
	if (typeof window === "undefined" || unlocked) return;
	const unlock = () => {
		unlocked = true;
		window.removeEventListener("pointerdown", unlock);
		window.removeEventListener("keydown", unlock);
	};
	window.addEventListener("pointerdown", unlock, { once: true });
	window.addEventListener("keydown", unlock, { once: true });
}
listenForUnlock();
// Apply the saved choice on every page, not only where the switch is shown.
if (typeof window !== "undefined") enabled = loadSoundPreference();

function audio(): AudioContext | null {
	if (!unlocked || typeof AudioContext === "undefined") return null;
	context ??= new AudioContext();
	if (context.state === "suspended") void context.resume();
	return context;
}

/** A gain envelope: instant attack, exponential decay over `ms`. */
function envelope(ctx: AudioContext, peak: number, ms: number, at: number) {
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(peak, at);
	gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
	gain.connect(ctx.destination);
	return gain;
}

function noise(ctx: AudioContext, ms: number) {
	const buffer = ctx.createBuffer(
		1,
		Math.ceil((ctx.sampleRate * ms) / 1000),
		ctx.sampleRate,
	);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	return source;
}

function tone(
	ctx: AudioContext,
	type: OscillatorType,
	frequency: number,
	output: AudioNode,
	at: number,
	ms: number,
) {
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(frequency, at);
	osc.connect(output);
	osc.start(at);
	osc.stop(at + ms / 1000);
}

export function playSound(name: SoundName) {
	if (!enabled || (typeof document !== "undefined" && document.hidden)) return;
	const ctx = audio();
	if (!ctx) return;
	const now = ctx.currentTime;

	if (name === "tap") {
		// Card against card: a short burst of filtered noise.
		const source = noise(ctx, 30);
		const filter = ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.value = 2200;
		source.connect(filter);
		filter.connect(envelope(ctx, PEAK * 0.6, 30, now));
		source.start(now);
	} else if (name === "stamp") {
		// A low thud with a little paper slap on top.
		tone(ctx, "sine", 90, envelope(ctx, PEAK, 120, now), now, 140);
		const slap = noise(ctx, 40);
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 900;
		slap.connect(filter);
		filter.connect(envelope(ctx, PEAK * 0.5, 40, now));
		slap.start(now);
	} else {
		// A bright major triad, notes a hair apart.
		[523.25, 659.25, 783.99].forEach((frequency, i) => {
			const at = now + i * 0.04;
			tone(
				ctx,
				"triangle",
				frequency,
				envelope(ctx, PEAK * 0.6, 250, at),
				at,
				260,
			);
		});
	}
}
