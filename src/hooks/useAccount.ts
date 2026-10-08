import { authClient } from "@/lib/auth-client";

/**
 * The player's session, telling a real account apart from the anonymous
 * user created just to play.
 */
export function useAccount() {
	const { data, isPending, refetch } = authClient.useSession();
	const user = data?.user ?? null;

	return {
		isPending,
		/** Real (non-anonymous) account, or null. */
		account: user && !user.isAnonymous ? user : null,
		refetch,
	};
}
