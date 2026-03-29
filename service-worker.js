const CACHE_NAME = "bphoto-static-v3";
const OFFLINE_FALLBACK = "/de/index.html";
const PRE_CACHE = [
  OFFLINE_FALLBACK,
  "/hu/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/images/pwa/icon-192.png",
  "/images/pwa/icon-512.png",
  "/images/pwa/apple-touch-icon.png",
  "/css/global.css",
  "/js/global.js",
  "/js/header.js",
  "/partials/header-de.html",
  "/partials/header-hu.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/.netlify/") || url.pathname.startsWith("/netlify/functions/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return (await caches.match(request)) || (await caches.match(OFFLINE_FALLBACK));
  }
}

async function handleAsset(request) {
  const destination = request.destination || "";
  const isDynamicAsset = ["script", "style", "document"].includes(destination);

  if (isDynamicAsset) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error("Dynamic asset request failed and no cache fallback exists.");
    }
  }

  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    if (request.destination === "image") {
      const fallbackImage = await caches.match("/images/pwa/icon-192.png");
      if (fallbackImage) return fallbackImage;
    }

    throw new Error("Request failed and no cache fallback exists.");
  }
}

