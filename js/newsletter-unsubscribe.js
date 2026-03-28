const NEWSLETTER_UNSUBSCRIBE_TEXT = {
  de: {
    loadingEyebrow: "Newsletter Abmeldung",
    loadingTitle: "Abmeldung wird verarbeitet...",
    loadingText: "Einen kurzen Moment. Ich prüfe gerade deinen Abmeldelink.",
    successTitle: "Erfolgreich abgemeldet",
    successText: "Du bekommst ab jetzt keine Newsletter-Updates mehr. Wenn du später wieder dabei sein möchtest, kannst du dich jederzeit neu anmelden.",
    alreadyTitle: "Bereits abgemeldet",
    alreadyText: "Diese E-Mail-Adresse ist bereits abgemeldet. Es ist nichts weiter nötig.",
    invalidTitle: "Link nicht mehr gültig",
    invalidText: "Der Abmeldelink ist ungültig oder bereits abgelaufen. Nutze sonst einfach die Kontaktseite.",
    errorTitle: "Abmeldung fehlgeschlagen",
    errorText: "Die Abmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es später erneut oder nutze die Kontaktseite.",
    primary: "Zur Startseite",
    secondary: "Kontakt aufnehmen"
  },
  hu: {
    loadingEyebrow: "Hírlevél leiratkozás",
    loadingTitle: "Leiratkozás folyamatban...",
    loadingText: "Egy pillanat. Ellenőrzöm a leiratkozó linkedet.",
    successTitle: "Sikeres leiratkozás",
    successText: "Mostantól nem küldök több hírlevél-frissítést erre az e-mail címre. Később bármikor újra fel tudsz iratkozni.",
    alreadyTitle: "Már leiratkoztál",
    alreadyText: "Ez az e-mail cím már le van iratkozva. Nincs további teendőd.",
    invalidTitle: "A link már nem érvényes",
    invalidText: "A leiratkozó link érvénytelen vagy lejárt. Ha kell, írj a kapcsolat oldalon.",
    errorTitle: "A leiratkozás nem sikerült",
    errorText: "A leiratkozást most nem sikerült befejezni. Próbáld meg később, vagy írj a kapcsolat oldalon.",
    primary: "Vissza a főoldalra",
    secondary: "Kapcsolat"
  }
};

function renderUnsubscribeState(lang, state) {
  const copy = NEWSLETTER_UNSUBSCRIBE_TEXT[lang];
  const eyebrow = document.querySelector("[data-confirm-eyebrow]");
  const title = document.querySelector("[data-confirm-title]");
  const text = document.querySelector("[data-confirm-text]");
  const primary = document.querySelector("[data-confirm-primary]");
  const secondary = document.querySelector("[data-confirm-secondary]");

  if (!eyebrow || !title || !text || !primary || !secondary) return;

  eyebrow.textContent = copy.loadingEyebrow;

  if (state === "success") {
    title.textContent = copy.successTitle;
    text.textContent = copy.successText;
  } else if (state === "already") {
    title.textContent = copy.alreadyTitle;
    text.textContent = copy.alreadyText;
  } else if (state === "invalid") {
    title.textContent = copy.invalidTitle;
    text.textContent = copy.invalidText;
  } else if (state === "error") {
    title.textContent = copy.errorTitle;
    text.textContent = copy.errorText;
  } else {
    title.textContent = copy.loadingTitle;
    text.textContent = copy.loadingText;
  }

  primary.textContent = copy.primary;
  secondary.textContent = copy.secondary;
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector("[data-newsletter-unsubscribe]");
  if (!root) return;

  const lang = root.dataset.lang === "hu" ? "hu" : "de";
  renderUnsubscribeState(lang, "loading");

  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    renderUnsubscribeState(lang, "invalid");
    return;
  }

  try {
    const response = await fetch("/.netlify/functions/newsletter-unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.error) {
      if (response.status === 404) {
        renderUnsubscribeState(lang, "invalid");
        return;
      }

      throw new Error(body.error || "Newsletter unsubscribe failed");
    }

    if (body.state === "already_unsubscribed") {
      renderUnsubscribeState(lang, "already");
    } else {
      renderUnsubscribeState(lang, "success");
    }
  } catch (error) {
    console.error("newsletter unsubscribe failed:", error);
    renderUnsubscribeState(lang, "error");
  }
});
