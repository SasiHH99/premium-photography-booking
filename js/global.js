const SUPABASE_URL = "https://hxvhsxppmdzcbklcberm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_feNwyFggYsuxRqOr85cIng_h2pP4zn8";
const PWA_THEME_COLOR = "#0f0f12";
const GOOGLE_ADS_ID = "AW-18017270066";

function initSupabaseClient() {
  if (window.supabaseClient || !window.supabase?.createClient) return;
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function injectWhatsappButton() {
  if (window.location.pathname.startsWith("/admin")) return;
  if (document.querySelector(".whatsapp-float")) return;

  const a = document.createElement("a");
  a.href = "https://wa.me/4367761496331";
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "whatsapp-float";
  a.setAttribute("aria-label", "WhatsApp");

  a.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.2 4 14.6c0 2.6.9 5 2.3 6.9L5 29l7.7-1.9c1.9 1 4.1 1.6 6.3 1.6 6.6 0 12-5.2 12-11.6S22.6 3 16 3z"></path>
      <path d="M12 11c.2-.4.5-.4.8-.4h.6c.2 0 .4 0 .6.5s.8 2 .9 2.2c.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.8.2.4.9 1.6 2 2.6 1.4 1.2 2.6 1.6 3 .1.4-.2.6-.2.8-.1.2.1.9.4 1.4.7.4.3.7.4.8.6.1.2.1 1.2-.3 1.8-.4.6-1 .9-1.6.9-1.1 0-3.2-.6-5.2-2.5-2.4-2.3-3.5-4.9-3.5-6.5 0-.9.5-1.6.8-2z"></path>
    </svg>
  `;

  document.body.appendChild(a);
}

function ensureChatbotAssets() {
  if (window.location.pathname.startsWith("/admin")) return;

  appendHeadTag('link[href="/css/chatbot.css"]', () => {
    const el = document.createElement("link");
    el.rel = "stylesheet";
    el.href = "/css/chatbot.css";
    return el;
  });

  if (document.querySelector('script[src="/js/chatbot.js"]')) return;
  const script = document.createElement("script");
  script.src = "/js/chatbot.js";
  document.body.appendChild(script);
}

function ensureGoogleAdsTag() {
  if (window.location.pathname.startsWith("/admin")) return;
  if (document.querySelector(`script[src*="${GOOGLE_ADS_ID}"]`)) return;

  const externalScript = document.createElement("script");
  externalScript.async = true;
  externalScript.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
  document.head.appendChild(externalScript);

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = window.gtag || gtag;
  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ADS_ID);
}

function appendHeadTag(selector, createTag) {
  if (!document.head || document.head.querySelector(selector)) return;
  document.head.appendChild(createTag());
}

function ensurePwaHead() {
  appendHeadTag('link[rel="icon"][sizes="192x192"]', () => {
    const el = document.createElement("link");
    el.rel = "icon";
    el.type = "image/png";
    el.sizes = "192x192";
    el.href = "/images/pwa/icon-192.png";
    return el;
  });

  appendHeadTag('link[rel="icon"][sizes="512x512"]', () => {
    const el = document.createElement("link");
    el.rel = "icon";
    el.type = "image/png";
    el.sizes = "512x512";
    el.href = "/images/pwa/icon-512.png";
    return el;
  });

  appendHeadTag('link[rel="manifest"]', () => {
    const el = document.createElement("link");
    el.rel = "manifest";
    el.href = "/manifest.webmanifest";
    return el;
  });

  appendHeadTag('meta[name="theme-color"]', () => {
    const el = document.createElement("meta");
    el.name = "theme-color";
    el.content = PWA_THEME_COLOR;
    return el;
  });

  appendHeadTag('meta[name="mobile-web-app-capable"]', () => {
    const el = document.createElement("meta");
    el.name = "mobile-web-app-capable";
    el.content = "yes";
    return el;
  });

  appendHeadTag('meta[name="apple-mobile-web-app-capable"]', () => {
    const el = document.createElement("meta");
    el.name = "apple-mobile-web-app-capable";
    el.content = "yes";
    return el;
  });

  appendHeadTag('meta[name="apple-mobile-web-app-status-bar-style"]', () => {
    const el = document.createElement("meta");
    el.name = "apple-mobile-web-app-status-bar-style";
    el.content = "black-translucent";
    return el;
  });

  appendHeadTag('meta[name="apple-mobile-web-app-title"]', () => {
    const el = document.createElement("meta");
    el.name = "apple-mobile-web-app-title";
    el.content = "B. Photography";
    return el;
  });

  appendHeadTag('link[rel="apple-touch-icon"]', () => {
    const el = document.createElement("link");
    el.rel = "apple-touch-icon";
    el.href = "/images/pwa/apple-touch-icon.png";
    return el;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    },
    { once: true }
  );
}

ensureGoogleAdsTag();
ensurePwaHead();

document.addEventListener("DOMContentLoaded", () => {
  ensureChatbotAssets();
  registerServiceWorker();
  initSupabaseClient();
});
