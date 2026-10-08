import { waitUntil } from "@vercel/functions";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins/anonymous";
import { emailOTP } from "better-auth/plugins/email-otp";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { m } from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { sendEmail } from "@/server/email";

/**
 * Color Memory authentication.
 *
 * - Players get an anonymous user (anonymous plugin) with an httpOnly
 *   session cookie: the server identifies the player by the session, never
 *   by anything the client sends.
 * - Optional account with Discord, an email code, or email and password.
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
				before: async (user) => ({
					data: {
						...user,
						avatarSeed:
							(user as { avatarSeed?: string | null }).avatarSeed ??
							crypto.randomUUID(),
						name: user.name?.trim() || user.email.split("@")[0].slice(0, 24),
					},
				}),
			},
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			// Discord links to an account with the same email only when Discord
			// says that email is verified (the default). Not in trustedProviders:
			// Discord allows unverified emails, which would let someone take over
			// another person's account.
		},
	},
	// Vercel production and previews, plus BETTER_AUTH_URL (always trusted).
	trustedOrigins: [
		"https://*.vercel.app",
		...(process.env.VITE_SITE_URL ? [process.env.VITE_SITE_URL] : []),
	],
	rateLimit: {
		enabled: true,
		// Serverless instances don't share memory.
		storage: "database",
		customRules: {
			"/sign-in/anonymous": { window: 60, max: 10 },
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 3 },
			"/sign-in/email-otp": { window: 60, max: 5 },
			"/email-otp/send-verification-otp": { window: 60, max: 3 },
			"/request-password-reset": { window: 60, max: 3 },
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
			ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
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
		// Moving anonymous games to the account on link comes with server games.
		anonymous({ emailDomainName: "anon.color-memory.local" }),
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
