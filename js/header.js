const TO_HU = {
  "index.html": "index.html",
  "portfolio.html": "portfolio.html",
  "preise.html": "arak.html",
  "termin.html": "foglalas.html",
  "kontakt.html": "kapcsolat.html",
  "galeria-login.html": "galeria-login.html",
  "galeria.html": "galeria.html",
  "newsletter-bestaetigen.html": "hirlevel-megerosites.html",
  "newsletter-abmelden.html": "hirlevel-leiratkozas.html",
  "datenschutz.html": "privacy.html",
  "agb.html": "aszf.html",
  "impressum.html": "impresszum.html"
};

const TO_DE = {
  "index.html": "index.html",
  "portfolio.html": "portfolio.html",
  "arak.html": "preise.html",
  "foglalas.html": "termin.html",
  "kapcsolat.html": "kontakt.html",
  "galeria-login.html": "galeria-login.html",
  "galeria.html": "galeria.html",
  "hirlevel-megerosites.html": "newsletter-bestaetigen.html",
  "hirlevel-leiratkozas.html": "newsletter-abmelden.html",
  "privacy.html": "datenschutz.html",
  "aszf.html": "agb.html",
  "impresszum.html": "impressum.html"
};

function getRouteInfo() {
  const parts = location.pathname.split("/").filter(Boolean);

  if (parts[0] === "hu") {
    return { lang: "hu", page: parts[1] || "index.html" };
  }

  if (parts[0] === "de") {
    return { lang: "de", page: parts[1] || "index.html" };
  }

  return { lang: "de", page: parts[0] || "index.html" };
}

function switchLanguage(targetLang) {
  const { lang, page } = getRouteInfo();
  if (targetLang === lang) return;

  const targetPage = targetLang === "hu" ? (TO_HU[page] || "index.html") : (TO_DE[page] || "index.html");
  location.href = `/${targetLang}/${targetPage}`;
}

function initLangSwitch() {
  const buttons = document.querySelectorAll(".lang-switch button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => switchLanguage(button.dataset.lang));
  });
}

function initActiveNavigation() {
  const { page } = getRouteInfo();
  const links = document.querySelectorAll(".main-nav a, .mobile-menu-nav a");

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const targetPage = href.split("/").pop() || "index.html";
    if (targetPage === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initStickyHeader() {
  const header = document.querySelector(".site-header");
  if (!header || header.dataset.scrollBound) return;

  header.dataset.scrollBound = "true";

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initHamburger() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobileMenu");
  const backdrop = document.getElementById("mobileMenuBackdrop");
  const close = document.querySelector(".mobile-menu-close");

  if (!toggle || !menu || toggle.dataset.bound) return;
  toggle.dataset.bound = "true";

  const openMenu = () => {
    toggle.classList.add("active");
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    backdrop?.classList.add("open");
    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    backdrop?.classList.remove("open");
    document.body.classList.remove("menu-open");
  };

  toggle.addEventListener("click", () => {
    if (menu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  close?.addEventListener("click", closeMenu);
  backdrop?.addEventListener("click", closeMenu);
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
  });

  closeMenu();
}

function initResponsiveHeaderState() {
  const mainNav = document.querySelector(".main-nav");
  const desktopCta = document.querySelector(".header-actions .nav-cta");
  const desktopLang = document.querySelector(".header-actions .lang-switch");
  const menuToggle = document.querySelector(".menu-toggle");

  if (!mainNav || !menuToggle) return;

  const applyState = () => {
    const isMobile = window.innerWidth <= 1100;

    mainNav.style.display = isMobile ? "none" : "flex";
    if (desktopCta) desktopCta.style.display = isMobile ? "none" : "inline-flex";
    if (desktopLang) desktopLang.style.display = isMobile ? "none" : "inline-flex";
    menuToggle.style.display = isMobile ? "inline-flex" : "none";
  };

  applyState();
  window.addEventListener("resize", applyState, { passive: true });
}

function buildHeaderMarkup(lang = "de") {
  const isHu = lang === "hu";
  const home = isHu ? "/hu/index.html" : "/de/index.html";
  const portfolio = isHu ? "/hu/portfolio.html" : "/de/portfolio.html";
  const prices = isHu ? "/hu/arak.html" : "/de/preise.html";
  const booking = isHu ? "/hu/foglalas.html" : "/de/termin.html";
  const contact = isHu ? "/hu/kapcsolat.html" : "/de/kontakt.html";
  const gallery = isHu ? "/hu/galeria-login.html" : "/de/galeria-login.html";

  return `
<header class="site-header">
  <div class="header-inner">
    <div class="logo">
      <a href="${home}" aria-label="B. Photography ${isHu ? "kezdőlap" : "Startseite"}">
        <span class="logo-main">B.</span>
        <span class="logo-sub">PHOTOGRAPHY</span>
      </a>
    </div>

    <nav class="main-nav" aria-label="${isHu ? "Fő navigáció" : "Hauptnavigation"}">
      <a href="${home}">${isHu ? "Kezdőlap" : "Startseite"}</a>
      <a href="${portfolio}">${isHu ? "Portfólió" : "Portfolio"}</a>
      <a href="${prices}">${isHu ? "Árak" : "Preise"}</a>
      <a href="${contact}">${isHu ? "Kapcsolat" : "Kontakt"}</a>
      <a href="${gallery}">${isHu ? "Online galéria" : "Online Galerie"}</a>
    </nav>

    <div class="header-actions">
      <div class="lang-switch" aria-label="${isHu ? "Nyelvváltás" : "Sprachwechsel"}">
        <button type="button" data-lang="hu" class="${isHu ? "active" : ""}">HU</button>
        <span aria-hidden="true">|</span>
        <button type="button" data-lang="de" class="${isHu ? "" : "active"}">DE</button>
      </div>

      <a class="nav-cta" href="${booking}">${isHu ? "Időpontot kérek" : "Termin anfragen"}</a>

      <button class="menu-toggle" type="button" aria-label="${isHu ? "Menü megnyitása" : "Menü öffnen"}" aria-controls="mobileMenu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-menu-backdrop" id="mobileMenuBackdrop"></div>

<aside class="mobile-menu" id="mobileMenu" aria-hidden="true">
  <div class="mobile-menu-panel">
    <div class="mobile-menu-top">
      <div class="mobile-menu-brand">
        <span class="logo-main">B.</span>
        <span class="logo-sub">PHOTOGRAPHY</span>
      </div>
      <button class="mobile-menu-close" type="button" aria-label="${isHu ? "Menü bezárása" : "Menü schließen"}">×</button>
    </div>

    <div class="lang-switch mobile-lang-switch" aria-label="${isHu ? "Nyelvváltás" : "Sprachwechsel"}">
      <button type="button" data-lang="hu" class="${isHu ? "active" : ""}">HU</button>
      <span aria-hidden="true">|</span>
      <button type="button" data-lang="de" class="${isHu ? "" : "active"}">DE</button>
    </div>

    <nav class="mobile-menu-nav" aria-label="${isHu ? "Mobil navigáció" : "Mobile Navigation"}">
      <a href="${home}">${isHu ? "Kezdőlap" : "Startseite"}</a>
      <a href="${portfolio}">${isHu ? "Portfólió" : "Portfolio"}</a>
      <a href="${prices}">${isHu ? "Árak" : "Preise"}</a>
      <a href="${booking}">${isHu ? "Foglalás" : "Termin"}</a>
      <a href="${contact}">${isHu ? "Kapcsolat" : "Kontakt"}</a>
      <a href="${gallery}">${isHu ? "Online galéria" : "Online Galerie"}</a>
    </nav>

    <a class="nav-cta mobile-menu-cta" href="${booking}">${isHu ? "Időpontot kérek" : "Termin anfragen"}</a>

    <div class="mobile-menu-meta">
      <span>${isHu ? "24 órán belüli válasz" : "Antwort innerhalb von 24h"}</span>
      <span>${isHu ? "Bécs és környéke" : "Wien und Umgebung"}</span>
      <span>${isHu ? "Online galéria" : "Online-Galerie"}</span>
    </div>
  </div>
</aside>
`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("site-header");
  if (!target) return;

  const { lang } = getRouteInfo();
  const partialPath = lang === "hu" ? "/partials/header-hu.html" : "/partials/header-de.html";
  const applyHeaderMarkup = (html) => {
    target.innerHTML = html;
    initResponsiveHeaderState();
    initLangSwitch();
    initActiveNavigation();
    initStickyHeader();
    initHamburger();
  };

  try {
    const response = await fetch(partialPath);
    if (!response.ok) {
      throw new Error(`Header partial request failed: ${response.status}`);
    }

    const html = await response.text();
    if (!html.includes("menu-toggle") || !html.includes("mobileMenu")) {
      throw new Error("Header partial incomplete");
    }

    applyHeaderMarkup(html);
  } catch (error) {
    console.error("Header bootstrap failed:", error);
    applyHeaderMarkup(buildHeaderMarkup(lang));
  }
});
