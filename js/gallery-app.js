const GALLERY_COPY = {
  hu: {
    heroTitle: "A te képanyagodhoz szabott online galéria.",
    heroCopy:
      "Válogasd át kényelmesen a fotókat, jelöld a kedvenceidet, és nézd meg teljes méretben az összes képet egy letisztult, gyors felületen.",
    totalLabel: "Összes kép",
    favoriteLabel: "Kedvencek",
    selectionLabel: "Aktív nézet",
    toolbarLabel: "Szűrő",
    allImages: "Minden kép",
    onlyFavorites: "Csak kedvencek",
    countSuffix: "kép",
    open: "Megnyitás",
    favorite: "Kedvenc",
    unfavorite: "Kedvenc törlése",
    emptyTitle: "Még nincsenek feltöltött képek.",
    emptyCopy:
      "Amint elkészült a galéria, itt fogod látni az összes átadott képet. Ha már kaptál emailt, de a galéria üres, akkor érdemes később újratölteni.",
    errorCopy: "Nem sikerült betölteni a galériát. Próbáld meg újra pár perc múlva.",
    preview: "Előnézet",
    logout: "Kijelentkezés",
    refresh: "Frissítés",
    close: "Bezár",
    previous: "Előző",
    next: "Következő",
    download: "Letöltés",
    pageTitle: "Online galéria"
  },
  de: {
    heroTitle: "Deine Online-Galerie für eine ruhige, schnelle Auswahl.",
    heroCopy:
      "Sieh dir alle Bilder in voller Größe an, markiere Favoriten und arbeite dich strukturiert durch deine Auswahl.",
    totalLabel: "Bilder gesamt",
    favoriteLabel: "Favoriten",
    selectionLabel: "Aktive Ansicht",
    toolbarLabel: "Filter",
    allImages: "Alle Bilder",
    onlyFavorites: "Nur Favoriten",
    countSuffix: "Bilder",
    open: "Öffnen",
    favorite: "Favorit",
    unfavorite: "Favorit entfernen",
    emptyTitle: "Noch keine Bilder verfügbar.",
    emptyCopy:
      "Sobald die Galerie bereit ist, erscheinen hier alle Bilder. Wenn du bereits die E-Mail erhalten hast und nichts siehst, lade die Seite bitte später neu.",
    errorCopy: "Die Galerie konnte gerade nicht geladen werden. Bitte versuche es in ein paar Minuten erneut.",
    preview: "Vorschau",
    logout: "Abmelden",
    refresh: "Neu laden",
    close: "Schließen",
    previous: "Zurück",
    next: "Weiter",
    download: "Download",
    pageTitle: "Online-Galerie"
  }
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", async () => {
  const shell = document.querySelector("[data-gallery-app]");
  if (!shell) return;

  const lang = shell.dataset.lang === "de" ? "de" : "hu";
  const copy = GALLERY_COPY[lang];
  const loginUrl = lang === "de" ? "/de/galeria-login.html" : "/hu/galeria-login.html";
  const supabase = window.supabaseClient;
  if (!supabase) return;

  const heroTitle = document.getElementById("galleryHeroTitle");
  const heroCopy = document.getElementById("galleryHeroCopy");
  const totalLabel = document.getElementById("galleryTotalLabel");
  const favoriteLabel = document.getElementById("galleryFavoriteLabel");
  const selectionLabel = document.getElementById("gallerySelectionLabel");
  const totalCount = document.getElementById("galleryTotalCount");
  const favoriteCount = document.getElementById("galleryFavoriteCount");
  const selectionCount = document.getElementById("gallerySelectionCount");
  const toolbarLabel = document.getElementById("galleryToolbarLabel");
  const allButton = document.getElementById("galleryFilterAll");
  const favoritesButton = document.getElementById("galleryFilterFavorites");
  const grid = document.getElementById("galleryGrid");
  const count = document.getElementById("galleryCount");
  const emptyState = document.getElementById("galleryEmpty");
  const errorState = document.getElementById("galleryError");
  const refreshButton = document.getElementById("galleryRefreshBtn");
  const logoutButton = document.getElementById("galleryLogoutBtn");
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCount = document.getElementById("lightboxCount");
  const closeButton = document.getElementById("closeBtn");
  const previousButton = document.getElementById("prevBtn");
  const nextButton = document.getElementById("nextBtn");
  const downloadButton = document.getElementById("downloadBtn");

  heroTitle.textContent = copy.heroTitle;
  heroCopy.textContent = copy.heroCopy;
  totalLabel.textContent = copy.totalLabel;
  favoriteLabel.textContent = copy.favoriteLabel;
  selectionLabel.textContent = copy.selectionLabel;
  toolbarLabel.textContent = copy.toolbarLabel;
  allButton.textContent = copy.allImages;
  favoritesButton.textContent = copy.onlyFavorites;
  refreshButton.textContent = copy.refresh;
  logoutButton.textContent = copy.logout;
  closeButton.textContent = copy.close;
  previousButton.textContent = copy.previous;
  nextButton.textContent = copy.next;
  downloadButton.textContent = copy.download;
  document.title = `${copy.pageTitle} | B. Photography`;

  const state = {
    allImages: [],
    visibleImages: [],
    favoritePaths: new Set(),
    filter: "all",
    currentIndex: 0,
    loading: false
  };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = loginUrl;
    return;
  }

  async function callGalleryApi(method = "GET", payload = null) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Missing session");
    }

    const response = await fetch("/.netlify/functions/gallery-client-media", {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(method === "GET" ? {} : { "Content-Type": "application/json" })
      },
      ...(payload ? { body: JSON.stringify(payload) } : {})
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.error) {
      throw new Error(body.details || body.error || "Gallery request failed");
    }

    return body;
  }

  function updateStats() {
    totalCount.textContent = String(state.allImages.length);
    favoriteCount.textContent = String(state.favoritePaths.size);
    selectionCount.textContent = String(state.visibleImages.length);
    count.textContent = `${state.visibleImages.length} ${copy.countSuffix}`;

    allButton.classList.toggle("is-active", state.filter === "all");
    favoritesButton.classList.toggle("is-active", state.filter === "favorites");
  }

  function setBusy(flag) {
    state.loading = flag;
    refreshButton.disabled = flag;
    logoutButton.disabled = flag;
  }

  function buildVisibleImages() {
    state.visibleImages =
      state.filter === "favorites"
        ? state.allImages.filter((image) => state.favoritePaths.has(image.path))
        : [...state.allImages];
  }

  function openLightbox(index) {
    state.currentIndex = index;
    const current = state.visibleImages[state.currentIndex];
    if (!current) return;

    lightboxImage.src = current.url;
    lightboxImage.alt = current.name;
    lightboxCount.textContent = `${state.currentIndex + 1} / ${state.visibleImages.length}`;
    lightbox.classList.add("is-open");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
  }

  async function toggleFavorite(imagePath) {
    const shouldFavorite = !state.favoritePaths.has(imagePath);

    await callGalleryApi("POST", {
      imagePath,
      favorite: shouldFavorite
    });

    if (shouldFavorite) {
      state.favoritePaths.add(imagePath);
    } else {
      state.favoritePaths.delete(imagePath);
    }

    buildVisibleImages();
    render();
  }

  function renderGrid() {
    if (!state.visibleImages.length) {
      grid.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    grid.innerHTML = state.visibleImages
      .map((image, index) => {
        const isFavorite = state.favoritePaths.has(image.path);

        return `
          <article class="gallery-card" data-open-index="${index}">
            <img src="${escapeHtml(image.url)}" loading="lazy" alt="${escapeHtml(image.name)}">
            <div class="gallery-card-body">
              <div class="gallery-card-meta">
                <span>${escapeHtml(copy.preview)}</span>
                <strong>${escapeHtml(image.name)}</strong>
              </div>
              <button
                type="button"
                class="gallery-favorite-btn ${isFavorite ? "is-active" : ""}"
                data-favorite-path="${escapeHtml(image.path)}"
                aria-label="${escapeHtml(isFavorite ? copy.unfavorite : copy.favorite)}"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"></path>
                </svg>
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function render() {
    updateStats();
    renderGrid();
  }

  async function loadGallery() {
    setBusy(true);
    errorState.hidden = true;

    try {
      const data = await callGalleryApi("GET");
      state.allImages = Array.isArray(data.images) ? data.images : [];
      state.favoritePaths = new Set(Array.isArray(data.favorites) ? data.favorites : []);
      buildVisibleImages();
      render();
    } catch (error) {
      console.error("Gallery load error:", error);
      state.allImages = [];
      state.visibleImages = [];
      grid.innerHTML = "";
      emptyState.hidden = true;
      errorState.hidden = false;
    } finally {
      setBusy(false);
      updateStats();
    }
  }

  allButton.addEventListener("click", () => {
    state.filter = "all";
    buildVisibleImages();
    render();
  });

  favoritesButton.addEventListener("click", () => {
    state.filter = "favorites";
    buildVisibleImages();
    render();
  });

  refreshButton.addEventListener("click", loadGallery);

  logoutButton.addEventListener("click", async () => {
    setBusy(true);
    await supabase.auth.signOut();
    window.location.href = loginUrl;
  });

  grid.addEventListener("click", async (event) => {
    const favoriteButton = event.target.closest("[data-favorite-path]");
    if (favoriteButton) {
      event.stopPropagation();
      await toggleFavorite(favoriteButton.dataset.favoritePath);
      return;
    }

    const card = event.target.closest("[data-open-index]");
    if (card) {
      openLightbox(Number(card.dataset.openIndex));
    }
  });

  closeButton.addEventListener("click", closeLightbox);

  previousButton.addEventListener("click", () => {
    if (!state.visibleImages.length) return;
    state.currentIndex = (state.currentIndex - 1 + state.visibleImages.length) % state.visibleImages.length;
    openLightbox(state.currentIndex);
  });

  nextButton.addEventListener("click", () => {
    if (!state.visibleImages.length) return;
    state.currentIndex = (state.currentIndex + 1) % state.visibleImages.length;
    openLightbox(state.currentIndex);
  });

  downloadButton.addEventListener("click", () => {
    const current = state.visibleImages[state.currentIndex];
    if (!current) return;
    window.open(current.url, "_blank", "noopener");
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") previousButton.click();
    if (event.key === "ArrowRight") nextButton.click();
  });

  await loadGallery();
});
