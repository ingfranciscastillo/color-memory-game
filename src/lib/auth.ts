import { waitUntil } from "@vercel/functions";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { captcha } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins/anonymous";
import { emailOTP } from "better-auth/plugins/email-otp";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { m } from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { moveGames } from "@/server/account-link";
import { sendEmail } from "@/server/email";

/**
 * Color Memory authentication.
 *
 * - Players get an anonymous user (anonymous plugin) with an httpOnly
 *   session cookie: the server identifies the player by the session, never
 *   by anything the client sends.
 * - Optional account with Discord, an email code, or email and password.
 *   Signing in moves the anonymous player's games to the account.
 * - Discord is only enabled when its credentials exist.
 * - Emails go out in the player's language: the Paraglide middleware scopes
 *   the locale to each request (cookie, then Accept-Language).
 *
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL come from the environment.
 */

const socialProviders = {
	...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
		? {
				discord: {
					clientId: process.env.DISCORD_CLIENT_ID,
					clientSecret: process.env.DISCORD_CLIENT_SECRET,
				},
			}
		: {}),
};

/** Configured social providers (so the dialog only shows their buttons). */
export const SOCIAL_PROVIDERS = Object.keys(socialProviders) as "discord"[];

const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * This deployment's own Vercel URLs (production, branch and the unique
 * deployment URL). Listing them instead of `https://*.vercel.app` matters:
 * the wildcard would also trust any other Vercel app, including one an
 * attacker deploys, as a callbackURL/redirectTo target and request origin.
 */
const vercelOrigins = [
	process.env.VERCEL_PROJECT_PRODUCTION_URL,
	process.env.VERCEL_BRANCH_URL,
	process.env.VERCEL_URL,
]
	.filter(Boolean)
	.map((host) => `https://${host}`);

const NAME_MAX = 24;
const SEED_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Display names are public (leaderboards), and `name`/`avatarSeed` can be
 * set straight from the client: trim them, drop control characters and cap
 * the length here, the only place every write goes through.
 *
 * On create the name may come from Discord (up to 32 characters), so it's
 * shortened rather than rejected; edits from the profile are rejected.
 */
function cleanProfile<T extends { name?: string; avatarSeed?: unknown }>(
	data: T,
	{ truncate }: { truncate: boolean },
): T {
	const next = { ...data };
	if (typeof next.name === "string") {
		// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point.
		let name = next.name.replace(/[\u0000-\u001f\u007f]/g, "").trim();
		if (truncate) name = name.slice(0, NAME_MAX).trim();
		if (name.length < 2 || name.length > NAME_MAX) {
			throw new APIError("BAD_REQUEST", { message: "Invalid name" });
		}
		next.name = name;
	}
	if (
		next.avatarSeed != null &&
		(typeof next.avatarSeed !== "string" || !SEED_PATTERN.test(next.avatarSeed))
	) {
		throw new APIError("BAD_REQUEST", { message: "Invalid avatar" });
	}
	return next;
}

/**
 * Emails aren't awaited (so response time doesn't reveal whether an account
 * exists), but on Vercel they must be registered to finish sending.
 */
function sendInBackground(promise: Promise<unknown>) {
	waitUntil(promise);
}

export const auth = betterAuth({
	appName: "Color Memory",
	database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
	socialProviders,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		revokeSessionsOnPasswordReset: true,
		// Signing up with an email that already has an account answers as if it
		// were new, so it doesn't reveal which emails exist. Instead we tell the
		// owner how to get in.
		onExistingUserSignUp: async ({ user }) => {
			sendInBackground(
				sendEmail({
					to: user.email,
					subject: m.email_existing_subject(),
					lines: [m.email_existing_line1(), m.email_existing_line2()],
					action: {
						label: m.email_existing_action(),
						url: `${appUrl}${localizeHref("/")}`,
					},
				}),
			);
		},
		sendResetPassword: async ({ user, url }) => {
			sendInBackground(
				sendEmail({
					to: user.email,
					subject: m.email_reset_subject(),
					lines: [m.email_reset_line1(), m.email_reset_line2()],
					action: { label: m.email_reset_action(), url },
				}),
			);
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		// An unverified sign-in attempt resends the link.
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			sendInBackground(
				sendEmail({
					to: user.email,
					subject: m.email_verify_subject(),
					lines: [m.email_verify_line1()],
					action: { label: m.email_verify_action(), url },
				}),
			);
		},
	},
	user: {
		additionalFields: {
			/** DiceBear avatar seed; the player can reroll it. */
			avatarSeed: { type: "string", required: false, input: true },
			/** Show name and avatar on the leaderboards (opt-in). */
			showInLeaderboard: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: true,
			},
		},
		deleteUser: { enabled: true },
	},
	databaseHooks: {
		user: {
			create: {
				// Every account starts with an avatar and a name (the email code doesn't ask for one).
				before: async (user) => {
					const name = user.name?.trim() || user.email.split("@")[0];
					return {
						data: cleanProfile(
							{
								...user,
								avatarSeed:
									(user as { avatarSeed?: string | null }).avatarSeed ??
									crypto.randomUUID(),
								// Email local parts can be 1 character: pad to the minimum.
								name: name.length < 2 ? `${name}${name}` : name,
							},
							{ truncate: true },
						),
					};
				},
			},
			update: {
				before: async (data) => ({
					data: cleanProfile(data, { truncate: false }),
				}),
			},
		},
	},
	account: {
		// Discord's access/refresh tokens are stored even though we never call
		// its API: keep them encrypted (AES-256-GCM with the auth secret).
		encryptOAuthTokens: true,
		accountLinking: {
			enabled: true,
			// Discord links to an account with the same email only when Discord
			// says that email is verified (the default). Not in trustedProviders:
			// Discord allows unverified emails, which would let someone take over
			// another person's account.
		},
	},
	// BETTER_AUTH_URL is always trusted; add the public site and this deployment.
	trustedOrigins: [
		...vercelOrigins,
		...(process.env.VITE_SITE_URL ? [process.env.VITE_SITE_URL] : []),
	],
	rateLimit: {
		enabled: true,
		// Serverless instances don't share memory.
		storage: "database",
		// Keys are paths relative to basePath (/api/auth), as Better Auth matches them.
		customRules: {
			"/sign-in/anonymous": { window: 60, max: 10 },
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 3 },
			"/sign-in/email-otp": { window: 60, max: 5 },
			"/email-otp/send-verification-otp": { window: 60, max: 3 },
			"/request-password-reset": { window: 60, max: 3 },
			"/reset-password": { window: 60, max: 5 },
			"/update-user": { window: 60, max: 20 },
			"/delete-user": { window: 60, max: 3 },
		},
	},
	session: {
		// Anonymous players come back often: long session that renews itself.
		expiresIn: 60 * 60 * 24 * 60,
		updateAge: 60 * 60 * 24,
		cookieCache: { enabled: true, maxAge: 60 * 5 },
	},
	advanced: {
		cookiePrefix: "color-memory",
		ipAddress: {
			// Vercel sets both to the client IP and overwrites whatever the
			// client sent. Without trustedProxies Better Auth only trusts
			// single-value headers, so the single-value x-real-ip goes first.
			ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
		},
		backgroundTasks: { handler: sendInBackground },
	},
	plugins: [
		// Captcha (Cloudflare Turnstile) on everything that sends an email or
		// checks a password. Only when configured: not needed in development.
		...(process.env.TURNSTILE_SECRET_KEY
			? [
					captcha({
						provider: "cloudflare-turnstile",
						secretKey: process.env.TURNSTILE_SECRET_KEY,
						endpoints: [
							"/email-otp/send-verification-otp",
							"/sign-up/email",
							"/sign-in/email",
							"/request-password-reset",
						],
					}),
				]
			: []),
		anonymous({
			emailDomainName: "anon.color-memory.local",
			// The anonymous player's games move to the account they sign in to.
			onLinkAccount: async ({ anonymousUser, newUser }) => {
				await moveGames(anonymousUser.user.id, newUser.user.id);
			},
		}),
		emailOTP({
			otpLength: 6,
			expiresIn: 60 * 10,
			allowedAttempts: 5,
			sendVerificationOTP: async ({ email, otp }) => {
				sendInBackground(
					sendEmail({
						to: email,
						subject: m.email_code_subject(),
						lines: [m.email_code_line1()],
						code: otp,
					}),
				);
			},
		}),
		// Must be last: sets cookies on TanStack Start responses.
		tanstackStartCookies(),
	],
});

export type Session = typeof auth.$Infer.Session;
