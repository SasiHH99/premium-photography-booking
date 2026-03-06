function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  if (!supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;

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

  const table = document.getElementById("bookingTable");

  function setButtonsDisabled(tr, disabled) {
    tr.querySelectorAll("button").forEach((btn) => {
      btn.disabled = disabled;
      btn.style.opacity = disabled ? "0.6" : "1";
    });
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings_v2")
      .select("*")
      .order("booking_date", { ascending: true });

    if (error) {
      console.error("Load error:", error);
      alert("Nem sikerült betölteni a foglalásokat.");
      return;
    }

    table.innerHTML = "";

    data.forEach((booking) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(booking.name)}</td>
        <td>${escapeHtml(booking.email)}</td>
        <td>${escapeHtml(booking.booking_date)}</td>
        <td>${escapeHtml(booking.package)}</td>
        <td><span class="status ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span></td>
        <td>
          <button class="btn btn-confirm">Confirm</button>
          <button class="btn btn-cancel">Cancel</button>
          <button class="btn btn-gallery">Galéria</button>
        </td>
      `;

      tr.querySelector(".btn-confirm").addEventListener("click", async () => {
        setButtonsDisabled(tr, true);
        try {
          await updateStatus(booking.id, "confirmed");
        } finally {
          setButtonsDisabled(tr, false);
        }
      });

      tr.querySelector(".btn-cancel").addEventListener("click", async () => {
        setButtonsDisabled(tr, true);
        try {
          await updateStatus(booking.id, "cancelled");
        } finally {
          setButtonsDisabled(tr, false);
        }
      });

      tr.querySelector(".btn-gallery").addEventListener("click", async () => {
        if (!confirm("Biztosan létrehozod a galéria hozzáférést?")) return;

        setButtonsDisabled(tr, true);

        try {
          const { data: { session: latestSession } } = await supabase.auth.getSession();
          const accessToken = latestSession?.access_token;

          if (!accessToken) {
            alert("Nincs érvényes admin session.");
            return;
          }

          const response = await fetch("/.netlify/functions/createGalleryUser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              email: booking.email,
              lang: booking.lang || "hu"
            })
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok || result.error) {
            alert(result.error || "Hiba történt.");
            return;
          }

          alert("Galéria hozzáférés létrehozva és email elküldve.");
        } catch (err) {
          console.error("Gallery user create error:", err);
          alert("Hiba történt a galéria hozzáférés létrehozásakor.");
        } finally {
          setButtonsDisabled(tr, false);
        }
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
      alert("Nem sikerült frissíteni az állapotot.");
      return;
    }

    await loadBookings();
  }

  loadBookings();
});
