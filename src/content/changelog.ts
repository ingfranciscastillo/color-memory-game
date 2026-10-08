/**
 * Color Memory release notes, newest first. The /changelog page and
 * CHANGELOG.md (`pnpm changelog`) both come from this list.
 *
 * Write them for players (what changes when you play), not as commit
 * messages: one short sentence per change, in both languages, no technical
 * detail. The first entry sets the version shown on the home screen.
 *
 * No path aliases here: scripts/build-changelog.ts runs this file with Node.
 */

export type ChangeKind = "added" | "improved" | "fixed";

export interface Change {
	kind: ChangeKind;
	text: { en: string; es: string };
}

export interface ChangelogEntry {
	/** Version shown, without the "v": "1.0", "1.1"… */
	version: string;
	/** Release date, YYYY-MM-DD. */
	date: string;
	changes: readonly Change[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
	{
		version: "1.6",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "A whole new look: modes are a painter's sample deck, and every color is a paint chip you memorize, fill and compare.",
					es: "Un aspecto totalmente nuevo: los modos son un muestrario de pintor y cada color es una muestra que memorizas, rellenas y comparas.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Every color has its own invented name, the same for everyone.",
					es: "Cada color tiene su propio nombre inventado, el mismo para todos.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Share your daily palette without spoiling the colors.",
					es: "Comparte tu paleta del diario sin desvelar los colores.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Your sample deck: every color you nail with 90 or more, in your profile.",
					es: "Tu muestrario: cada color que clavas con 90 o más, en tu perfil.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Optional sounds for cards and the score stamp.",
					es: "Sonidos opcionales para las cartas y el sello de puntuación.",
				},
			},
			{
				kind: "improved",
				text: {
					en: "Colors are shown and compared on a neutral gray, the same in light and dark mode, so they look the same to everyone.",
					es: "Los colores se muestran y comparan sobre un gris neutro, igual en modo claro y oscuro, para que todos los vean igual.",
				},
			},
		],
	},
	{
		version: "1.5",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "Leaderboards: one per day for the daily challenge and a weekly one for every other mode.",
					es: "Clasificaciones: una por día para el reto diario y una semanal para cada modo.",
				},
			},
			{
				kind: "added",
				text: {
					en: "This What's new page.",
					es: "Esta página de novedades.",
				},
			},
		],
	},
	{
		version: "1.4",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "A stats page: your averages, score spread, streaks and where your colors miss.",
					es: "Página de estadísticas: tus medias, el reparto de puntuaciones, tus rachas y dónde fallan tus colores.",
				},
			},
		],
	},
	{
		version: "1.3",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "Daily challenge: five colors, the same for everyone, once a day.",
					es: "Reto diario: cinco colores, los mismos para todos, una vez al día.",
				},
			},
			{
				kind: "improved",
				text: {
					en: "Every round is scored on our server, so scores can be compared fairly.",
					es: "Cada ronda se puntúa en nuestro servidor, así las puntuaciones se pueden comparar con justicia.",
				},
			},
		],
	},
	{
		version: "1.2",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "Optional accounts with Discord, an email code or a password, so your games follow you between devices.",
					es: "Cuentas opcionales con Discord, un código por email o contraseña, para llevar tus partidas a cualquier dispositivo.",
				},
			},
		],
	},
	{
		version: "1.1",
		date: "2026-10-08",
		changes: [
			{
				kind: "added",
				text: {
					en: "Spanish, alongside English.",
					es: "Español, además de inglés.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Dark mode and a reduce motion setting.",
					es: "Modo oscuro y un ajuste para reducir animaciones.",
				},
			},
			{
				kind: "improved",
				text: {
					en: "The color picker works with the arrow keys.",
					es: "El selector de color funciona con las flechas del teclado.",
				},
			},
		],
	},
	{
		version: "1.0",
		date: "2026-09-11",
		changes: [
			{
				kind: "added",
				text: {
					en: "Four modes: classic, speed, precision and endless.",
					es: "Cuatro modos: clásico, velocidad, precisión e infinito.",
				},
			},
			{
				kind: "added",
				text: {
					en: "Scores that follow how close colors look to the eye, with hue, saturation and lightness feedback.",
					es: "Puntuaciones según lo parecidos que se ven los colores, con detalle de tono, saturación y luminosidad.",
				},
			},
		],
	},
];

export const LATEST_RELEASE = CHANGELOG[0];
