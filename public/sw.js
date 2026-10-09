/**
 * Color Memory service worker.
 *
 * - Hashed build files (/assets/*): cache first. A file's name changes with
 *   its content, so a cached copy is never stale. Old ones are kept (up to a
 *   limit) so a tab left open across a deploy can still load its chunks.
 * - Pages: network first, so a new deploy shows up at once; offline, the
 *   last copy of that page, or offline.html.
 * - /api and server functions: network only. The game is scored on the
 *   server, so nothing about a game is ever cached.
 * - Icons, images, the favicon: stale-while-revalidate.
 *
 * A new version activates right away but never reloads the page: open tabs
 * keep running the code they loaded, and pick up the new one on their next
 * navigation. No mid-game reloads.
 */

const VERSION = "v1";
const SHELL = `cm-shell-${VERSION}`;
const ASSETS = "cm-assets";
const PAGES = "cm-pages";
const MEDIA = "cm-media";
const OFFLINE_URL = "/offline.html";
const MAX_ASSETS = 150;
const MAX_PAGES = 30;

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(SHELL)
			.then((cache) =>
				cache.addAll([OFFLINE_URL, "/favicon.svg", "/icons/icon-192.png"]),
			)
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith("cm-shell-") && key !== SHELL)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

/** Drops the oldest entries beyond `max` (insertion order). */
async function trim(cacheName, max) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	await Promise.all(
		keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)),
	);
}

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(ASSETS);
		await cache.put(request, response.clone());
		trim(ASSETS, MAX_ASSETS);
	}
	return response;
}

async function networkFirstPage(request) {
	try {
		const response = await fetch(request);
		// Only full, successful pages: never a redirect or an error page.
		if (response.ok && response.type === "basic" && !response.redirected) {
			const cache = await caches.open(PAGES);
			await cache.put(request, response.clone());
			trim(PAGES, MAX_PAGES);
		}
		return response;
	} catch {
		return (
			(await caches.match(request, { ignoreSearch: true })) ||
			(await caches.match(OFFLINE_URL))
		);
	}
}

async function staleWhileRevalidate(request) {
	const cache = await caches.open(MEDIA);
	const cached = await cache.match(request);
	const fresh = fetch(request)
		.then((response) => {
			if (response.ok) cache.put(request, response.clone());
			return response;
		})
		.catch(() => cached);
	return cached || fresh;
}

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Accounts, games and stats always come from the network.
	if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) {
		return;
	}
	if (url.pathname.startsWith("/assets/")) {
		event.respondWith(cacheFirst(request));
		return;
	}
	if (request.mode === "navigate") {
		event.respondWith(networkFirstPage(request));
		return;
	}
	if (/\.(png|svg|webp|jpg|woff2?)$/.test(url.pathname)) {
		event.respondWith(staleWhileRevalidate(request));
	}
});
