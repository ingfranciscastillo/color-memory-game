import { type ReactNode, useEffect, useRef } from "react";
import { usePresence } from "@/hooks/usePresence";
import { m } from "@/paraglide/messages.js";

/** Exit duration (the backdrop's; the card leaves slightly earlier). */
const EXIT_MS = 180;

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
}

/**
 * Modal on a native `<dialog>`: `showModal()` makes the rest of the page
 * inert, traps focus and restores it on close. The `open` prop stays in
 * charge; Escape and backdrop clicks only ask to close through `onClose`.
 * After closing, the dialog stays open EXIT_MS to animate out.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const { mounted, closing } = usePresence(open, EXIT_MS);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// showModal() focuses the first element (Close). If the content marks
			// another with data-autofocus (a field), focus goes there.
			dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
		}
		if (!mounted && dialog.open) dialog.close();
	}, [open, mounted]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard closes with Escape via the cancel event.
		<dialog
			ref={dialogRef}
			className={`modal-backdrop ${closing ? "is-closing" : ""}`}
			aria-label={title}
			onCancel={(event) => {
				// Escape: the parent's state decides, not the browser.
				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				// Only the <dialog> itself (the backdrop) closes; clicks on the card don't.
				if (event.target === event.currentTarget) onClose();
			}}
		>
			{mounted && (
				<div className="modal-card">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="text-xs uppercase tracking-[0.3em]">{title}</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
						>
							{m.close()}
						</button>
					</div>
					<div className="mt-8">{children}</div>
				</div>
			)}
		</dialog>
	);
}
