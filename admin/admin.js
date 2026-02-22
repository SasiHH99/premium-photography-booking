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
        await openGalleryModal(booking.email);
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

  async function openGalleryModal(email) {

    const response = await fetch("/.netlify/functions/getUserByEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (result.error) {
      alert("User nem létezik!");
      return;
    }

    currentUserId = result.id;

    modal.classList.remove("hidden");

    loadGalleryImages();
  }

  /* =========================
     LOAD IMAGES
  ========================= */

  async function loadGalleryImages() {

    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("user_id", currentUserId);

    imageList.innerHTML = "";

    data.forEach(img => {

      const { data: publicData } = supabase
        .storage
        .from("client-galleries")
        .getPublicUrl(img.image_path);

      const div = document.createElement("div");

      div.innerHTML = `
        <img src="${publicData.publicUrl}" width="120" />
      `;

      imageList.appendChild(div);
    });
  }

  /* =========================
     UPLOAD
  ========================= */

  uploadBtn.addEventListener("click", async () => {

    const files = fileInput.files;

    if (!files.length) return;

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