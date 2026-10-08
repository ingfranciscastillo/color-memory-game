import { createServerFn } from "@tanstack/react-start";

/** Social providers configured on the server (dialog buttons). */
export const getAuthProviders = createServerFn({ method: "GET" }).handler(
	async () => {
		const { SOCIAL_PROVIDERS } = await import("@/lib/auth");
		return SOCIAL_PROVIDERS;
	},
);
