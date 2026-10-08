import { getAuthProviders } from "@/server/profile";

export type SocialProvider = "discord";

let request: Promise<SocialProvider[]> | null = null;

/**
 * Social providers configured on the server, fetched once per tab. The
 * sign-in button preloads them so the dialog doesn't jump when it opens.
 */
export function loadAuthProviders(): Promise<SocialProvider[]> {
	request ??= getAuthProviders().catch(() => {
		request = null; // Retry next time if it failed.
		return [];
	});
	return request;
}
