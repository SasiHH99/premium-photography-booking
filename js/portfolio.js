const PORTFOLIO_TEXT = {
  hu: {
    heroTitle: "Munkák, amelyeknek súlya van a képen is.",
    heroCopy: "Portré, páros, autós, családi és kreatív sorozatok Bécsből és környékéről, valódi fényekkel és tiszta vizuális vezetéssel.",
    allLabel: "Összes kategória",
    totalLabel: "Válogatott képek",
    activeLabel: "Aktív nézet",
    visibleLabel(count) {
      return `${count} kép látható`;
    },
    activeFilterLabel(label) {
      return `Aktív szűrő: ${label}`;
    },
    ctaTitle: "Ha ezt a vizuális minőséget a saját képeidnél is szeretnéd, innen érdemes továbblépni.",
    ctaCopy: "Először röviden egyeztetjük a célt, utána áll össze az időpont, a helyszín és a legerősebb csomag.",
    ctaButton: "Fotózást kérek",
    open: "Megnyitás",
    empty: "Ebben a kategóriában most nincs megjeleníthető kép.",
    lightboxSeparator: " | ",
    categories: {
      all: "Összes",
      termeszet: "Természet",
      varos: "Város",
      portre: "Portré",
      paros: "Páros",
      baba: "Baba / családi",
      autos: "Autós",
      "ejszakai-kreativ": "Éjszakai / Kreatív"
    },
    categoryNotes: {
      termeszet: "Puha, természetes fénykörülmények",
      varos: "Érzés, ritmus, urbánus karakter",
      portre: "Letisztult, erős személyes jelenlét",
      paros: "Kapcsolat, közös dinamika, valódi gesztusok",
      baba: "Finom, meleg, nyugodt pillanatok",
      autos: "Fény, forma, felület, jelenlét",
      "ejszakai-kreativ": "Hangulat, kontraszt, karakter"
    },
    altTemplates: {
      termeszet: "Természetes fényű fotózás Bécs környékén: {title}",
      varos: "Városi fotózás Bécsben: {title}",
      portre: "Portréfotózás Bécsben: {title}",
      paros: "Páros fotózás Bécsben: {title}",
      baba: "Baba és családi fotózás: {title}",
      autos: "Autós fotózás részlete: {title}",
      "ejszakai-kreativ": "Éjszakai kreatív fotózás: {title}"
    }
  },
  de: {
    heroTitle: "Arbeiten mit klarer Bildsprache und echter Wirkung.",
    heroCopy: "Porträts, Paare, Auto-, Familien- und kreative Serien aus Wien und Umgebung mit echtem Licht und klarer, ruhiger Bildsprache.",
    allLabel: "Alle Kategorien",
    totalLabel: "Kuratiertes Bildmaterial",
    activeLabel: "Aktive Auswahl",
    visibleLabel(count) {
      return `${count} Bilder sichtbar`;
    },
    activeFilterLabel(label) {
      return `Aktiver Filter: ${label}`;
    },
    ctaTitle: "Wenn du genau diese Bildqualität auch für dein eigenes Shooting willst, geht es hier weiter.",
    ctaCopy: "Wir klären zuerst Ziel, Stimmung und Ort und legen danach den passenden Ablauf und das stärkste Paket fest.",
    ctaButton: "Shooting anfragen",
    open: "Öffnen",
    empty: "In dieser Kategorie sind aktuell keine Bilder sichtbar.",
    lightboxSeparator: " | ",
    categories: {
      all: "Alle",
      termeszet: "Natur",
      varos: "Stadt",
      portre: "Porträt",
      paros: "Paar",
      baba: "Baby / Familie",
      autos: "Auto",
      "ejszakai-kreativ": "Nacht / Kreativ"
    },
    categoryNotes: {
      termeszet: "Weiches Licht und ruhige Bildstimmung",
      varos: "Urbaner Rhythmus und echte Umgebung",
      portre: "Klar, nahbar, präsent",
      paros: "Beziehung, Dynamik, echte Momente",
      baba: "Warm, weich, unaufgeregt",
      autos: "Linien, Licht, Präsenz",
      "ejszakai-kreativ": "Atmosphäre, Kontrast, Charakter"
    },
    altTemplates: {
      termeszet: "Natürliches Shooting in Wien Umgebung: {title}",
      varos: "Urbanes Shooting in Wien: {title}",
      portre: "Porträtshooting in Wien: {title}",
      paros: "Paarshooting in Wien: {title}",
      baba: "Baby- und Familienshooting: {title}",
      autos: "Auto Shooting Detail: {title}",
      "ejszakai-kreativ": "Kreatives Nachtshooting: {title}"
    }
  }
};

function buildAltText(item, copy) {
  const title = String(item.title || copy.categories[item.category] || "Portfolio").trim();
  const template = copy.altTemplates[item.category] || title;
  return template.replace("{title}", title);
}

function buildPortfolioCard(item, copy) {
  const card = document.createElement("article");
  card.className = "portfolio-card";
  card.dataset.category = item.category;
  card.dataset.title = item.title || "";
  card.dataset.note = item.note || "";
  card.innerHTML = `
    <img src="${item.src}" loading="lazy" alt="${item.alt}">
    <div class="portfolio-card-overlay">
      <div class="portfolio-card-copy">
        <span>${copy.categories[item.category] || item.category}</span>
        <strong>${item.note}</strong>
      </div>
      <div class="portfolio-card-action">${copy.open}</div>
    </div>
  `;
  return card;
}

document.addEventListener("DOMContentLoaded", async () => {
  const shell = document.querySelector("[data-portfolio-app]");
  if (!shell) return;

  const lang = shell.dataset.lang === "de" ? "de" : "hu";
  const copy = PORTFOLIO_TEXT[lang];
  const bookingUrl = lang === "de" ? "termin.html" : "foglalas.html";
  const heroTitle = document.getElementById("portfolioHeroTitle");
  const heroCopy = document.getElementById("portfolioHeroCopy");
  const totalLabel = document.getElementById("portfolioTotalLabel");
  const totalValue = document.getElementById("portfolioTotalValue");
  const categoryLabel = document.getElementById("portfolioCategoryLabel");
  const categoryValue = document.getElementById("portfolioCategoryValue");
  const categoryValuePanel = document.getElementById("portfolioCategoryValuePanel");
  const noteTitle = document.getElementById("portfolioNoteTitle");
  const noteCopy = document.getElementById("portfolioNoteCopy");
  const visibleCount = document.getElementById("portfolioVisibleCount");
  const activeFilterChip = document.getElementById("portfolioActiveFilterChip");
  const filters = document.getElementById("portfolioFilters");
  const grid = document.getElementById("portfolioGrid");
  const empty = document.getElementById("portfolioEmpty");
  const ctaTitle = document.getElementById("portfolioCtaTitle");
  const ctaCopy = document.getElementById("portfolioCtaCopy");
  const ctaButton = document.getElementById("portfolioCtaButton");
  const lightbox = document.getElementById("portfolioLightbox");
  const lightboxImage = document.getElementById("portfolioLightboxImage");
  const lightboxMeta = document.getElementById("portfolioLightboxMeta");
  const closeBtn = document.getElementById("portfolioCloseBtn");
  const prevBtn = document.getElementById("portfolioPrevBtn");
  const nextBtn = document.getElementById("portfolioNextBtn");

  const state = {
    filter: "all",
    visibleCards: [],
    currentIndex: 0
  };

  heroTitle.textContent = copy.heroTitle;
  heroCopy.textContent = copy.heroCopy;
  totalLabel.textContent = copy.totalLabel;
  categoryLabel.textContent = copy.allLabel;
  ctaTitle.textContent = copy.ctaTitle;
  ctaCopy.textContent = copy.ctaCopy;
  ctaButton.textContent = copy.ctaButton;
  ctaButton.href = bookingUrl;
  empty.textContent = copy.empty;

  try {
    const response = await fetch(`/.netlify/functions/portfolio-feed?lang=${lang}`);
    const data = await response.json().catch(() => ({}));
    const items = Array.isArray(data.items) ? data.items : [];

    items.forEach((item) => {
      if (!item?.url || !item?.category || !item?.title) return;
      const card = buildPortfolioCard(
        {
          category: item.category,
          src: item.url,
          alt: buildAltText(item, copy),
          title: item.title,
          note: item.note || copy.categoryNotes[item.category] || item.title
        },
        copy
      );
      grid.appendChild(card);
    });
  } catch (error) {
    console.warn("Portfolio feed load failed:", error);
  }

  function getCards() {
    return Array.from(grid.querySelectorAll(".portfolio-card"));
  }

  function getCategories() {
    return [...new Set(getCards().map((card) => card.dataset.category).filter(Boolean))];
  }

  function updateMeta() {
    const cards = getCards();
    const activeLabel = state.filter === "all" ? copy.categories.all : copy.categories[state.filter];
    categoryValue.textContent = activeLabel;
    categoryValuePanel.textContent = activeLabel;
    noteTitle.textContent = copy.activeLabel;
    noteCopy.textContent = state.filter === "all" ? copy.heroCopy : (copy.categoryNotes[state.filter] || copy.heroCopy);
    totalValue.textContent = String(cards.length);
    if (visibleCount) visibleCount.textContent = copy.visibleLabel(state.visibleCards.length);
    if (activeFilterChip) activeFilterChip.textContent = copy.activeFilterLabel(activeLabel);
  }

  function renderFilters() {
    const items = [["all", copy.categories.all], ...getCategories().map((key) => [key, copy.categories[key] || key])];
    filters.innerHTML = items
      .map(([key, label]) => `<button type="button" class="portfolio-filter-btn ${state.filter === key ? "is-active" : ""}" data-filter="${key}">${label}</button>`)
      .join("");
  }

  function renderCards() {
    const cards = getCards();
    state.visibleCards = cards.filter((card) => state.filter === "all" || card.dataset.category === state.filter);

    cards.forEach((card) => {
      const shouldShow = state.filter === "all" || card.dataset.category === state.filter;
      card.hidden = !shouldShow;
    });

    empty.hidden = state.visibleCards.length > 0;
    updateMeta();
  }

  function openLightbox(index) {
    state.currentIndex = index;
    const card = state.visibleCards[state.currentIndex];
    if (!card) return;

    const image = card.querySelector("img");
    const category = card.dataset.category;
    const title = card.dataset.title || image.getAttribute("alt") || copy.categories[category] || "";
    const note = card.dataset.note || card.querySelector(".portfolio-card-copy strong")?.textContent || copy.categoryNotes[category] || "";
    lightboxImage.src = image.getAttribute("src");
    lightboxImage.alt = image.getAttribute("alt") || copy.categories[category];
    lightboxMeta.textContent = `${copy.categories[category] || category}${copy.lightboxSeparator}${title}${note ? `${copy.lightboxSeparator}${note}` : ""}`;
    lightbox.classList.add("is-open");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    renderFilters();
    renderCards();
  });

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".portfolio-card");
    if (!card || card.hidden) return;
    const index = state.visibleCards.indexOf(card);
    if (index >= 0) openLightbox(index);
  });

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => {
    if (!state.visibleCards.length) return;
    state.currentIndex = (state.currentIndex - 1 + state.visibleCards.length) % state.visibleCards.length;
    openLightbox(state.currentIndex);
  });
  nextBtn.addEventListener("click", () => {
    if (!state.visibleCards.length) return;
    state.currentIndex = (state.currentIndex + 1) % state.visibleCards.length;
    openLightbox(state.currentIndex);
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") prevBtn.click();
    if (event.key === "ArrowRight") nextBtn.click();
  });

  renderFilters();
  renderCards();
});

