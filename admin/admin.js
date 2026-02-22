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
  const modal = document.getElementById("galleryModal");
  const closeModalBtn = document.getElementById("closeGalleryModal");
  const uploadBtn = document.getElementById("uploadGalleryBtn");
  const fileInput = document.getElementById("galleryFileInput");
  const imageList = document.getElementById("galleryImageList");

  let currentUserId = null;

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

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
        await openGalleryModal(booking);
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

  /* =========================
     OPEN MODAL
  ========================= */

async function openGalleryModal(booking) {

  // Ha még nincs gallery user → létrehozzuk
  if (!booking.gallery_user_id) {

    const response = await fetch("/.netlify/functions/createGalleryUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: booking.email,
        bookingId: booking.id
      })
    });

    const result = await response.json();

    if (result.error) {
      alert(result.error);
      return;
    }

    // ⚠️ FONTOS: kérjük le újra a bookingot friss adatokkal
    const { data: updatedBooking } = await supabase
      .from("bookings_v2")
      .select("gallery_user_id")
      .eq("id", booking.id)
      .single();

    if (!updatedBooking?.gallery_user_id) {
      alert("Nem sikerült lekérni a gallery user ID-t");
      return;
    }

    currentUserId = updatedBooking.gallery_user_id;

    modal.classList.remove("hidden");

    loadGalleryImages();
    return;
  }

  currentUserId = booking.gallery_user_id;

  modal.classList.remove("hidden");

  loadGalleryImages();
}
async function loadGalleryImages() {

  if (!currentUserId) {
    console.log("Nincs currentUserId");
    return;
  }

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("user_id", currentUserId);

  if (error) {
    console.error("Gallery load error:", error);
    return;
  }

  imageList.innerHTML = "";

  if (!data || data.length === 0) {
    imageList.innerHTML = "<p>Nincs feltöltött kép</p>";
    return;
  }

  data.forEach(image => {
    // render
  });
}
  /* =========================
     LOAD IMAGES
  ========================= */

  async function loadGalleryImages() {

    if (!currentUserId) {
      console.log("Nincs currentUserId");
      return;
    }

    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Gallery load error:", error);
      return;
    }

    imageList.innerHTML = "";

    if (!data || data.length === 0) {
      imageList.innerHTML = "<p>Nincs feltöltött kép</p>";
      return;
    }

    data.forEach(image => {

      const { data: publicUrl } = supabase
        .storage
        .from("client-galleries")
        .getPublicUrl(image.image_path);

      const img = document.createElement("img");
      img.src = publicUrl.publicUrl;
      img.classList.add("gallery-thumb");

      imageList.appendChild(img);
    });
  }

  /* =========================
     UPLOAD
  ========================= */

  uploadBtn.addEventListener("click", async () => {

    const files = fileInput.files;

    if (!files.length || !currentUserId) return;

    for (let file of files) {

      const filePath = `${currentUserId}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from("client-galleries")
        .upload(filePath, file);

      if (error) {
        console.error(error);
        continue;
      }

      await supabase.from("gallery_images").insert({
        user_id: currentUserId,
        image_path: filePath
      });
    }

    fileInput.value = "";
    loadGalleryImages();
  });

  loadBookings();
});