import { useHydrated } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSound } from "@/hooks/useSound";
import { useTheme } from "@/hooks/useTheme";
import { DARK } from "@/lib/theme";
import { m } from "@/paraglide/messages.js";

const EXIT_MS = 120;

/** A small switch: track with a sliding knob. */
function Toggle({
	label,
	on,
	onToggle,
}: {
	label: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			onClick={onToggle}
			className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
		>
			{label}
			<span
				aria-hidden="true"
				className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
					on ? "bg-ink" : "bg-input"
				}`}
			>
				<span
					className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-sm transition-transform duration-150 ${
						on ? "translate-x-4" : ""
					}`}
				/>
			</span>
		</button>
	);
}

function SlidersIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width="20"
			height="20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			aria-hidden="true"
		>
			<path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
			<circle cx="16" cy="7" r="2" />
			<circle cx="10" cy="17" r="2" />
		</svg>
	);
}

/**
 * Settings in the header: a button opening a small panel, grouped into
 * appearance, accessibility and sound. Escape or a click outside closes it.
 */
export function SettingsMenu() {
	const [open, setOpen] = useState(false);
	const { mounted, closing } = usePresence(open, EXIT_MS);
	const { theme, toggleTheme } = useTheme();
	const { reduced, toggleReducedMotion } = useReducedMotion();
	const sound = useSound();
	// The server can't know the saved preferences: show switch state after hydration.
	const hydrated = useHydrated();
	const container = useRef<HTMLDivElement>(null);
	const button = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!container.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			setOpen(false);
			button.current?.focus();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	const groups = [
		{
			title: m.settings_group_appearance(),
			label: m.settings_dark_mode(),
			on: hydrated && theme === DARK,
			toggle: toggleTheme,
		},
		{
			title: m.settings_group_accessibility(),
			label: m.settings_reduce_motion(),
			on: hydrated && reduced,
			toggle: toggleReducedMotion,
		},
		{
			title: m.settings_sound(),
			label: m.settings_game_sounds(),
			on: hydrated && sound.on,
			toggle: sound.toggle,
		},
	];

	return (
		<div ref={container} className="relative">
			<button
				ref={button}
				type="button"
				aria-label={m.settings_title()}
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((value) => !value)}
				className={`flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted ${
					open ? "bg-muted" : ""
				}`}
			>
				<SlidersIcon />
			</button>
			{mounted && (
				<div
					id={panelId}
					className={`absolute top-full right-0 z-30 mt-2 w-64 origin-top-right rounded-xl bg-card p-2 text-ink shadow-(--shadow-card-lifted) ${
						closing
							? "animate-[fade-out_120ms_cubic-bezier(0.4,0,1,1)_forwards]"
							: "animate-step-in"
					}`}
				>
					{groups.map((group) => (
						<section
							key={group.title}
							className="py-1 not-first:border-t not-first:border-border"
						>
							<h2 className="px-2 pt-1.5 text-xs text-ink-muted">
								{group.title}
							</h2>
							<Toggle
								label={group.label}
								on={group.on}
								onToggle={group.toggle}
							/>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
