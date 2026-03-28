const NEWSLETTER_CONFIRM_TEXT = {
  de: {
    loadingEyebrow: "Newsletter Bestätigung",
    loadingTitle: "Anmeldung wird bestätigt...",
    loadingText: "Einen kurzen Moment. Ich prüfe gerade deinen Bestätigungslink.",
    successTitle: "Anmeldung bestätigt",
    successText: "Danke. Du bekommst künftig ausgewählte Updates zu freien Terminen, neuen Serien und limitierten Möglichkeiten.",
    alreadyTitle: "Bereits bestätigt",
    alreadyText: "Diese E-Mail-Adresse ist bereits bestätigt. Es ist nichts weiter nötig.",
    invalidTitle: "Link nicht mehr gültig",
    invalidText: "Der Bestätigungslink ist ungültig oder bereits abgelaufen. Fordere die Anmeldung einfach erneut auf der Website an.",
    errorTitle: "Bestätigung fehlgeschlagen",
    errorText: "Die Bestätigung konnte gerade nicht abgeschlossen werden. Bitte versuche es später erneut oder nutze die Kontaktseite.",
    primary: "Zur Startseite",
    secondary: "Kontakt aufnehmen"
  },
  hu: {
    loadingEyebrow: "Hírlevél megerősítése",
    loadingTitle: "Feliratkozás megerősítése...",
    loadingText: "Egy pillanat. Ellenőrzöm a megerősítő linkedet.",
    successTitle: "Feliratkozás megerősítve",
    successText: "Köszönöm. Ezután válogatott értesítéseket kapsz szabad időpontokról, új sorozatokról és limitált lehetőségekről.",
    alreadyTitle: "Már megerősítve",
    alreadyText: "Ez az e-mail cím már meg van erősítve. Nincs további teendőd.",
    invalidTitle: "A link már nem érvényes",
    invalidText: "A megerősítő link érvénytelen vagy lejárt. Indíts új feliratkozást a weboldalon.",
    errorTitle: "A megerősítés nem sikerült",
    errorText: "A megerősítést most nem sikerült befejezni. Próbáld meg később, vagy írj a kapcsolat oldalon.",
    primary: "Vissza a főoldalra",
    secondary: "Kapcsolat"
  }
};

function renderConfirmationState(lang, state) {
  const copy = NEWSLETTER_CONFIRM_TEXT[lang];
  const eyebrow = document.querySelector("[data-confirm-eyebrow]");
  const status = document.querySelector("[data-confirm-status]");
  const title = document.querySelector("[data-confirm-title]");
  const text = document.querySelector("[data-confirm-text]");
  const note = document.querySelector("[data-confirm-note]");
  const primary = document.querySelector("[data-confirm-primary]");
  const secondary = document.querySelector("[data-confirm-secondary]");

  if (!eyebrow || !title || !text || !primary || !secondary || !status || !note) return;

  eyebrow.textContent = copy.loadingEyebrow;
  status.className = `newsletter-confirm-status is-${state}`;

  if (state === "success") {
    status.textContent = "✓";
    title.textContent = copy.successTitle;
    text.textContent = copy.successText;
    note.textContent = lang === "hu"
      ? "A következő fontos lépéshez bármikor visszatérhetsz az árakhoz vagy a foglaláshoz."
      : "Wenn du den nächsten Schritt machen willst, kannst du direkt zu Preisen oder zur Anfrage weitergehen.";
  } else if (state === "already") {
    status.textContent = "•";
    title.textContent = copy.alreadyTitle;
    text.textContent = copy.alreadyText;
    note.textContent = lang === "hu"
      ? "A feliratkozásod aktív maradt, ezért további teendő nincs."
      : "Deine Anmeldung ist bereits aktiv. Es ist nichts weiter nötig.";
  } else if (state === "invalid") {
    status.textContent = "!";
    title.textContent = copy.invalidTitle;
    text.textContent = copy.invalidText;
    note.textContent = lang === "hu"
      ? "A leggyorsabb megoldás, ha újra feliratkozol a főoldalon."
      : "Am schnellsten ist es, wenn du dich auf der Startseite erneut einträgst.";
  } else if (state === "error") {
    status.textContent = "!";
    title.textContent = copy.errorTitle;
    text.textContent = copy.errorText;
    note.textContent = lang === "hu"
      ? "Ha a hiba később is megmarad, használd a kapcsolat oldalt."
      : "Wenn der Fehler später weiter besteht, nutze bitte die Kontaktseite.";
  } else {
    status.textContent = "…";
    title.textContent = copy.loadingTitle;
    text.textContent = copy.loadingText;
    note.textContent = lang === "hu"
      ? "A megerősítés után csak válogatott, ritkább frissítéseket kapsz."
      : "Nach der Bestätigung bekommst du nur kuratierte, seltene Updates.";
  }

  primary.textContent = copy.primary;
  secondary.textContent = copy.secondary;
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector("[data-newsletter-confirm]");
  if (!root) return;

  const tracking = window.BPhotographyTracking;
  const lang = root.dataset.lang === "hu" ? "hu" : "de";
  renderConfirmationState(lang, "loading");

  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    renderConfirmationState(lang, "invalid");
    return;
  }

  try {
    const response = await fetch("/.netlify/functions/newsletter-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.error) {
      if (response.status === 404) {
        renderConfirmationState(lang, "invalid");
        return;
      }

      throw new Error(body.error || "Newsletter confirmation failed");
    }

    if (body.state === "already_confirmed") {
      renderConfirmationState(lang, "already");
      tracking?.trackEvent?.("newsletter_confirm_already", {
        language: lang
      });
    } else {
      renderConfirmationState(lang, "success");
      tracking?.trackLeadWithConversion?.("newsletter_confirm", "newsletter_confirm", {
        language: lang,
        value: 1
      });
    }
  } catch (error) {
    console.error("newsletter confirmation failed:", error);
    renderConfirmationState(lang, "error");
  }
});
