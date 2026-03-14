document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  if (!form) return;

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

  const lang = window.location.pathname.startsWith("/hu") ? "hu" : "de";

  const TEXT = {
    hu: {
      packagePlaceholder: "A csomag kiválasztása után itt látod röviden, milyen igényhez illik a legjobban.",
      invalidDate: "Kérlek legalább két nappal későbbi dátumot válassz.",
      dateEmpty: "Még nincs kiválasztott dátum.",
      datePrefix: "Kiválasztott dátum:"
    },
    de: {
      packagePlaceholder: "Nach der Paketauswahl siehst du hier kurz, wofür es am besten passt.",
      invalidDate: "Bitte wähle ein Datum, das mindestens zwei Tage in der Zukunft liegt.",
      dateEmpty: "Noch kein Datum ausgewählt.",
      datePrefix: "Gewähltes Datum:"
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

      successBox.classList.add("show");
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

