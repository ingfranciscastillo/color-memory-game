/** The logo: two overlapping paint chips (same drawing as favicon.svg). */
export function BrandMark({ size = 28 }: { size?: number }) {
	return (
		<svg
			viewBox="0 0 64 64"
			width={size}
			height={size}
			aria-hidden="true"
			className="shrink-0"
		>
			<g transform="rotate(8 40 34)">
				<rect
					x="26"
					y="10"
					width="28"
					height="40"
					rx="4"
					fill="var(--card)"
					stroke="var(--ink)"
					strokeOpacity="0.15"
				/>
				<rect x="29" y="13" width="22" height="24" rx="2" fill="#4338ca" />
			</g>
			<g transform="rotate(-6 24 32)">
				<rect
					x="10"
					y="12"
					width="28"
					height="40"
					rx="4"
					fill="var(--card)"
					stroke="var(--ink)"
					strokeOpacity="0.15"
				/>
				<rect x="13" y="15" width="22" height="24" rx="2" fill="#f2542d" />
			</g>
		</svg>
	);
}
