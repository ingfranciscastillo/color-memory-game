import {
	anonymousClient,
	emailOTPClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
	plugins: [
		anonymousClient(),
		emailOTPClient(),
		// Types of the custom user fields (avatarSeed…) from the server.
		inferAdditionalFields<typeof auth>(),
	],
});
