console.log("GLOBAL.JS BETÖLTÖTT");

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

  /* SUPABASE */
  if (!window.supabaseClient && window.supabase?.createClient) {
    window.supabaseClient = window.supabase.createClient(
      "https://hxvhsxppmdzcbklcberm.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dmhzeHBwbWR6Y2JrbGNiZXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjU4NzgsImV4cCI6MjA4NTIwMTg3OH0.uv0Z63LbBuXe3gN_lqMIpFguXxhs_upoxbNA2KNSovg"
    );
  }

  /* WHATSAPP FLOAT */
  if (!document.querySelector(".whatsapp-float")) {
    const wa = document.createElement("a");
    wa.href = "https://wa.me/4367761496331";
    wa.target = "_blank";
    wa.className = "whatsapp-float";
    wa.setAttribute("aria-label", "WhatsApp kapcsolat");

    wa.innerHTML = `
      <svg viewBox="0 0 32 32">
        <path d="M16 3C9.4 3 4 8.2 4 14.6c0 2.6.9 5 2.3 6.9L5 29l7.7-1.9c1.9 1 4.1 1.6 6.3 1.6 6.6 0 12-5.2 12-11.6S22.6 3 16 3z"/>
        <path d="M12 11c.2-.4.5-.4.8-.4h.6c.2 0 .4 0 .6.5s.8 2 .9 2.2c.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.8.2.4.9 1.6 2 2.6 1.4 1.2 2.6 1.6 3 .1.4-.2.6-.2.8-.1.2.1.9.4 1.4.7.4.3.7.4.8.6.1.2.1 1.2-.3 1.8-.4.6-1 .9-1.6.9-1.1 0-3.2-.6-5.2-2.5-2.4-2.3-3.5-4.9-3.5-6.5 0-.9.5-1.6.8-2z"/>
      </svg>
    `;

    document.body.appendChild(wa);
  }

  /* LANGUAGE SWITCH - STABIL VERZIÓ */
  setupLanguageSwitch();

});

/* =========================
   MOBILE MENU OBSERVER
========================= */
(function observeMobileMenu() {
  const observer = new MutationObserver(() => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.getElementById("mobileMenu");
    const closeBtn = document.querySelector(".mobile-menu-close");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      menu.classList.add("open");
    });

    closeBtn?.addEventListener("click", () => {
      menu.classList.remove("open");
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
      });
    });

    observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

/* =========================
   LANGUAGE SWITCH – STABLE VERSION
========================= */

document.addEventListener("click", function (e) {

  const btn = e.target.closest(".lang-switch button");
  if (!btn) return;

  e.preventDefault();

  const targetLang = btn.dataset.lang;
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split("/").pop().toLowerCase();

  const deToHuMap = {
    "termin.html": "foglalas.html",
    "kontakt.html": "kapcsolat.html",
    "preise.html": "arak.html",
    "galerie.html": "galeria.html",
    "datenschutz.html": "privacy.html"
  };

  const huToDeMap = {
    "foglalas.html": "termin.html",
    "kapcsolat.html": "kontakt.html",
    "arak.html": "preise.html",
    "galeria.html": "galerie.html",
    "privacy.html": "datenschutz.html"
  };

  let newFile = currentFile;

  if (targetLang === "hu") {
    newFile = deToHuMap[currentFile] || currentFile;
    window.location.href = `/hu/${newFile}`;
  } else {
    newFile = huToDeMap[currentFile] || currentFile;
    window.location.href = `/de/${newFile}`;
  }

});
function setupLanguageSwitch() {}
