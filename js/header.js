const TO_HU = {
  "index.html": "index.html",
  "portfolio.html": "portfolio.html",
  "preise.html": "arak.html",
  "termin.html": "foglalas.html",
  "kontakt.html": "kapcsolat.html",
  "galeria-login.html": "galeria-login.html",
  "galeria.html": "galeria.html",
  "datenschutz.html": "privacy.html"
};

const TO_DE = {
  "index.html": "index.html",
  "portfolio.html": "portfolio.html",
  "arak.html": "preise.html",
  "foglalas.html": "termin.html",
  "kapcsolat.html": "kontakt.html",
  "galeria-login.html": "galeria-login.html",
  "galeria.html": "galeria.html",
  "privacy.html": "datenschutz.html"
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
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });
}

function initHamburger() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobileMenu");
  const close = document.querySelector(".mobile-menu-close");

  if (!toggle || !menu || toggle.dataset.bound) return;
  toggle.dataset.bound = "true";

  const openMenu = () => {
    toggle.classList.add("active");
    menu.classList.add("open");
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    toggle.classList.remove("active");
    menu.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    menu.classList.contains("open") ? closeMenu() : openMenu();
  });

  close?.addEventListener("click", closeMenu);
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
}

document.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("site-header");
  if (!target) return;

  const { lang } = getRouteInfo();
  const partialPath = lang === "hu" ? "/partials/header-hu.html" : "/partials/header-de.html";

  const html = await fetch(partialPath).then((r) => r.text());
  target.innerHTML = html;

  initLangSwitch();
  initHamburger();
});
