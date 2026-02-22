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
     ADMIN LOGIC
  ========================= */

  const table = document.getElementById("bookingTable");

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
        <td>${booking.package}</td>
        <td>
          <span class="status ${booking.status}">
            ${booking.status}
          </span>
        </td>
        <td>
          <button class="btn btn-confirm">Confirm</button>
          <button class="btn btn-cancel">Cancel</button>
          <button class="btn btn-gallery">Galéria</button>
        </td>
      `;

      const confirmBtn = tr.querySelector(".btn-confirm");
      const cancelBtn = tr.querySelector(".btn-cancel");
      const galleryBtn = tr.querySelector(".btn-gallery");

      confirmBtn.addEventListener("click", async () => {
        await updateStatus(booking.id, "confirmed");
      });

      cancelBtn.addEventListener("click", async () => {
        await updateStatus(booking.id, "cancelled");
      });

      galleryBtn.addEventListener("click", async () => {

        if (!confirm("Biztosan létrehozod a galéria hozzáférést?")) return;

        const response = await fetch("/.netlify/functions/createGalleryUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: booking.email })
        });

        const result = await response.json();

        if (result.error) {
          alert(result.error);
          return;
        }

        alert("Galéria hozzáférés létrehozva és email elküldve!");
      });

      table.appendChild(tr);
    });
  }

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