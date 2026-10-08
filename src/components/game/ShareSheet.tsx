import { useState } from "react";
import { buildShareText, renderShareImage } from "@/lib/share";
import { m } from "@/paraglide/messages.js";
import { getLocale, localizeHref } from "@/paraglide/runtime.js";

type Status = "idle" | "working" | "copied" | "failed";

/**
 * Shares the daily palette: the native share sheet with the image and text
 * where files can be shared (phones); otherwise the text goes to the
 * clipboard and the image can be downloaded.
 */
export function ShareSheet({
	dayKey,
	scores,
	total,
}: {
	dayKey: string;
	scores: number[];
	total: number;
}) {
	const [status, setStatus] = useState<Status>("idle");
	const [image, setImage] = useState<string | null>(null);
	const locale = getLocale();

	const share = async () => {
		setStatus("working");
		const url = `${window.location.origin}${localizeHref("/")}`;
		const text = buildShareText({ dayKey, scores, total, url, locale });
		try {
			const blob = await renderShareImage({ dayKey, scores, total, locale });
			const file = new File([blob], `color-memory-${dayKey}.png`, {
				type: "image/png",
			});
			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ text, files: [file] });
				setStatus("idle");
				return;
			}
			setImage(URL.createObjectURL(blob));
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(text);
				setStatus("copied");
			} else {
				setStatus("failed");
			}
		} catch (error) {
			// Closing the share sheet isn't a failure.
			if (error instanceof DOMException && error.name === "AbortError") {
				setStatus("idle");
				return;
			}
			setStatus("failed");
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-4">
			<button
				type="button"
				onClick={share}
				disabled={status === "working"}
				aria-busy={status === "working"}
				className="rounded-xl bg-ink px-6 py-3 font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-60"
			>
				{m.share_button()}
			</button>
			{image && (
				<a
					href={image}
					download={`color-memory-${dayKey}.png`}
					className="text-sm font-semibold underline underline-offset-4"
				>
					{m.share_download()}
				</a>
			)}
			<p role="status" className="w-full text-sm text-ink-muted empty:hidden">
				{status === "copied"
					? m.share_copied()
					: status === "failed"
						? m.share_failed()
						: ""}
			</p>
		</div>
	);
}
