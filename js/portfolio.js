document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     BASE ELEMENTS
  ========================= */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems  = Array.from(document.querySelectorAll(".gallery-item"));
  const gallery       = document.querySelector(".portfolio-gallery .gallery-grid");

  const lightbox      = document.getElementById("lightbox");
  const lightboxImage = document.querySelector(".lightbox-image");
  const closeBtn      = document.querySelector(".lightbox-close");
  const prevBtn       = document.querySelector(".lightbox-prev");
  const nextBtn       = document.querySelector(".lightbox-next");

  galleryItems.forEach(item => {
    item.classList.remove("hidden");
    item.style.transitionDelay = "0ms";
  });

  let currentImages = [];
  let currentIndex  = 0;

  /* =========================
     FILTER
  ========================= */
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      galleryItems.forEach((item, index) => {
        const show = filter === "all" || item.dataset.category === filter;

        item.style.opacity = show ? "1" : "0";
        item.style.transform = show ? "scale(1)" : "scale(0.96)";
        item.style.pointerEvents = show ? "auto" : "none";

        if (show) {
          item.classList.remove("hidden");
          item.style.transitionDelay = `${index * 60}ms`;
        } else {
          item.classList.add("hidden");
          item.style.transitionDelay = "0ms";
        }
      });
    });
  });

  /* =========================
     LIGHTBOX
  ========================= */
  gallery.addEventListener("click", e => {
    if (e.target.closest(".like-btn")) return;

    const item = e.target.closest(".gallery-item");
    if (!item || item.classList.contains("hidden")) return;

    currentImages = galleryItems
      .filter(i => !i.classList.contains("hidden"))
      .map(i => i.querySelector("img"));

    currentIndex = currentImages.indexOf(item.querySelector("img"));
    openLightbox();
  });

  function openLightbox() {
    if (!currentImages[currentIndex]) return;
    lightboxImage.src = currentImages[currentIndex].src;
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
  }

  closeBtn.onclick = closeLightbox;
  lightbox.onclick = e => e.target === lightbox && closeLightbox();
  prevBtn.onclick  = () => (currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length, openLightbox());
  nextBtn.onclick  = () => (currentIndex = (currentIndex + 1) % currentImages.length, openLightbox());

  /* =========================
     LIKE SYSTEM – SAFE
  ========================= */
  const supabase = window.supabaseClient;
  const hasSupabase = !!supabase;
  const cooldownMs = 3000;

  if (hasSupabase) {

    // INITIAL LOAD
    document.querySelectorAll(".gallery-item").forEach(item => {
      const id = item.dataset.photoId;
      const btn = item.querySelector(".like-btn");
      const countEl = btn?.querySelector(".like-count");

      if (!id || !btn || !countEl) return;

      supabase
        .from("photo_likes")
        .select("likes")
        .eq("photo_id", id)
        .maybeSingle()
        .then(({ data }) => {
          countEl.textContent = data?.likes ?? 0;
        });
    });

    // CLICK – CSAK A GALLERY-BEN
    gallery.addEventListener("click", async e => {
      const btn = e.target.closest(".like-btn");
      if (!btn) return;

      e.stopPropagation();

      const card = btn.closest(".gallery-item");
      const id = card?.dataset.photoId;
      if (!id) return;

      const countEl = btn.querySelector(".like-count");
      const likedKey = `liked-${id}`;
      const cooldownKey = `cooldown-${id}`;

      const now = Date.now();
      const last = parseInt(localStorage.getItem(cooldownKey) || "0");
      if (now - last < cooldownMs) return;

      localStorage.setItem(cooldownKey, now.toString());

      let liked = localStorage.getItem(likedKey) === "1";
      liked = !liked;

      localStorage.setItem(likedKey, liked ? "1" : "0");
      btn.classList.toggle("liked", liked);

      const newCount = Math.max(
        0,
        parseInt(countEl.textContent || "0") + (liked ? 1 : -1)
      );

      countEl.textContent = newCount;

      await supabase.from("photo_likes").upsert({
        photo_id: id,
        likes: newCount
      });
    });
  }

});

/* =========================
   CATEGORY UNDERLINE
========================= */
const categoryBar = document.querySelector(".category-bar");
const buttons = document.querySelectorAll(".filter-btn");

if (categoryBar && buttons.length) {
  const underline = document.createElement("span");
  underline.className = "category-underline";
  categoryBar.appendChild(underline);

  function moveUnderline(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parentRect = categoryBar.getBoundingClientRect();
    underline.style.width = rect.width + "px";
    underline.style.transform = `translateX(${rect.left - parentRect.left}px)`;
    underline.style.opacity = "1";
  }

  window.addEventListener("load", () => {
    moveUnderline(document.querySelector(".filter-btn.active"));
  });

  buttons.forEach(btn => btn.addEventListener("click", () => moveUnderline(btn)));
  window.addEventListener("resize", () => moveUnderline(document.querySelector(".filter-btn.active")));
}
