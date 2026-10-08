import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { MOTION_INIT_SCRIPT } from "@/lib/motion";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import appCss from "../styles.css?url";

const DEFAULT_TITLE = `${SITE_NAME} — A minimal color memory game`;
const DEFAULT_DESCRIPTION =
	"See a color. Memorize it. Rebuild it. A minimal test of visual memory and perception, scored in perceptual color space.";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: DEFAULT_TITLE,
			},
			{
				name: "description",
				content: DEFAULT_DESCRIPTION,
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "theme-color",
				content: THEME_COLORS.light,
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: SITE_NAME,
			},
			{
				property: "og:title",
				content: DEFAULT_TITLE,
			},
			{
				property: "og:description",
				content: DEFAULT_DESCRIPTION,
			},
			{
				property: "og:url",
				content: SITE_URL,
			},
			{
				name: "twitter:card",
				content: "summary",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// The inline script adds `.dark` / `.reduce-motion` to <html> before hydration.
		<html lang="en" suppressHydrationWarning>
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
