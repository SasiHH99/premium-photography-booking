const CONTACT_TEXT = {
  hu: {
    sending: "Küldés folyamatban...",
    successTitle: "Üzenet elküldve",
    successText: "Köszönöm az üzenetet. Hamarosan válaszolok.",
    successNote: "Ha a fotózás iránya már tiszta, innen rögtön tovább tudsz menni a foglalás vagy a portfólió felé.",
    errorTitle: "Küldés sikertelen",
    errorText: "Valami hiba történt az üzenet küldése közben. Próbáld meg újra kicsit később.",
    errorNote: "Ha sürgős, próbáld meg később újra, vagy írj közvetlenül emailben.",
    close: "Bezár",
    invalid: "Kérlek tölts ki minden mezőt érvényes adatokkal."
  },
  de: {
    sending: "Nachricht wird gesendet...",
    successTitle: "Nachricht gesendet",
    successText: "Danke für deine Nachricht. Ich melde mich bald zurück.",
    successNote: "Wenn dein Ziel schon klar ist, kannst du direkt mit Termin oder Portfolio weitermachen.",
    errorTitle: "Senden fehlgeschlagen",
    errorText: "Beim Versenden ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
    errorNote: "Wenn es dringend ist, versuche es später erneut oder schreibe direkt per E-Mail.",
    close: "Schließen",
    invalid: "Bitte alle Felder korrekt ausfüllen."
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const tracking = window.BPhotographyTracking;
  const lang = form.dataset.lang === "de" ? "de" : "hu";
  const copy = CONTACT_TEXT[lang];
  const submitButton = document.getElementById("contactSubmit");
  const status = document.getElementById("contactStatus");
  const overlay = document.getElementById("contactSuccess");
  const overlayTitle = document.getElementById("contactSuccessTitle");
  const overlayText = document.getElementById("contactSuccessText");
  const overlayNote = document.getElementById("contactSuccessNote");
  const overlayActions = document.getElementById("contactSuccessActions");
  const overlayButton = document.getElementById("contactSuccessClose");

  let isSubmitting = false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("source") === "chatbot" && !form.message.value.trim()) {
    form.message.value = lang === "hu"
      ? "A chatbotból érkeztem, és lenne egy további kérdésem a fotózással kapcsolatban."
      : "Ich komme aus dem Chatbot und habe noch eine weitere Frage zum Shooting.";
  }

  function showOverlay(kind) {
    const isError = kind === "error";
    overlay.classList.toggle("error", isError);
    overlayTitle.textContent = isError ? copy.errorTitle : copy.successTitle;
    overlayText.textContent = isError ? copy.errorText : copy.successText;
    if (overlayNote) {
      overlayNote.textContent = isError ? copy.errorNote : copy.successNote;
    }
    if (overlayActions) {
      overlayActions.classList.toggle("hidden", isError);
    }
    overlayButton.textContent = copy.close;
    overlay.classList.add("show");
  }

  function hideOverlay() {
    overlay.classList.remove("show");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      lang
    };

    if (!payload.name || !payload.email || !payload.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      status.textContent = copy.invalid;
      status.classList.add("is-error");
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    status.textContent = copy.sending;
    status.classList.remove("is-error");

    try {
      const response = await fetch("/.netlify/functions/send-contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error || "Request failed");
      }

      form.reset();
      status.textContent = "";
      tracking?.trackLeadWithConversion?.("contact_request", "contact", {
        language: lang,
        value: 1
      });
      showOverlay("success");
    } catch (error) {
      console.error("Contact form error:", error);
      status.textContent = copy.errorText;
      status.classList.add("is-error");
      showOverlay("error");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
    }
  });

  overlayButton.addEventListener("click", hideOverlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hideOverlay();
  });
});

