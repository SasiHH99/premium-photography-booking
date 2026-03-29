document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const tracking = window.BPhotographyTracking;

  const dateInput = document.getElementById("bookingDate");
  const gdprCheck = document.getElementById("gdpr");
  const newsletterCheck = document.getElementById("newsletterOptin");
  const submitButton = document.getElementById("bookingSubmit");
  const packageSelect = document.getElementById("packageSelect");
  const packageInfo = document.getElementById("packageInfo");
  const dateDisplay = document.getElementById("bookingDateDisplay");
  const successBox = document.getElementById("bookingSuccess");
  const errorBox = document.getElementById("bookingError");
  const successClose = document.getElementById("successClose");
  const errorClose = document.getElementById("errorClose");
  const successTitle = successBox?.querySelector(".thank-you-title");
  const successText = successBox?.querySelector(".thank-you-text");
  const successNote = successBox?.querySelector(".success-note");
  const successNextCopy = document.getElementById("bookingSuccessNextCopy");

  const path = window.location.pathname;
  const lang = path.startsWith("/hu") ? "hu" : path.startsWith("/en") ? "en" : "de";

  const TEXT = {
    hu: {
      packagePlaceholder: "A csomag kiválasztása után itt látod röviden, milyen igényhez illik a legjobban.",
      invalidDate: "Kérlek legalább két nappal későbbi dátumot válassz.",
      dateEmpty: "Még nincs kiválasztott dátum.",
      datePrefix: "Kiválasztott dátum:",
      successTitle: "Kérés elküldve",
      successText: "A foglalási kérésed beérkezett. Hamarosan jelentkezem a következő lépésekkel.",
      successNote: "Általában 24 órán belül válaszolok.",
      successNext: "Átnézheted a portfóliót, vagy írhatsz, ha még pontosítanád a részleteket.",
      partialTitle: "Kérés rögzítve",
      partialText:
        "A foglalási kérésed elmentődött, de az admin értesítés nem ment át minden címre. A visszaigazolás ettől még megérkezhetett.",
      partialNote: "Ha biztosra akarsz menni, írj a kapcsolat oldalon is.",
      partialNext: "A részleteket most is át tudod nézni, és ha kell, külön üzenetben pontosíthatod a kérést."
    },
    de: {
      packagePlaceholder: "Nach der Paketauswahl siehst du hier kurz, wofür es am besten passt.",
      invalidDate: "Bitte wähle ein Datum, das mindestens zwei Tage in der Zukunft liegt.",
      dateEmpty: "Noch kein Datum ausgewählt.",
      datePrefix: "Gewähltes Datum:",
      successTitle: "Anfrage gesendet",
      successText: "Deine Buchungsanfrage ist eingegangen. Ich melde mich mit den nächsten Schritten.",
      successNote: "In der Regel antworte ich innerhalb von 24 Stunden.",
      successNext: "Du kannst dir in der Zwischenzeit das Portfolio ansehen oder mir noch eine kurze Ergänzung schicken.",
      partialTitle: "Anfrage gespeichert",
      partialText:
        "Deine Buchungsanfrage wurde gespeichert, aber die Admin-Benachrichtigung konnte nicht an alle Empfänger zugestellt werden.",
      partialNote: "Wenn du sicher gehen willst, schreib zusätzlich über die Kontaktseite.",
      partialNext: "Die nächsten Schritte kannst du trotzdem schon vorbereiten und bei Bedarf noch kurz ergänzen."
    },
    en: {
      packagePlaceholder: "After choosing a package, you will see a short note here about what it fits best.",
      invalidDate: "Please choose a date that is at least two days in the future.",
      dateEmpty: "No date selected yet.",
      datePrefix: "Selected date:",
      successTitle: "Request sent",
      successText: "Your booking request is in. I will get back to you with the next steps shortly.",
      successNote: "I usually reply within 24 hours.",
      successNext: "You can review the portfolio in the meantime, or write if you want to add more details.",
      partialTitle: "Request saved",
      partialText:
        "Your booking request was saved, but the admin notification could not be delivered to every recipient. Your request itself is still recorded.",
      partialNote: "If you want to be safe, send a short message through the contact page as well.",
      partialNext: "You can still review the next steps now and add a short follow-up message if needed."
    }
  };

  const PACKAGE_TEXT = {
    hu: {
      Essence:
        "Rövid, lendületes fotózás egy gyors portré- vagy páros sorozathoz, ha tiszta és használható képeket szeretnél rövid idő alatt.",
      Signature:
        "A legerősebb középcsomag többféle beállításhoz, több outfithez vagy tudatosabb online megjelenéshez.",
      Prestige:
        "Hosszabb, kreatívabb fotózás márkához, kampányhoz vagy prémium megjelenéshez, amikor nagyobb súlyú anyagra van szükség.",
      Event:
        "Nem fix dobozcsomag, hanem külön ajánlat eseményre, céges jelenlétre vagy egyedi projektre.",
      Custom:
        "Ha még nem döntötted el, melyik irány a jó, írd meg a célodat, és segítek kiválasztani a megfelelő csomagot."
    },
    de: {
      Essence:
        "Kurzes, klares Shooting für eine schnelle Porträt- oder Paarserie mit sauberem Ergebnis.",
      Signature:
        "Das stärkste Gesamtpaket, wenn du mehr Variation, mehrere Looks oder vielseitig nutzbares Material willst.",
      Prestige:
        "Mehr Zeit, mehr kreative Führung und deutlich größeres Bildmaterial für Branding, Kampagne oder Premium-Auftritt.",
      Event:
        "Kein starres Paket, sondern ein individuelles Angebot für Event, Firmenanfrage oder besonderes Projekt.",
      Custom:
        "Wenn du noch unsicher bist, beschreibe einfach dein Ziel und ich helfe dir bei der passenden Wahl."
    },
    en: {
      Essence:
        "A compact, clean shoot for a short portrait or couple series when you want strong, usable images without a long production.",
      Signature:
        "The strongest balanced package if you want more variety, more than one look or material that works across multiple uses.",
      Prestige:
        "More time, stronger creative direction and more image depth for branding, campaigns or a premium visual presence.",
      Event:
        "Not a fixed box package, but a custom quote for events, business coverage or a more individual project.",
      Custom:
        "If you are not sure yet which direction fits best, describe the goal and I will help you choose the right package."
    }
  };

  const dateFormatter = new Intl.DateTimeFormat(lang === "hu" ? "hu-HU" : lang === "en" ? "en-GB" : "de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  let isSubmitting = false;

  function getMinBookingDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 2);
    return today;
  }

  function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function updateSubmitState() {
    submitButton.disabled = isSubmitting || !(dateInput.value && gdprCheck.checked);
  }

  function updatePackageInfo() {
    const selectedPackage = packageSelect.value;
    packageInfo.textContent = PACKAGE_TEXT[lang][selectedPackage] || TEXT[lang].packagePlaceholder;
  }

  function showSuccessState(kind = "success") {
    if (!successTitle || !successText || !successNote) {
      successBox.classList.add("show");
      return;
    }

    const copy = kind === "partial"
      ? {
          title: TEXT[lang].partialTitle,
          text: TEXT[lang].partialText,
          note: TEXT[lang].partialNote,
          next: TEXT[lang].partialNext
        }
      : {
          title: TEXT[lang].successTitle,
          text: TEXT[lang].successText,
          note: TEXT[lang].successNote,
          next: TEXT[lang].successNext
        };

    successTitle.textContent = copy.title;
    successText.textContent = copy.text;
    successNote.textContent = copy.note;
    if (successNextCopy) {
      successNextCopy.textContent = copy.next;
    }
    successBox.classList.add("show");
  }

  async function subscribeBookingLeadToNewsletter(email) {
    if (!newsletterCheck?.checked || !email) return "";

    try {
      const response = await fetch("/.netlify/functions/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lang,
          consent: true,
          source: "booking_form"
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.details || body.error || "newsletter subscribe failed");
      }

      if (body.state === "confirmation_sent") {
        tracking?.trackLeadWithConversion?.("newsletter_signup", "newsletter", {
          language: lang,
          placement: "booking_form"
        });
      } else if (body.state === "already_confirmed") {
        tracking?.trackEvent?.("newsletter_existing_subscriber", {
          language: lang,
          placement: "booking_form"
        });
      }

      return body.state || "";
    } catch (error) {
      console.warn("Booking newsletter opt-in failed:", error);
      tracking?.trackEvent?.("newsletter_signup_failed", {
        language: lang,
        placement: "booking_form"
      });
      return "";
    }
  }

  function redirectToThanks(kind, payload, newsletterState = "") {
    const page = lang === "hu" ? "koszonjuk-foglalas.html" : lang === "en" ? "thank-you-booking.html" : "danke-termin.html";
    const formattedDate = payload.booking_date
      ? dateFormatter.format(new Date(`${payload.booking_date}T12:00:00`))
      : "";
    const params = new URLSearchParams({
      state: kind,
      date: formattedDate,
      package: payload.package || "",
      email: payload.email || ""
    });

    if (newsletterState) {
      params.set("newsletter", newsletterState);
    }

    window.location.href = `${page}?${params.toString()}`;
  }

  function updateDateDisplay() {
    if (!dateInput.value) {
      dateDisplay.textContent = TEXT[lang].dateEmpty;
      return;
    }

    const selected = new Date(`${dateInput.value}T12:00:00`);
    if (Number.isNaN(selected.getTime())) {
      dateDisplay.textContent = TEXT[lang].dateEmpty;
      return;
    }

    dateDisplay.textContent = `${TEXT[lang].datePrefix} ${dateFormatter.format(selected)}`;
  }

  function isDateValid(value) {
    if (!value) return false;
    const selected = new Date(`${value}T12:00:00`);
    return selected >= getMinBookingDate();
  }

  const minDate = getMinBookingDate();
  dateInput.min = formatIsoDate(minDate);
  updatePackageInfo();
  updateDateDisplay();
  updateSubmitState();

  gdprCheck.addEventListener("change", updateSubmitState);
  dateInput.addEventListener("input", () => {
    updateDateDisplay();
    updateSubmitState();
  });
  packageSelect.addEventListener("change", updatePackageInfo);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!isDateValid(dateInput.value)) {
      window.alert(TEXT[lang].invalidDate);
      return;
    }

    isSubmitting = true;
    updateSubmitState();

    try {
      const payload = {
        booking_date: dateInput.value,
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        package: form.package.value,
        message: form.message.value.trim(),
        status: "pending",
        lang
      };

      const response = await fetch("/.netlify/functions/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.details || body.error || "Booking request failed");
      }

      const adminNotifications = Array.isArray(body.adminNotifications) ? body.adminNotifications : [];
      const hasWorkingAdminNotification =
        adminNotifications.length === 0 || adminNotifications.some((item) => item && item.ok);
      const newsletterState = await subscribeBookingLeadToNewsletter(payload.email);

      if (hasWorkingAdminNotification) {
        tracking?.trackLeadWithConversion?.("booking_request", "booking", {
          event_label: payload.package,
          language: lang,
          value: 1
        });
      } else {
        tracking?.trackEvent?.("booking_request_partial", {
          event_label: payload.package,
          language: lang
        });
      }
      redirectToThanks(hasWorkingAdminNotification ? "success" : "partial", payload, newsletterState);
    } catch (error) {
      console.error("Booking error:", error);
      errorBox.classList.add("show");
    } finally {
      isSubmitting = false;
      updateSubmitState();
    }
  });

  successClose.addEventListener("click", () => successBox.classList.remove("show"));
  errorClose.addEventListener("click", () => errorBox.classList.remove("show"));
});


