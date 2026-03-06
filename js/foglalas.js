document.addEventListener("DOMContentLoaded", () => {
  if (!window.supabase?.createClient) {
    console.error("Supabase CDN nincs betöltve");
    return;
  }

  const supabase =
    window.supabaseClient ||
    window.supabase.createClient(
      "https://hxvhsxppmdzcbklcberm.supabase.co",
      "sb_publishable_feNwyFggYsuxRqOr85cIng_h2pP4zn8"
    );

  if (!window.supabaseClient) {
    window.supabaseClient = supabase;
  }

  const form = document.getElementById("bookingForm");
  if (!form) return;

  const calendarGrid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("calendarMonth");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const selectedDate = document.getElementById("selectedDate");
  const selectedText = document.getElementById("selectedDateText");
  const gdprCheck = document.getElementById("gdpr");
  const ctaBtn = document.querySelector(".cta-btn");

  const successBox = document.getElementById("bookingSuccess");
  const errorBox = document.getElementById("bookingError");
  const successClose = document.getElementById("successClose");
  const errorClose = document.getElementById("errorClose");

  const lang = window.location.pathname.startsWith("/hu") ? "hu" : "de";

  const TEXT = {
    hu: {
      selectedPrefix: "Kiválasztott dátum: ",
      noDate: "Nincs kiválasztott dátum"
    },
    de: {
      selectedPrefix: "Ausgewähltes Datum: ",
      noDate: "Kein Datum ausgewählt"
    }
  };

  let bookedDates = [];
  let isSubmitting = false;
  let current = new Date();
  current = new Date(current.getFullYear(), current.getMonth(), 1);

  function getISO(d) {
    return d.toISOString().split("T")[0];
  }

  function setSubmitting(state) {
    isSubmitting = state;
    ctaBtn.disabled = state || !(selectedDate.value && gdprCheck.checked);
  }

  function updateCTA() {
    ctaBtn.disabled = isSubmitting || !(selectedDate.value && gdprCheck.checked);
  }

  async function loadBookedDates() {
    const { data, error } = await supabase
      .from("bookings_v2")
      .select("booking_date")
      .eq("status", "confirmed");

    if (error) {
      console.error("Nem sikerült lekérni a foglalt dátumokat:", error);
      return;
    }

    bookedDates = (data || []).map((item) => item.booking_date);
  }

  async function renderCalendar() {
    await loadBookedDates();

    calendarGrid.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();

    monthLabel.textContent = current.toLocaleDateString(
      lang === "de" ? "de-DE" : "hu-HU",
      { year: "numeric", month: "long" }
    );

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("calendar-empty");
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);

      const el = document.createElement("div");
      el.className = "calendar-day";
      el.textContent = day;

      const isoDate = getISO(dateObj);

      if (dateObj < minDate || bookedDates.includes(isoDate)) {
        el.classList.add("disabled");
      } else {
        el.addEventListener("click", () => {
          document
            .querySelectorAll(".calendar-day.active")
            .forEach((x) => x.classList.remove("active"));

          el.classList.add("active");
          selectedDate.value = isoDate;

          selectedText.textContent =
            TEXT[lang].selectedPrefix +
            dateObj.toLocaleDateString(lang === "de" ? "de-DE" : "hu-HU");

          updateCTA();
        });
      }

      calendarGrid.appendChild(el);
    }
  }

  prevBtn.onclick = () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
  };

  nextBtn.onclick = () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
  };

  gdprCheck.addEventListener("change", updateCTA);

  renderCalendar();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedDate.value) return;

    setSubmitting(true);

    try {
      const bookingData = {
        booking_date: selectedDate.value,
        name: form.name.value,
        email: form.email.value,
        package: form.package.value,
        message: form.message.value,
        status: "pending",
        lang
      };

      const { error: insertError } = await supabase
        .from("bookings_v2")
        .insert([bookingData]);

      if (insertError) throw insertError;

      // Booking mentés sikeres akkor is, ha email küldés később hibázik.
      try {
        const mailResp = await fetch("/.netlify/functions/send-booking-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData)
        });

        if (!mailResp.ok) {
          const body = await mailResp.text();
          console.warn("Foglalás email küldés hiba:", body);
        }
      } catch (mailErr) {
        console.warn("Foglalás email kérés hiba:", mailErr);
      }

      successBox.classList.add("show");

      form.reset();
      selectedDate.value = "";
      selectedText.textContent = TEXT[lang].noDate;

      await renderCalendar();
    } catch (err) {
      console.error("Foglalás hiba:", err);
      errorBox.classList.add("show");
    } finally {
      setSubmitting(false);
    }
  });

  successClose.onclick = () => successBox.classList.remove("show");
  errorClose.onclick = () => errorBox.classList.remove("show");
});
