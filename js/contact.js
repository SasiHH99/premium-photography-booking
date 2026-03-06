document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     LANGUAGE DETECT
  ========================= */

  const lang = location.pathname.startsWith("/de") ? "de" : "hu";

  const TEXT = {
    hu: {
      sendingTitle: "KÜLDÉS FOLYAMATBAN",
      sendingText: "Üzenet küldése…",
      successTitle: "ÜZENET ELKÜLDVE",
      successText: "Köszönöm az üzenetet,<br>hamarosan válaszolok.",
      errorTitle: "HIBA",
      errorText: "Hiba történt az üzenet küldésekor.<br>Kérlek próbáld újra."
    },
    de: {
      sendingTitle: "SENDEN LÄUFT",
      sendingText: "Nachricht wird gesendet…",
      successTitle: "NACHRICHT GESENDET",
      successText: "Vielen Dank für Ihre Nachricht,<br>ich melde mich bald.",
      errorTitle: "FEHLER",
      errorText: "Beim Senden der Nachricht ist ein Fehler aufgetreten.<br>Bitte versuchen Sie es erneut."
    }
  };

  const t = TEXT[lang];

  /* =========================
     ELEMENTS
  ========================= */

  const form = document.getElementById("contactForm");
  if (!form) return;

  const ctaBtn = form.querySelector(".cta-btn");

  const successBox   = document.getElementById("contactSuccess");
  const successIcon  = successBox.querySelector(".success-icon");
  const successTitle = successBox.querySelector(".thank-you-title");
  const successText  = successBox.querySelector(".thank-you-text");

  const closeBtn = document.getElementById("contactSuccessClose");
  const retryBtn = document.getElementById("contactRetry");

  let isSubmitting = false;

  /* =========================
     HELPERS
  ========================= */

  function resetOverlay() {
    successBox.classList.remove("error");
    successIcon.textContent = "✓";
    successTitle.textContent = "";
    successText.textContent = "";
    retryBtn.style.display = "none";
  }

  function showOverlay() {
    successBox.classList.add("show");
  }

  function hideOverlay() {
    successBox.classList.remove("show");
  }

  /* =========================
     SUBMIT
  ========================= */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    ctaBtn.disabled = true;

    resetOverlay();
    successIcon.textContent = "⏳";
    successTitle.textContent = t.sendingTitle;
    successText.textContent = t.sendingText;
    showOverlay();

    const params = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
      lang: lang // 👈 később jól jön template-ben
    };

    try {
      /* ===== EMAIL NEKED ===== */
      await emailjs.send(
        "service_8twrxd5",
        "template_agwc588", // később: HU / DE külön
        params
      );

      /* ===== AUTO-REPLY USER ===== */
      await emailjs.send(
        "service_8twrxd5",
        "template_17dftfo", // később: HU / DE külön
        params
      );

      /* ===== SUCCESS ===== */
      successIcon.textContent = "✓";
      successTitle.textContent = t.successTitle;
      successText.innerHTML = t.successText;

      form.reset();

      
/* 🔥 AUTO CLOSE – 3 SEC */
setTimeout(() => {
  successBox.classList.remove("show");
}, 3000);

    } catch (err) {
      console.error("EMAILJS ERROR:", err);

      successBox.classList.add("error");
      successIcon.textContent = "✕";
      successTitle.textContent = t.errorTitle;
      successText.innerHTML = t.errorText;

      retryBtn.style.display = "inline-block";
    }

    isSubmitting = false;
    ctaBtn.disabled = false;
  });

  /* =========================
     BUTTONS
  ========================= */

  closeBtn.addEventListener("click", hideOverlay);

  retryBtn.addEventListener("click", () => {
    hideOverlay();
    form.querySelector("input[name='name']").focus();
  });

});
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a && a.href && a.href.startsWith("mailto:")) {
    return; // 🔥 HAGYD BÉKÉN
  }
});
/* =========================
   SAFE LINK POLICY
   mailto / tel / external
========================= */
document.addEventListener(
  "click",
  (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    /* 🔥 SAFE PROTOCOLS */
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      // hagyjuk a böngészőnek – user gesture megmarad
      return;
    }

    /* 🔥 EXTERNAL LINKS */
    if (
      href.startsWith("http://") ||
      href.startsWith("https://")
    ) {
      // ne blokkoljuk külső linket sem
      return;
    }

    // minden más marad a meglévő JS logikán
  },
  true // ⚠️ capture phase – ez a kulcs
);
