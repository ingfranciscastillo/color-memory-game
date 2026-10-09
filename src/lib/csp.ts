/**
 * Content Security Policy for every page, built per request around the
 * router's nonce (see router.tsx).
 *
 * - Scripts: our files, inline scripts carrying the nonce (hydration data,
 *   the theme script) and Cloudflare Turnstile.
 * - Styles: 'unsafe-inline' is needed for the style attributes React
 *   renders on the server (swatch colors, fan angles). A nonce can't cover
 *   attributes, and with one present browsers would ignore 'unsafe-inline'.
 * - Images: avatars are data: URIs, the share image a blob: URL.
 *
 * Sent as Report-Only for now: violations show in the console without
 * breaking anything. Once a deploy shows none, switch the header name to
 * CSP_HEADER_ENFORCED.
 */

const TURNSTILE = "https://challenges.cloudflare.com";

export const CSP_HEADER = "Content-Security-Policy-Report-Only";
export const CSP_HEADER_ENFORCED = "Content-Security-Policy";

export function contentSecurityPolicy(nonce: string): string {
	return [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' ${TURNSTILE}`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self'",
		"connect-src 'self'",
		`frame-src ${TURNSTILE}`,
		"worker-src 'self'",
		"manifest-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");
}
