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
  },
  en: {
    loadingEyebrow: "Newsletter unsubscribe",
    loadingTitle: "Processing your unsubscribe...",
    loadingText: "One moment. I am checking your unsubscribe link.",
    successTitle: "Successfully unsubscribed",
    successText: "You will no longer receive newsletter updates from now on. If you want to join again later, you can sign up again at any time.",
    alreadyTitle: "Already unsubscribed",
    alreadyText: "This email address is already unsubscribed. Nothing else is needed.",
    invalidTitle: "Link no longer valid",
    invalidText: "The unsubscribe link is invalid or has expired. You can always use the contact page instead.",
    errorTitle: "Unsubscribe failed",
    errorText: "The unsubscribe could not be completed right now. Please try again later or use the contact page.",
    primary: "Back to home",
    secondary: "Contact"
  }
};

function renderUnsubscribeState(lang, state) {
  const copy = NEWSLETTER_UNSUBSCRIBE_TEXT[lang];
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
      ? "Később bármikor újra feliratkozhatsz, ha új időpontokat vagy friss sorozatokat szeretnél látni."
      : lang === "en"
        ? "You can join again later at any time if you want to hear about free dates or new series."
        : "Du kannst dich später jederzeit wieder eintragen, wenn du neue Termine oder Serien sehen möchtest.";
  } else if (state === "already") {
    status.textContent = "•";
    title.textContent = copy.alreadyTitle;
    text.textContent = copy.alreadyText;
    note.textContent = lang === "hu"
      ? "Az e-mail címed már nincs aktív feliratkozóként kezelve."
      : lang === "en"
        ? "Your email address is already no longer treated as an active subscription."
        : "Deine E-Mail-Adresse wird bereits nicht mehr als aktive Anmeldung geführt.";
  } else if (state === "invalid") {
    status.textContent = "!";
    title.textContent = copy.invalidTitle;
    text.textContent = copy.invalidText;
    note.textContent = lang === "hu"
      ? "Ha inkább személyesen írnál, a kapcsolat oldal ugyanúgy működik."
      : lang === "en"
        ? "If you would rather write directly, the contact page works just as well."
        : "Wenn du lieber direkt schreiben möchtest, kannst du jederzeit die Kontaktseite nutzen.";
  } else if (state === "error") {
    status.textContent = "!";
    title.textContent = copy.errorTitle;
    text.textContent = copy.errorText;
    note.textContent = lang === "hu"
      ? "Ha a hiba később is megmarad, írj a kapcsolat oldalon, és kézzel rendezzük."
      : lang === "en"
        ? "If the issue remains later, write through the contact page and I will handle it manually."
        : "Wenn der Fehler bestehen bleibt, schreib mir über die Kontaktseite, dann kümmere ich mich manuell darum.";
  } else {
    status.textContent = "…";
    title.textContent = copy.loadingTitle;
    text.textContent = copy.loadingText;
    note.textContent = lang === "hu"
      ? "A leiratkozás után nem kapsz több ilyen értesítést."
      : lang === "en"
        ? "After this, you will not receive further newsletter updates."
        : "Nach der Abmeldung bekommst du keine weiteren Newsletter-Updates.";
  }

  primary.textContent = copy.primary;
  secondary.textContent = copy.secondary;
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector("[data-newsletter-unsubscribe]");
  if (!root) return;

  const tracking = window.BPhotographyTracking;
  const lang = ["hu", "de", "en"].includes(root.dataset.lang) ? root.dataset.lang : "de";
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
      tracking?.trackEvent?.("newsletter_unsubscribe_already", {
        language: lang
      });
    } else {
      renderUnsubscribeState(lang, "success");
      tracking?.trackEvent?.("newsletter_unsubscribed", {
        language: lang
      });
    }
  } catch (error) {
    console.error("newsletter unsubscribe failed:", error);
    renderUnsubscribeState(lang, "error");
  }
});
