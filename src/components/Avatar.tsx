import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import shapes from "@dicebear/styles/shapes.json" with { type: "json" };
import { useMemo } from "react";

interface AvatarProps {
	seed: string;
	size?: number;
	className?: string;
}

/**
 * Player avatar (DiceBear, Shapes style — abstract color blocks, fitting for
 * a color game). Generated locally: no external service involved.
 * Decorative: whoever uses it must show the player's name next to it.
 */
export function Avatar({ seed, size = 40, className }: AvatarProps) {
	const src = useMemo(
		() => new DiceBearAvatar(new Style(shapes), { seed }).toDataUri(),
		[seed],
	);

	return (
		<img
			src={src}
			alt=""
			width={size}
			height={size}
			className={`shrink-0 ${className ?? ""}`}
			style={{ width: size, height: size }}
		/>
	);
}
