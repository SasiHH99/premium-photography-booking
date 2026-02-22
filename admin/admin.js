document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabaseClient;

  /* =========================
     AUTH CHECK
  ========================= */

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;

  /* =========================
     ROLE CHECK
  ========================= */

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  /* =========================
     ELEMENTS
  ========================= */

  const table = document.getElementById("bookingTable");

  /* =========================
     LOAD BOOKINGS
  ========================= */

  async function loadBookings() {

    const { data, error } = await supabase
      .from("bookings_v2")
      .select("*")
      .order("booking_date", { ascending: true });

    if (error) {
      console.error("Load error:", error);
      return;
    }

    table.innerHTML = "";

    data.forEach(booking => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${booking.name}</td>
        <td>${booking.email}</td>
        <td>${booking.booking_date}</td>
        <td>${booking.package || "-"}</td>
        <td>
          <span class="status ${booking.status}">
            ${booking.status}
          </span>
        </td>
        <td>
          <button class="btn btn-confirm">Confirm</button>
          <button class="btn btn-cancel">Cancel</button>
        </td>
      `;

      const confirmBtn = tr.querySelector(".btn-confirm");
      const cancelBtn = tr.querySelector(".btn-cancel");

      confirmBtn.addEventListener("click", async () => {
        await updateStatus(booking.id, "confirmed");
      });

      cancelBtn.addEventListener("click", async () => {
        await updateStatus(booking.id, "cancelled");
      });

      table.appendChild(tr);
    });
  }

  /* =========================
     UPDATE STATUS
  ========================= */

  async function updateStatus(id, newStatus) {

    const { error } = await supabase
      .from("bookings_v2")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return;
    }

    loadBookings();
  }

  loadBookings();
});
/* =========================
   REALTIME LISTENER
========================= */

supabase
  .channel('bookings-realtime')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookings_v2'
    },
    (payload) => {

      if (payload.eventType === "INSERT") {

        addNewRow(payload.new);

      } else {
        loadBookings();
      }

    }
  )
  .subscribe();


function addNewRow(booking) {

  const tr = document.createElement("tr");
  tr.classList.add("new-row");

  tr.innerHTML = `
    <td>${booking.name}</td>
    <td>${booking.email}</td>
    <td>${booking.booking_date}</td>
    <td>${booking.package || "-"}</td>
    <td>
      <span class="status ${booking.status}">
        ${booking.status}
      </span>
    </td>
    <td>
      <button class="btn btn-confirm">Confirm</button>
      <button class="btn btn-cancel">Cancel</button>
    </td>
  `;

  const confirmBtn = tr.querySelector(".btn-confirm");
  const cancelBtn = tr.querySelector(".btn-cancel");

  confirmBtn.addEventListener("click", async () => {
    await updateStatus(booking.id, "confirmed");
  });

  cancelBtn.addEventListener("click", async () => {
    await updateStatus(booking.id, "cancelled");
  });

  table.prepend(tr);

}
function animateCounter(element, target) {

  let start = 0;
  const duration = 600;
  const increment = target / (duration / 16);

  const counter = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(counter);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

function updateStats(bookings) {

  const total = bookings.length;
  const pending = bookings.filter(b => b.status === "pending").length;
  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;

  animateCounter(document.getElementById("statTotal"), total);
  animateCounter(document.getElementById("statPending"), pending);
  animateCounter(document.getElementById("statConfirmed"), confirmed);
  animateCounter(document.getElementById("statCancelled"), cancelled);
}