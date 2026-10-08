import { useCallback, useEffect, useRef } from "react";
import { getLocale } from "@/paraglide/runtime.js";

/**
 * Cloudflare Turnstile: checks that whoever asks for an email is a person,
 * with no puzzle in almost every case ("interaction-only" only shows when
 * Cloudflare is unsure). Without VITE_TURNSTILE_SITE_KEY (development) it
 * does nothing; the server doesn't require it without TURNSTILE_SECRET_KEY.
 */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_URL =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_TIMEOUT_MS = 15_000;

/** Thrown by getHeaders() when no token arrives; the dialog shows its message. */
export class CaptchaError extends Error {}

interface TurnstileApi {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			appearance: "always" | "execute" | "interaction-only";
			theme: "light" | "dark" | "auto";
			language: string;
			callback: (token: string) => void;
			"expired-callback": () => void;
			"error-callback": () => void;
		},
	) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
	scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
		if (window.turnstile) return resolve(window.turnstile);
		const script = document.createElement("script");
		script.src = SCRIPT_URL;
		script.async = true;
		script.onload = () =>
			window.turnstile ? resolve(window.turnstile) : reject();
		script.onerror = () => {
			scriptPromise = null; // Retry next time.
			reject(new Error("turnstile"));
		};
		document.head.append(script);
	});
	return scriptPromise;
}

/**
 * Mounts the widget in `containerRef` while `active` is true. `getHeaders()`
 * waits for a token, spends it (each token works once) and asks for another
 * for the next request. Returns the headers for the Better Auth client.
 */
export function useTurnstile(active: boolean) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<string | null>(null);
	const tokenRef = useRef<string | null>(null);
	const waitersRef = useRef<((token: string | null) => void)[]>([]);

	useEffect(() => {
		if (!SITE_KEY || !active) return;
		let cancelled = false;
		const settle = (token: string | null) => {
			tokenRef.current = token;
			if (!token) return;
			for (const resolve of waitersRef.current.splice(0)) resolve(token);
		};
		const failAll = () => {
			for (const resolve of waitersRef.current.splice(0)) resolve(null);
		};
		loadScript()
			.then((turnstile) => {
				if (cancelled || !containerRef.current) return;
				widgetRef.current = turnstile.render(containerRef.current, {
					sitekey: SITE_KEY,
					appearance: "interaction-only",
					theme: document.documentElement.classList.contains("dark")
						? "dark"
						: "light",
					language: getLocale(),
					callback: settle,
					"expired-callback": () => settle(null),
					"error-callback": () => {
						settle(null);
						failAll();
					},
				});
			})
			.catch(failAll);
		return () => {
			cancelled = true;
			if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
			widgetRef.current = null;
			tokenRef.current = null;
		};
	}, [active]);

	const getHeaders = useCallback(async (): Promise<
		{ headers: Record<string, string> } | undefined
	> => {
		if (!SITE_KEY) return undefined;
		const token =
			tokenRef.current ??
			(await new Promise<string | null>((resolve) => {
				waitersRef.current.push(resolve);
				setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS);
			}));
		if (!token) throw new CaptchaError();
		// The token is spent: the widget prepares another in the background.
		tokenRef.current = null;
		if (widgetRef.current) window.turnstile?.reset(widgetRef.current);
		return { headers: { "x-captcha-response": token } };
	}, []);

	return { containerRef, getHeaders };
}
