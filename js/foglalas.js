document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     SUPABASE INIT
  ========================= */

  if (!window.supabase) {
    console.error("Supabase CDN nincs betöltve");
    return;
  }

  const supabase = window.supabase.createClient(
    "https://hxvhsxppmdzcbklcberm.supabase.co",
    "sb_publishable_feNwyFggYsuxRqOr85cIng_h2pP4zn8"
  );

  /* =========================
     ELEMENTS
  ========================= */

  const form = document.getElementById("bookingForm");
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

  /* =========================
     CALENDAR
  ========================= */

  let current = new Date();
  current = new Date(current.getFullYear(), current.getMonth(), 1);

  function getISO(d) {
    return d.toISOString().split("T")[0];
  }

  function renderCalendar() {

    calendarGrid.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();

    monthLabel.textContent = current.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long"
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = (firstDay === 0 ? 6 : firstDay - 1);

    const today = new Date();
    today.setHours(0,0,0,0);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("calendar-empty");
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {

      const dateObj = new Date(year, month, day);
      dateObj.setHours(0,0,0,0);

      const el = document.createElement("div");
      el.className = "calendar-day";
      el.textContent = day;

      if (dateObj < minDate) {
        el.classList.add("disabled");
      } else {
        el.addEventListener("click", () => {

          document.querySelectorAll(".calendar-day.active")
            .forEach(x => x.classList.remove("active"));

          el.classList.add("active");

          selectedDate.value = getISO(dateObj);

          selectedText.textContent =
            "Kiválasztott dátum: " +
            dateObj.toLocaleDateString("hu-HU");

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

  function updateCTA() {
    ctaBtn.disabled = !(
      selectedDate.value &&
      gdprCheck.checked
    );
  }

  gdprCheck.addEventListener("change", updateCTA);

  renderCalendar();

  /* =========================
     SUBMIT
  ========================= */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {

      const bookingData = {
        booking_date: selectedDate.value,
        name: form.name.value,
        email: form.email.value,
        package: form.package.value,
        message: form.message.value,
        status: "pending",
        lang: "hu"
      };

      // 1️⃣ Mentés Supabase-be
      const { error } = await supabase
        .from("bookings_v2")
        .insert([bookingData]);

      if (error) throw error;

      // 2️⃣ Email küldés Netlify functionnel
      await fetch("/.netlify/functions/send-booking-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
      });

      // SUCCESS
      successBox.classList.add("show");
      form.reset();
      selectedText.textContent = "Nincs kiválasztott dátum";
      ctaBtn.disabled = true;

    } catch (err) {
      console.error("HIBA:", err);
      errorBox.classList.add("show");
    }
  });

  successClose.onclick = () => successBox.classList.remove("show");
  errorClose.onclick = () => errorBox.classList.remove("show");

});