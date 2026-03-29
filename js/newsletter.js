const NEWSLETTER_TEXT = {
  de: {
    invalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    consent: "Bitte bestätige zuerst die Einwilligung.",
    sending: "Anmeldung wird vorbereitet...",
    success: "Fast fertig. Bitte prüfe dein Postfach und bestätige die Anmeldung.",
    alreadyConfirmed: "Diese E-Mail-Adresse ist bereits bestätigt. Du bist schon auf der Liste.",
    error: "Die Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es später erneut."
  },
  hu: {
    invalid: "Adj meg egy érvényes e-mail címet.",
    consent: "Kérlek, előbb erősítsd meg a hozzájárulást.",
    sending: "Feliratkozás előkészítése...",
    success: "Már majdnem kész. Nézd meg a postafiókodat, és erősítsd meg a feliratkozást.",
    alreadyConfirmed: "Ez az e-mail cím már meg van erősítve. Már rajta vagy a listán.",
    error: "A feliratkozást most nem sikerült elindítani. Próbáld meg kicsit később."
  },
  en: {
    invalid: "Please enter a valid email address.",
    consent: "Please confirm your consent first.",
    sending: "Preparing your signup...",
    success: "Almost done. Please check your inbox and confirm your subscription.",
    alreadyConfirmed: "This email address is already confirmed. You are already on the list.",
    error: "The signup could not be completed right now. Please try again later."
  }
};

function setNewsletterState(form, message, kind = "") {
  const status = form.querySelector("[data-newsletter-status]");
  if (!status) return;
  status.textContent = message || "";
  status.classList.remove("is-error", "is-success");
  if (kind) status.classList.add(`is-${kind}`);
}

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("[data-newsletter-form]");
  if (!forms.length) return;

  const tracking = window.BPhotographyTracking;

  forms.forEach((form) => {
    const lang = ["hu", "de", "en"].includes(form.dataset.lang) ? form.dataset.lang : "de";
    const copy = NEWSLETTER_TEXT[lang];
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitButton?.disabled) return;

      const email = String(form.email?.value || "").trim();
      const consent = form.consent?.checked === true;
      const source = form.dataset.source || "homepage";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNewsletterState(form, copy.invalid, "error");
        return;
      }

      if (!consent) {
        setNewsletterState(form, copy.consent, "error");
        return;
      }

      submitButton.disabled = true;
      setNewsletterState(form, copy.sending);

      try {
        const response = await fetch("/.netlify/functions/newsletter-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            consent,
            lang,
            source
          })
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error || "Newsletter request failed");
        }

        form.reset();
        if (body.state === "already_confirmed") {
          setNewsletterState(form, copy.alreadyConfirmed, "success");
          tracking?.trackEvent?.("newsletter_signup_already_confirmed", {
            language: lang,
            event_label: source
          });
        } else {
          setNewsletterState(form, copy.success, "success");
          tracking?.trackLeadWithConversion?.("newsletter_signup", "newsletter_signup", {
            language: lang,
            event_label: source,
            value: 1
          });
        }
      } catch (error) {
        console.error("newsletter signup failed:", error);
        setNewsletterState(form, copy.error, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  });
});
