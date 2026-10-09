import { useEffect, useState } from "react";

interface AvatarProps {
	seed: string;
	size?: number;
	className?: string;
}

type Render = (seed: string) => string;

let renderer: Promise<Render> | null = null;

/**
 * DiceBear and its style are loaded on first use (once per tab), so pages
 * without avatars, and the first paint of those with them, don't pay for it.
 */
function loadRenderer(): Promise<Render> {
	renderer ??= Promise.all([
		import("@dicebear/core"),
		// No `with { type: "json" }` here: Vite's dev server serves the JSON
		// as a JS module, and the browser rejects that for a JSON import.
		import("@dicebear/styles/shapes.json"),
	])
		.then(
			([{ Avatar, Style }, { default: shapes }]) =>
				(seed: string) =>
					new Avatar(new Style(shapes), { seed }).toDataUri(),
		)
		.catch((error: unknown) => {
			renderer = null; // Retry on the next avatar.
			throw error;
		});
	return renderer;
}

/**
 * Player avatar (DiceBear, Shapes style — abstract color blocks, fitting for
 * a color game). Generated locally: no external service involved.
 * Decorative: whoever uses it must show the player's name next to it.
 * Until DiceBear has loaded, a plain circle of the same size holds its place.
 */
export function Avatar({ seed, size = 40, className }: AvatarProps) {
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadRenderer()
			.then((render) => {
				if (!cancelled) setSrc(render(seed));
			})
			.catch(() => {
				// Offline or failed chunk: the placeholder circle stays.
			});
		return () => {
			cancelled = true;
		};
	}, [seed]);

	const classes = `shrink-0 rounded-full ring-1 ring-ink/15 ${className ?? ""}`;

	if (!src) {
		return (
			<span
				aria-hidden="true"
				className={`block bg-muted ${classes}`}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<img
			src={src}
			alt=""
			width={size}
			height={size}
			className={classes}
			style={{ width: size, height: size }}
		/>
	);
}
