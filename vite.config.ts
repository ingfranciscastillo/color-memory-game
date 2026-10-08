import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			emitTsDeclarations: true,
			cookieName: "color-memory-locale",
			// Both locales are prefixed, so a bare "/" falls through to the
			// saved choice, then the browser language.
			strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
			// First match wins: specific routes before the wildcard.
			urlPatterns: [
				{
					// Auth callbacks and other endpoints are never localized.
					pattern: "/api/:path(.*)?",
					localized: [
						["en", "/api/:path(.*)?"],
						["es", "/api/:path(.*)?"],
					],
				},
				{
					pattern: "/",
					localized: [
						["en", "/en"],
						["es", "/es"],
					],
				},
				{
					pattern: "/play",
					localized: [
						["en", "/en/play"],
						["es", "/es/jugar"],
					],
				},
				{
					pattern: "/:path(.*)?",
					localized: [
						["en", "/en/:path(.*)?"],
						["es", "/es/:path(.*)?"],
					],
				},
			],
		}),
		nitro(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
