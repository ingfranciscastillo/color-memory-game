/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Public site URL, without a trailing slash, e.g. https://colormemory.app */
	readonly VITE_SITE_URL?: string;
	/** Cloudflare Turnstile site key; no captcha without it. */
	readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
