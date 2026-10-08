import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { MOTION_INIT_SCRIPT } from "@/lib/motion";
import { SITE_NAME } from "@/lib/seo";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import { m } from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: m.site_title() },
			{ name: "description", content: m.site_description() },
			{ name: "robots", content: "index, follow" },
			{ name: "theme-color", content: THEME_COLORS.light },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:title", content: m.site_title() },
			{ property: "og:description", content: m.site_description() },
			{ name: "twitter:card", content: "summary" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// The inline script adds `.dark` / `.reduce-motion` to <html> before hydration.
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: fixed script built from our own constants.
					dangerouslySetInnerHTML={{
						__html: THEME_INIT_SCRIPT + MOTION_INIT_SCRIPT,
					}}
				/>
			</head>
			<body>
				{children}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}
