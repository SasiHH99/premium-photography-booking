document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const tracking = window.BPhotographyTracking;

  const dateInput = document.getElementById("bookingDate");
  const gdprCheck = document.getElementById("gdpr");
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

  const lang = window.location.pathname.startsWith("/hu") ? "hu" : "de";

  const TEXT = {
    hu: {
      packagePlaceholder: "A csomag kiválasztása után itt látod röviden, milyen igényhez illik a legjobban.",
      invalidDate: "Kérlek legalább két nappal későbbi dátumot válassz.",
      dateEmpty: "Még nincs kiválasztott dátum.",
      datePrefix: "Kiválasztott dátum:",
      successTitle: "Kérés elküldve",
      successText: "A foglalási kérésed beérkezett. Hamarosan jelentkezem a következő lépésekkel.",
      successNote: "Általában 24 órán belül válaszolok.",
      partialTitle: "Kérés rögzítve",
      partialText:
        "A foglalási kérésed elmentődött, de az admin értesítés nem ment át minden címre. A visszaigazolás ettől még megérkezhetett.",
      partialNote: "Ha biztosra akarsz menni, írj a kapcsolat oldalon is."
    },
    de: {
      packagePlaceholder: "Nach der Paketauswahl siehst du hier kurz, wofür es am besten passt.",
      invalidDate: "Bitte wähle ein Datum, das mindestens zwei Tage in der Zukunft liegt.",
      dateEmpty: "Noch kein Datum ausgewählt.",
      datePrefix: "Gewähltes Datum:",
      successTitle: "Anfrage gesendet",
      successText: "Deine Buchungsanfrage ist eingegangen. Ich melde mich mit den nächsten Schritten.",
      successNote: "In der Regel antworte ich innerhalb von 24 Stunden.",
      partialTitle: "Anfrage gespeichert",
      partialText:
        "Deine Buchungsanfrage wurde gespeichert, aber die Admin-Benachrichtigung konnte nicht an alle Empfänger zugestellt werden.",
      partialNote: "Wenn du sicher gehen willst, schreib zusätzlich über die Kontaktseite."
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
    }
  };

  const dateFormatter = new Intl.DateTimeFormat(lang === "hu" ? "hu-HU" : "de-DE", {
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
          note: TEXT[lang].partialNote
        }
      : {
          title: TEXT[lang].successTitle,
          text: TEXT[lang].successText,
          note: TEXT[lang].successNote
        };

    successTitle.textContent = copy.title;
    successText.textContent = copy.text;
    successNote.textContent = copy.note;
    successBox.classList.add("show");
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

      showSuccessState(hasWorkingAdminNotification ? "success" : "partial");
      form.reset();
      dateInput.min = formatIsoDate(getMinBookingDate());
      updatePackageInfo();
      updateDateDisplay();
      updateSubmitState();
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


