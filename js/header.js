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
    if (window.innerWidth > 960) closeMenu();
  });

  closeMenu();
}

document.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("site-header");
  if (!target) return;

  const { lang } = getRouteInfo();
  const partialPath = lang === "hu" ? "/partials/header-hu.html" : "/partials/header-de.html";

  const html = await fetch(partialPath).then((response) => response.text());
  target.innerHTML = html;

  initLangSwitch();
  initActiveNavigation();
  initStickyHeader();
  initHamburger();
});
