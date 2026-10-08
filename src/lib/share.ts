import { m } from "@/paraglide/messages.js";

type Locale = "en" | "es";

/** A score band as a colored block: green ≥ 90, yellow ≥ 70, orange ≥ 50. */
function block(score: number): string {
	if (score >= 90) return "🟩";
	if (score >= 70) return "🟨";
	if (score >= 50) return "🟧";
	return "🟥";
}

function shortDate(dayKey: string, locale: Locale): string {
	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	})
		.format(new Date(dayKey))
		.replace(".", "");
}

interface ShareInput {
	dayKey: string;
	scores: number[];
	total: number;
	locale: Locale;
}

/**
 * The daily result as text, Wordle-style: scores as colored blocks, never
 * the colors themselves, so it spoils nothing for those who haven't played.
 */
export function buildShareText({
	dayKey,
	scores,
	total,
	url,
	locale,
}: ShareInput & { url: string }): string {
	const header = [
		"Color Memory",
		`${m.mode_daily({}, { locale })} ${shortDate(dayKey, locale)}`,
		`${total}/${scores.length * 100}`,
	].join(" · ");
	return [header, scores.map(block).join(""), url].join("\n");
}

const SIZE = 1080;
const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif';

/**
 * The same result as a 1080×1080 card: blank white swatches with each
 * round's score, the total and the date. No target colors.
 */
export async function renderShareImage({
	dayKey,
	scores,
	total,
	locale,
}: ShareInput): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	await document.fonts?.ready;

	ctx.fillStyle = "#f4f3ef";
	ctx.fillRect(0, 0, SIZE, SIZE);

	ctx.fillStyle = "#1a1a1a";
	ctx.font = `700 64px ${FONT}`;
	ctx.fillText("Color Memory", 96, 160);
	ctx.fillStyle = "#6b6a66";
	ctx.font = `500 40px ${FONT}`;
	ctx.fillText(
		`${m.mode_daily({}, { locale })} · ${shortDate(dayKey, locale)}`,
		96,
		224,
	);

	// Five blank swatches, slightly fanned, each with its score.
	const cardW = 150;
	const cardH = 300;
	const gap = (SIZE - 192 - cardW * scores.length) / (scores.length - 1);
	scores.forEach((score, i) => {
		const x = 96 + i * (cardW + gap);
		const y = 330;
		ctx.save();
		ctx.translate(x + cardW / 2, y + cardH);
		ctx.rotate(((i - (scores.length - 1) / 2) * 3 * Math.PI) / 180);
		ctx.translate(-cardW / 2, -cardH);
		ctx.shadowColor = "rgb(0 0 0 / 0.12)";
		ctx.shadowBlur = 24;
		ctx.shadowOffsetY = 8;
		ctx.fillStyle = "#ffffff";
		ctx.beginPath();
		ctx.roundRect(0, 0, cardW, cardH, 16);
		ctx.fill();
		ctx.shadowColor = "transparent";
		ctx.fillStyle = "#e9e7e1";
		ctx.beginPath();
		ctx.roundRect(12, 12, cardW - 24, cardH * 0.6, 10);
		ctx.fill();
		ctx.fillStyle = "#1a1a1a";
		ctx.font = `800 56px ${FONT}`;
		ctx.textAlign = "center";
		ctx.fillText(String(score), cardW / 2, cardH - 50);
		ctx.font = `600 28px ${FONT}`;
		ctx.fillText(block(score), cardW / 2, cardH * 0.36);
		ctx.restore();
	});

	ctx.textAlign = "left";
	ctx.fillStyle = "#1a1a1a";
	ctx.font = `800 150px ${FONT}`;
	ctx.fillText(String(total), 96, 900);
	const width = ctx.measureText(String(total)).width;
	ctx.fillStyle = "#6b6a66";
	ctx.font = `500 56px ${FONT}`;
	ctx.fillText(`/ ${scores.length * 100}`, 96 + width + 24, 900);

	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))),
			"image/png",
		),
	);
}
