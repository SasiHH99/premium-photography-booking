document.addEventListener("DOMContentLoaded", () => {
  const headerTarget = document.getElementById("site-header");
  if (!headerTarget) return;

  // 🔥 ÚJ LOGIKA
  // /hu/... → magyar
  // minden más → német (root is!)
  const lang = location.pathname.startsWith("/hu/") ? "hu" : "de";

  const headerPath = lang === "de"
    ? "/partials/header-de.html"
    : "/partials/header-hu.html";

  fetch(headerPath)
    .then(res => res.text())
    .then(html => {
      headerTarget.innerHTML = html;

      initLangSwitch();
      initHamburger();
    });
});

/* =========================
   🌍 NYELVVÁLTÓ
========================= */
function initLangSwitch() {
  const buttons = document.querySelectorAll(".lang-switch button");
  if (!buttons.length) return;

  const parts = location.pathname.split("/").filter(Boolean);

  let currentLang = "de";
  let page = "index.html";

  if (parts[0] === "hu") {
    currentLang = "hu";
    page = parts[1] || "index.html";
  } else {
    page = parts[0] || "index.html";
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.lang;
      if (target === currentLang) return;

      if (target === "de") {
        location.href = `/${page}`;
      } else {
        location.href = `/hu/${page}`;
      }
    });
  });
}

/* =========================
   🍔 HAMBURGER
========================= */
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

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });

  let startY = 0;
  menu.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
  });

  menu.addEventListener("touchend", e => {
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 80) closeMenu();
  });
}