
const STATUS_LABELS = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  unsubscribed: "Leiratkozott",
  cancelled: "Lemondva",
  new: "Új",
  reviewed: "Feldolgozott",
  converted: "Galériává alakítva"
};

const LANG_LABELS = {
  hu: "Magyar",
  de: "Deutsch",
  all: "Mindkettő"
};

const PORTFOLIO_CATEGORY_LABELS = {
  termeszet: "Természet",
  varos: "Város",
  portre: "Portré",
  paros: "Páros",
  baba: "Baba",
  autos: "Autós",
  "ejszakai-kreativ": "Éjszakai / Kreatív"
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  if (!supabase) return;
  const adminView = document.body.dataset.adminView || "dashboard";

  const ui = {
    refreshAllBtn: document.getElementById("refreshAllBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    globalFeedback: document.getElementById("globalFeedback"),
    statBookings: document.getElementById("statBookings"),
    statContacts: document.getElementById("statContacts"),
    statGalleryUsers: document.getElementById("statGalleryUsers"),
    statPortfolioItems: document.getElementById("statPortfolioItems"),
    statNewsletter: document.getElementById("statNewsletter"),
    tabButtons: Array.from(document.querySelectorAll(".tab-btn[data-tab]")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel[data-panel]")),
    bookingSearch: document.getElementById("bookingSearch"),
    bookingStatusFilter: document.getElementById("bookingStatusFilter"),
    bookingLangFilter: document.getElementById("bookingLangFilter"),
    bookingFilterSummary: document.getElementById("bookingFilterSummary"),
    bookingResetFiltersBtn: document.getElementById("bookingResetFiltersBtn"),
    bookingRows: document.getElementById("bookingRows"),
    bookingEmpty: document.getElementById("bookingEmpty"),
    bookingDetailEmpty: document.getElementById("bookingDetailEmpty"),
    bookingDetailCard: document.getElementById("bookingDetailCard"),
    bookingDetailName: document.getElementById("bookingDetailName"),
    bookingDetailMeta: document.getElementById("bookingDetailMeta"),
    bookingDetailEmail: document.getElementById("bookingDetailEmail"),
    bookingDetailDate: document.getElementById("bookingDetailDate"),
    bookingDetailPackage: document.getElementById("bookingDetailPackage"),
    bookingDetailStatus: document.getElementById("bookingDetailStatus"),
    bookingDetailLang: document.getElementById("bookingDetailLang"),
    bookingDetailCreated: document.getElementById("bookingDetailCreated"),
    bookingDetailMessage: document.getElementById("bookingDetailMessage"),
    bookingConfirmBtn: document.getElementById("bookingConfirmBtn"),
    bookingPendingBtn: document.getElementById("bookingPendingBtn"),
    bookingCancelBtn: document.getElementById("bookingCancelBtn"),
    bookingCreateGalleryBtn: document.getElementById("bookingCreateGalleryBtn"),
    contactSearch: document.getElementById("contactSearch"),
    contactStatusFilter: document.getElementById("contactStatusFilter"),
    contactFilterSummary: document.getElementById("contactFilterSummary"),
    contactResetFiltersBtn: document.getElementById("contactResetFiltersBtn"),
    contactRows: document.getElementById("contactRows"),
    contactEmpty: document.getElementById("contactEmpty"),
    contactDetailEmpty: document.getElementById("contactDetailEmpty"),
    contactDetailCard: document.getElementById("contactDetailCard"),
    contactDetailName: document.getElementById("contactDetailName"),
    contactDetailMeta: document.getElementById("contactDetailMeta"),
    contactDetailLang: document.getElementById("contactDetailLang"),
    contactDetailStatus: document.getElementById("contactDetailStatus"),
    contactDetailCreated: document.getElementById("contactDetailCreated"),
    contactDetailSource: document.getElementById("contactDetailSource"),
    contactDetailMessage: document.getElementById("contactDetailMessage"),
    contactAdminNote: document.getElementById("contactAdminNote"),
    contactSaveBtn: document.getElementById("contactSaveBtn"),
    contactReviewedBtn: document.getElementById("contactReviewedBtn"),
    contactCreateGalleryBtn: document.getElementById("contactCreateGalleryBtn"),
    contactReplyLink: document.getElementById("contactReplyLink"),
    galleryCreateEmail: document.getElementById("galleryCreateEmail"),
    galleryCreateLang: document.getElementById("galleryCreateLang"),
    galleryCreateNote: document.getElementById("galleryCreateNote"),
    galleryCreateBtn: document.getElementById("galleryCreateBtn"),
    galleryUserSearch: document.getElementById("galleryUserSearch"),
    galleryUserList: document.getElementById("galleryUserList"),
    galleryUserEmpty: document.getElementById("galleryUserEmpty"),
    galleryDetailEmpty: document.getElementById("galleryDetailEmpty"),
    galleryDetailCard: document.getElementById("galleryDetailCard"),
    galleryDetailEmail: document.getElementById("galleryDetailEmail"),
    galleryDetailMeta: document.getElementById("galleryDetailMeta"),
    galleryDetailLang: document.getElementById("galleryDetailLang"),
    galleryDetailLastSignIn: document.getElementById("galleryDetailLastSignIn"),
    galleryDetailPasswordUpdated: document.getElementById("galleryDetailPasswordUpdated"),
    galleryDetailLangSelect: document.getElementById("galleryDetailLangSelect"),
    galleryDetailNote: document.getElementById("galleryDetailNote"),
    gallerySaveMetaBtn: document.getElementById("gallerySaveMetaBtn"),
    galleryResetPasswordBtn: document.getElementById("galleryResetPasswordBtn"),
    galleryUploadInput: document.getElementById("galleryUploadInput"),
    galleryUploadBtn: document.getElementById("galleryUploadBtn"),
    galleryMediaGrid: document.getElementById("galleryMediaGrid"),
    galleryMediaEmpty: document.getElementById("galleryMediaEmpty"),
    portfolioItemId: document.getElementById("portfolioItemId"),
    portfolioItemPath: document.getElementById("portfolioItemPath"),
    portfolioFormHeading: document.getElementById("portfolioFormHeading"),
    portfolioFormNote: document.getElementById("portfolioFormNote"),
    portfolioCategory: document.getElementById("portfolioCategory"),
    portfolioLang: document.getElementById("portfolioLang"),
    portfolioTitle: document.getElementById("portfolioTitle"),
    portfolioNote: document.getElementById("portfolioNote"),
    portfolioSortOrder: document.getElementById("portfolioSortOrder"),
    portfolioUploadInput: document.getElementById("portfolioUploadInput"),
    portfolioSaveBtn: document.getElementById("portfolioSaveBtn"),
    portfolioResetBtn: document.getElementById("portfolioResetBtn"),
    portfolioDeleteBtn: document.getElementById("portfolioDeleteBtn"),
    portfolioList: document.getElementById("portfolioList"),
    portfolioEmpty: document.getElementById("portfolioEmpty"),
    newsletterSearch: document.getElementById("newsletterSearch"),
    newsletterStatusFilter: document.getElementById("newsletterStatusFilter"),
    newsletterLangFilter: document.getElementById("newsletterLangFilter"),
    newsletterFilterSummary: document.getElementById("newsletterFilterSummary"),
    newsletterResetFiltersBtn: document.getElementById("newsletterResetFiltersBtn"),
    newsletterExportBtn: document.getElementById("newsletterExportBtn"),
    newsletterRows: document.getElementById("newsletterRows"),
    newsletterEmpty: document.getElementById("newsletterEmpty"),
    newsletterDetailEmpty: document.getElementById("newsletterDetailEmpty"),
    newsletterDetailCard: document.getElementById("newsletterDetailCard"),
    newsletterDetailEmail: document.getElementById("newsletterDetailEmail"),
    newsletterDetailMeta: document.getElementById("newsletterDetailMeta"),
    newsletterDetailLang: document.getElementById("newsletterDetailLang"),
    newsletterDetailStatus: document.getElementById("newsletterDetailStatus"),
    newsletterDetailSource: document.getElementById("newsletterDetailSource"),
    newsletterDetailCreated: document.getElementById("newsletterDetailCreated"),
    newsletterDetailConfirmed: document.getElementById("newsletterDetailConfirmed"),
    newsletterDetailLastSent: document.getElementById("newsletterDetailLastSent"),
    newsletterDetailUnsubscribed: document.getElementById("newsletterDetailUnsubscribed"),
    newsletterDetailWelcomeSent: document.getElementById("newsletterDetailWelcomeSent"),
    newsletterDetailResendId: document.getElementById("newsletterDetailResendId"),
    newsletterEmailLink: document.getElementById("newsletterEmailLink"),
    newsletterResendBtn: document.getElementById("newsletterResendBtn"),
    newsletterCampaignPreset: document.getElementById("newsletterCampaignPreset"),
    newsletterCampaignPresetBtn: document.getElementById("newsletterCampaignPresetBtn"),
    newsletterCampaignLang: document.getElementById("newsletterCampaignLang"),
    newsletterCampaignSubject: document.getElementById("newsletterCampaignSubject"),
    newsletterCampaignHeading: document.getElementById("newsletterCampaignHeading"),
    newsletterCampaignIntro: document.getElementById("newsletterCampaignIntro"),
    newsletterCampaignBody: document.getElementById("newsletterCampaignBody"),
    newsletterCampaignCtaText: document.getElementById("newsletterCampaignCtaText"),
    newsletterCampaignCtaUrl: document.getElementById("newsletterCampaignCtaUrl"),
    newsletterCampaignScheduleAt: document.getElementById("newsletterCampaignScheduleAt"),
    newsletterCampaignTestEmail: document.getElementById("newsletterCampaignTestEmail"),
    newsletterCampaignAudience: document.getElementById("newsletterCampaignAudience"),
    newsletterFollowupAudience: document.getElementById("newsletterFollowupAudience"),
    newsletterSummaryPending: document.getElementById("newsletterSummaryPending"),
    newsletterSummaryConfirmed: document.getElementById("newsletterSummaryConfirmed"),
    newsletterSummaryUnsubscribed: document.getElementById("newsletterSummaryUnsubscribed"),
    newsletterSummaryWelcome: document.getElementById("newsletterSummaryWelcome"),
    newsletterDiagnosticsSender: document.getElementById("newsletterDiagnosticsSender"),
    newsletterDiagnosticsSenderSource: document.getElementById("newsletterDiagnosticsSenderSource"),
    newsletterDiagnosticsAudience: document.getElementById("newsletterDiagnosticsAudience"),
    newsletterDiagnosticsSite: document.getElementById("newsletterDiagnosticsSite"),
    newsletterCampaignTestBtn: document.getElementById("newsletterCampaignTestBtn"),
    newsletterCampaignSendBtn: document.getElementById("newsletterCampaignSendBtn"),
    newsletterCampaignScheduleBtn: document.getElementById("newsletterCampaignScheduleBtn"),
    newsletterCampaignRunScheduledBtn: document.getElementById("newsletterCampaignRunScheduledBtn"),
    newsletterFollowupSendBtn: document.getElementById("newsletterFollowupSendBtn"),
    newsletterScheduledJobsList: document.getElementById("newsletterScheduledJobsList"),
    newsletterScheduledJobsEmpty: document.getElementById("newsletterScheduledJobsEmpty"),
    newsletterCampaignLogList: document.getElementById("newsletterCampaignLogList"),
    newsletterCampaignLogEmpty: document.getElementById("newsletterCampaignLogEmpty"),
    newsletterCampaignFeedback: document.getElementById("newsletterCampaignFeedback")
  };

  if (!ui.refreshAllBtn) return;

  const state = {
    activeTab: "bookings",
    bookings: [],
    contacts: [],
    galleryUsers: [],
    galleryFiles: [],
    portfolioItems: [],
    newsletterSubscribers: [],
    newsletterCampaignLogs: [],
    newsletterScheduledJobs: [],
    newsletterDiagnostics: {},
    selectedBookingId: null,
    selectedContactId: null,
    selectedGalleryUserId: null,
    selectedPortfolioId: null,
    selectedNewsletterId: null
  };

  function shouldLoadNewsletterCampaignData() {
    return adminView === "newsletter";
  }

  function shouldLoadGalleryMedia() {
    return adminView === "gallery" && Boolean(state.selectedGalleryUserId);
  }

  function showFeedback(message, tone = "success") {
    if (!message) {
      clearFeedback();
      return;
    }
    ui.globalFeedback.textContent = message;
    ui.globalFeedback.dataset.tone = tone;
    ui.globalFeedback.classList.remove("hidden");
  }

  function clearFeedback() {
    ui.globalFeedback.textContent = "";
    ui.globalFeedback.removeAttribute("data-tone");
    ui.globalFeedback.classList.add("hidden");
  }

  function setNewsletterCampaignFeedback(content = "", tone = "success") {
    if (!ui.newsletterCampaignFeedback) return;

    if (!content) {
      ui.newsletterCampaignFeedback.innerHTML = "";
      ui.newsletterCampaignFeedback.removeAttribute("data-tone");
      ui.newsletterCampaignFeedback.classList.add("hidden");
      return;
    }

    if (typeof content === "string") {
      const title = tone === "error"
        ? "Kampány hiba"
        : tone === "warning"
          ? "Kampány részben sikerült"
          : "Kampány visszajelzés";

      ui.newsletterCampaignFeedback.innerHTML = `
        <div class="campaign-feedback-head">
          <strong>${escapeHtml(title)}</strong>
        </div>
        <p class="campaign-feedback-copy">${escapeHtml(content)}</p>
      `;
      ui.newsletterCampaignFeedback.dataset.tone = tone;
      ui.newsletterCampaignFeedback.classList.remove("hidden");
      return;
    }

    const meta = Array.isArray(content.meta) ? content.meta.filter(Boolean) : [];
    const title = content.title || (tone === "error" ? "Kampány hiba" : "Kampány visszajelzés");
    const message = content.message || "";

    ui.newsletterCampaignFeedback.innerHTML = `
      <div class="campaign-feedback-head">
        <strong>${escapeHtml(title)}</strong>
        ${content.eyebrow ? `<span class="campaign-feedback-eyebrow">${escapeHtml(content.eyebrow)}</span>` : ""}
      </div>
      ${message ? `<p class="campaign-feedback-copy">${escapeHtml(message)}</p>` : ""}
      ${meta.length ? `
        <div class="campaign-feedback-meta">
          ${meta.map((item) => `<span class="campaign-feedback-chip">${escapeHtml(item)}</span>`).join("")}
        </div>
      ` : ""}
    `;
    ui.newsletterCampaignFeedback.dataset.tone = tone;
    ui.newsletterCampaignFeedback.classList.remove("hidden");
  }

  function setButtonBusy(button, busyText) {
    if (!button) return;
    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent.trim();
    }

    button.disabled = true;
    button.dataset.busy = "true";
    if (busyText) {
      button.textContent = busyText;
    }
  }

  function resetButtonBusy(button) {
    if (!button) return;
    button.disabled = false;
    button.removeAttribute("data-busy");
    if (button.dataset.defaultLabel) {
      button.textContent = button.dataset.defaultLabel;
    }
  }

  async function runBusyAction(button, busyText, action) {
    setButtonBusy(button, busyText);
    try {
      return await action();
    } finally {
      resetButtonBusy(button);
    }
  }

  function buildFilterSummary({ total, filtered, noun, emptyText, filters = [] }) {
    if (!total) return emptyText;

    const base = filtered === total
      ? `Mind a ${total} ${noun} látszik.`
      : `${filtered} / ${total} ${noun} látszik.`;

    if (!filters.length) return base;
    return `${base} Aktív szűrők: ${filters.join(" · ")}.`;
  }

  function setFilterSummary(element, resetButton, summaryText, hasFilters) {
    if (element) {
      element.textContent = summaryText;
    }

    if (resetButton) {
      resetButton.disabled = !hasFilters;
      resetButton.setAttribute("aria-disabled", String(!hasFilters));
    }
  }

  function resetBookingFilters() {
    if (ui.bookingSearch) ui.bookingSearch.value = "";
    if (ui.bookingStatusFilter) ui.bookingStatusFilter.value = "all";
    if (ui.bookingLangFilter) ui.bookingLangFilter.value = "all";
    renderBookings();
  }

  function resetContactFilters() {
    if (ui.contactSearch) ui.contactSearch.value = "";
    if (ui.contactStatusFilter) ui.contactStatusFilter.value = "all";
    renderContacts();
  }

  function resetNewsletterFilters() {
    if (ui.newsletterSearch) ui.newsletterSearch.value = "";
    if (ui.newsletterStatusFilter) ui.newsletterStatusFilter.value = "all";
    if (ui.newsletterLangFilter) ui.newsletterLangFilter.value = "all";
    renderNewsletter();
  }

  function getSelectedBooking() {
    return state.bookings.find((booking) => String(booking.id) === String(state.selectedBookingId)) || null;
  }

  function getSelectedContact() {
    return state.contacts.find((contact) => String(contact.id) === String(state.selectedContactId)) || null;
  }

  function getSelectedGalleryUser() {
    return state.galleryUsers.find((user) => user.id === state.selectedGalleryUserId) || null;
  }

  function getSelectedPortfolioItem() {
    return state.portfolioItems.find((item) => String(item.id) === String(state.selectedPortfolioId)) || null;
  }

  function getSelectedNewsletterSubscriber() {
    return state.newsletterSubscribers.find((subscriber) => String(subscriber.id) === String(state.selectedNewsletterId)) || null;
  }
  async function getAccessToken() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("A munkamenet lejárt. Jelentkezz be újra.");
    }

    return session.access_token;
  }

  async function callAdmin(path, options = {}) {
    const token = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.method === "GET" ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    };

    const response = await fetch(path, { ...options, headers });
    const raw = await response.text();
    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: raw.slice(0, 220) };
      }
    }

    if (!response.ok) {
      if (
        response.status === 404
        && path.startsWith("/.netlify/functions/")
        && ["127.0.0.1", "localhost"].includes(window.location.hostname)
        && window.location.port !== "8888"
      ) {
        throw new Error("A Netlify funkciók ebben a helyi előnézetben nem érhetők el.");
      }

      const detailText = [data.error, data.details].filter(Boolean).join(" | ");
      throw new Error(detailText || "Ismeretlen admin hiba történt.");
    }

    return data;
  }

  function updateStats() {
    if (ui.statBookings) ui.statBookings.textContent = String(state.bookings.length);
    if (ui.statContacts) ui.statContacts.textContent = String(state.contacts.length);
    if (ui.statGalleryUsers) ui.statGalleryUsers.textContent = String(state.galleryUsers.length);
    if (ui.statPortfolioItems) ui.statPortfolioItems.textContent = String(state.portfolioItems.length);
    if (ui.statNewsletter) ui.statNewsletter.textContent = String(state.newsletterSubscribers.length);
  }

  function ensureSelection(list, selectedId, getId) {
    if (!list.length) return null;
    const hasCurrent = list.some((item) => String(getId(item)) === String(selectedId));
    return hasCurrent ? selectedId : getId(list[0]);
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings_v2")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    state.bookings = data || [];
    state.selectedBookingId = ensureSelection(state.bookings, state.selectedBookingId, (booking) => booking.id);
  }

  async function loadContacts() {
    const data = await callAdmin("/.netlify/functions/admin-contact-messages", { method: "GET" });
    state.contacts = data.messages || [];
    state.selectedContactId = ensureSelection(state.contacts, state.selectedContactId, (contact) => contact.id);
  }

  async function loadGalleryUsers() {
    const data = await callAdmin("/.netlify/functions/admin-gallery-users", { method: "GET" });
    state.galleryUsers = data.users || [];
    state.selectedGalleryUserId = ensureSelection(state.galleryUsers, state.selectedGalleryUserId, (user) => user.id);
  }

  async function loadPortfolioItems() {
    const data = await callAdmin("/.netlify/functions/admin-portfolio-media", { method: "GET" });
    state.portfolioItems = data.items || [];
    const hasCurrent = state.portfolioItems.some((item) => String(item.id) === String(state.selectedPortfolioId));
    state.selectedPortfolioId = hasCurrent ? state.selectedPortfolioId : null;
  }

  async function loadNewsletterSubscribers() {
    const data = await callAdmin("/.netlify/functions/admin-newsletter-subscribers", { method: "GET" });
    state.newsletterSubscribers = data.subscribers || [];
    state.selectedNewsletterId = ensureSelection(state.newsletterSubscribers, state.selectedNewsletterId, (subscriber) => subscriber.id);
  }

  async function loadNewsletterCampaignLogs() {
    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", { method: "GET" });
    state.newsletterCampaignLogs = data.logs || [];
    state.newsletterScheduledJobs = data.schedules || [];
    state.newsletterDiagnostics = data.diagnostics || {};
  }

  async function loadGalleryFiles(userId) {
    if (!userId) {
      state.galleryFiles = [];
      return;
    }

    const data = await callAdmin("/.netlify/functions/admin-gallery-media", {
      method: "POST",
      body: JSON.stringify({ action: "list", userId })
    });

    state.galleryFiles = data.files || [];
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    ui.tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === tab);
    });
    ui.tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === tab);
    });
  }

  function renderBookings() {
    if (!ui.bookingRows) return;
    const query = ui.bookingSearch.value.trim().toLowerCase();
    const status = ui.bookingStatusFilter.value;
    const lang = ui.bookingLangFilter.value;

    const filtered = state.bookings.filter((booking) => {
      const haystack = [booking.name, booking.email, booking.package, booking.message].filter(Boolean).join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (status === "all" || booking.status === status)
        && (lang === "all" || booking.lang === lang);
    });

    const activeFilters = [];
    if (query) activeFilters.push(`keresés: "${query}"`);
    if (status !== "all") activeFilters.push(`státusz: ${STATUS_LABELS[status] || status}`);
    if (lang !== "all") activeFilters.push(`nyelv: ${LANG_LABELS[lang] || lang}`);
    setFilterSummary(
      ui.bookingFilterSummary,
      ui.bookingResetFiltersBtn,
      buildFilterSummary({
        total: state.bookings.length,
        filtered: filtered.length,
        noun: "foglalás",
        emptyText: "Még nincs foglalás a rendszerben.",
        filters: activeFilters
      }),
      activeFilters.length > 0
    );

    ui.bookingRows.innerHTML = filtered.map((booking) => `
      <tr data-booking-id="${booking.id}" class="${String(booking.id) === String(state.selectedBookingId) ? "is-selected" : ""}">
        <td><strong>${escapeHtml(booking.name || "-")}</strong><br><span class="list-secondary">${escapeHtml(booking.email || "-")}</span></td>
        <td>${escapeHtml(formatDate(booking.booking_date))}</td>
        <td>${escapeHtml(booking.package || "-")}</td>
        <td>${escapeHtml(LANG_LABELS[booking.lang] || booking.lang || "-")}</td>
        <td><span class="status-pill" data-status="${escapeHtml(booking.status || "")}">${escapeHtml(STATUS_LABELS[booking.status] || booking.status || "-")}</span></td>
      </tr>
    `).join("");

    ui.bookingEmpty.classList.toggle("hidden", filtered.length > 0);

    const booking = getSelectedBooking();
    ui.bookingDetailEmpty.classList.toggle("hidden", !!booking);
    ui.bookingDetailCard.classList.toggle("hidden", !booking);
    if (!booking) return;

    ui.bookingDetailName.textContent = booking.name || "-";
    ui.bookingDetailMeta.textContent = `${booking.email || "-"} | #${booking.id}`;
    ui.bookingDetailEmail.textContent = booking.email || "-";
    ui.bookingDetailDate.textContent = formatDate(booking.booking_date);
    ui.bookingDetailPackage.textContent = booking.package || "-";
    ui.bookingDetailStatus.textContent = STATUS_LABELS[booking.status] || booking.status || "-";
    ui.bookingDetailStatus.dataset.status = booking.status || "";
    ui.bookingDetailLang.textContent = LANG_LABELS[booking.lang] || booking.lang || "-";
    ui.bookingDetailCreated.textContent = formatDateTime(booking.created_at);
    ui.bookingDetailMessage.textContent = booking.message || "Nincs külön üzenet.";
  }

  function renderContacts() {
    if (!ui.contactRows) return;
    const query = ui.contactSearch.value.trim().toLowerCase();
    const status = ui.contactStatusFilter.value;

    const filtered = state.contacts.filter((contact) => {
      const haystack = [contact.name, contact.email, contact.message, contact.admin_note].filter(Boolean).join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (status === "all" || contact.status === status);
    });

    const activeFilters = [];
    if (query) activeFilters.push(`keresés: "${query}"`);
    if (status !== "all") activeFilters.push(`státusz: ${STATUS_LABELS[status] || status}`);
    setFilterSummary(
      ui.contactFilterSummary,
      ui.contactResetFiltersBtn,
      buildFilterSummary({
        total: state.contacts.length,
        filtered: filtered.length,
        noun: "kapcsolat",
        emptyText: "Még nincs kapcsolatüzenet a rendszerben.",
        filters: activeFilters
      }),
      activeFilters.length > 0
    );

    ui.contactRows.innerHTML = filtered.map((contact) => `
      <tr data-contact-id="${contact.id}" class="${String(contact.id) === String(state.selectedContactId) ? "is-selected" : ""}">
        <td>${escapeHtml(contact.name || "-")}</td>
        <td>${escapeHtml(contact.email || "-")}</td>
        <td>${escapeHtml(LANG_LABELS[contact.lang] || contact.lang || "-")}</td>
        <td><span class="status-pill" data-status="${escapeHtml(contact.status || "")}">${escapeHtml(STATUS_LABELS[contact.status] || contact.status || "-")}</span></td>
        <td>${escapeHtml(formatDateTime(contact.created_at))}</td>
      </tr>
    `).join("");

    ui.contactEmpty.classList.toggle("hidden", filtered.length > 0);

    const contact = getSelectedContact();
    ui.contactDetailEmpty.classList.toggle("hidden", !!contact);
    ui.contactDetailCard.classList.toggle("hidden", !contact);
    if (!contact) return;

    ui.contactDetailName.textContent = contact.name || "-";
    ui.contactDetailMeta.textContent = contact.email || "-";
    ui.contactDetailLang.textContent = LANG_LABELS[contact.lang] || contact.lang || "-";
    ui.contactDetailStatus.textContent = STATUS_LABELS[contact.status] || contact.status || "-";
    ui.contactDetailStatus.dataset.status = contact.status || "";
    ui.contactDetailCreated.textContent = formatDateTime(contact.created_at);
    ui.contactDetailSource.textContent = contact.source || "contact_form";
    ui.contactDetailMessage.textContent = contact.message || "-";
    ui.contactAdminNote.value = contact.admin_note || "";
    ui.contactReplyLink.href = `mailto:${contact.email || ""}?subject=${encodeURIComponent("B. Photography válasz")}`;
  }

  function renderGalleryUsers() {
    if (!ui.galleryUserList) return;
    const query = ui.galleryUserSearch.value.trim().toLowerCase();
    const filtered = state.galleryUsers.filter((user) => {
      const haystack = [user.email, user.note, user.lang].filter(Boolean).join(" ").toLowerCase();
      return !query || haystack.includes(query);
    });

    ui.galleryUserList.innerHTML = filtered.map((user) => `
      <article class="user-item ${user.id === state.selectedGalleryUserId ? "is-selected" : ""}" data-gallery-user-id="${escapeHtml(user.id)}">
        <h3 class="list-title">${escapeHtml(user.email || "-")}</h3>
        <p class="list-secondary">${escapeHtml(user.note || "Nincs megjegyzés")}</p>
        <p class="list-secondary">${escapeHtml(LANG_LABELS[user.lang] || user.lang || "-")} | Létrehozva: ${escapeHtml(formatDateTime(user.createdAt))}</p>
      </article>
    `).join("");

    ui.galleryUserEmpty.classList.toggle("hidden", filtered.length > 0);

    const user = getSelectedGalleryUser();
    ui.galleryDetailEmpty.classList.toggle("hidden", !!user);
    ui.galleryDetailCard.classList.toggle("hidden", !user);
    if (!user) return;

    ui.galleryDetailEmail.textContent = user.email || "-";
    ui.galleryDetailMeta.textContent = `Azonosító: ${user.id}`;
    ui.galleryDetailLang.textContent = LANG_LABELS[user.lang] || user.lang || "-";
    ui.galleryDetailLastSignIn.textContent = formatDateTime(user.lastSignInAt);
    ui.galleryDetailPasswordUpdated.textContent = formatDateTime(user.passwordUpdatedAt);
    ui.galleryDetailLangSelect.value = user.lang || "hu";
    ui.galleryDetailNote.value = user.note || "";

    ui.galleryMediaGrid.innerHTML = state.galleryFiles.map((file) => `
      <article class="media-card">
        <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}">
        <div class="media-card-body">
          <strong>${escapeHtml(file.name)}</strong>
          <p class="list-secondary">${escapeHtml(formatDateTime(file.createdAt))}</p>
          <div class="media-card-actions">
            <a class="ghost-btn inline-link" href="${escapeHtml(file.url)}" target="_blank" rel="noopener">Megnyitás</a>
            <button type="button" class="danger-btn" data-gallery-delete-path="${escapeHtml(file.path)}">Törlés</button>
          </div>
        </div>
      </article>
    `).join("");

    ui.galleryMediaEmpty.classList.toggle("hidden", state.galleryFiles.length > 0);
  }

  function renderPortfolio() {
    if (!ui.portfolioList) return;
    ui.portfolioList.innerHTML = state.portfolioItems.map((item) => `
      <article class="portfolio-item ${String(item.id) === String(state.selectedPortfolioId) ? "is-selected" : ""}" data-portfolio-id="${item.id}">
        ${item.url ? `<img class="portfolio-thumb" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title)}">` : ""}
        <div>
          <h3 class="list-title">${escapeHtml(item.title || "-")}</h3>
          <p class="list-secondary">${escapeHtml(PORTFOLIO_CATEGORY_LABELS[item.category] || item.category || "-")} | ${escapeHtml(LANG_LABELS[item.lang] || item.lang || "-")}</p>
          <p class="list-secondary">${escapeHtml(item.note || "-")}</p>
        </div>
      </article>
    `).join("");

    ui.portfolioEmpty.classList.toggle("hidden", state.portfolioItems.length > 0);
    if (ui.portfolioDeleteBtn) {
      ui.portfolioDeleteBtn.disabled = !getSelectedPortfolioItem();
    }
  }

  function getFilteredNewsletterSubscribers() {
    const query = ui.newsletterSearch?.value.trim().toLowerCase() || "";
    const status = ui.newsletterStatusFilter?.value || "all";
    const lang = ui.newsletterLangFilter?.value || "all";

    return state.newsletterSubscribers.filter((subscriber) => {
      const haystack = [subscriber.email, subscriber.source, subscriber.resend_contact_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (!query || haystack.includes(query))
        && (status === "all" || subscriber.status === status)
        && (lang === "all" || subscriber.lang === lang);
    });
  }

  function getNewsletterCampaignPresets(lang = "de") {
    if (lang === "hu") {
      return {
        "free-terms": {
          subject: "Szabad időpontok és új sorozatok | B. Photography",
          heading: "Új szabad időpontok és friss képi anyagok",
          intro: "Rövid frissítés a nyitott időpontokról, új sorozatokról és válogatott fotózási lehetőségekről.",
          body: "Átnéztem a következő hetek szabad időpontjait és az új képi anyagokat.\n\nHa most szeretnél fotózást tervezni, ez jó pillanat az egyeztetés elindítására.",
          ctaText: "Időpontot kérek",
          ctaUrl: "https://bphoto.at/hu/foglalas.html"
        },
        "portfolio-drop": {
          subject: "Új portfólió sorozat került fel | B. Photography",
          heading: "Friss sorozat a portfólióban",
          intro: "Új képi anyag került fel a portfólióba portré, páros és válogatott kreatív sorozatokkal.",
          body: "Ha szeretnéd látni, milyen irányban épülnek most a képi anyagok, nézd meg az új portfólió részt.\n\nHa hasonló stílusban gondolkodsz, közvetlenül is elindíthatjuk az egyeztetést.",
          ctaText: "Portfólió megnyitása",
          ctaUrl: "https://bphoto.at/hu/portfolio.html"
        },
        "mini-session": {
          subject: "Limitált időpontok nyíltak meg | B. Photography",
          heading: "Most nyílt néhány limitált időpont",
          intro: "Rövid, fókuszált fotózásokhoz új, korlátozott helyek nyíltak meg.",
          body: "Ha gyors, tiszta és mégis prémium képi anyagot szeretnél, ezek a limitált helyek erre ideálisak.\n\nHa érdekel, most érdemes jelezni, mielőtt betelnek.",
          ctaText: "Időpontot nézek",
          ctaUrl: "https://bphoto.at/hu/arak.html"
        }
      };
    }

    return {
      "free-terms": {
        subject: "Freie Termine und neue Serien | B. Photography",
        heading: "Neue freie Termine und frische Bildserien",
        intro: "Kurzes Update zu aktuellen Verfügbarkeiten, neuen Serien und ausgewählten Shooting-Möglichkeiten.",
        body: "Ich habe die nächsten freien Termine und neue Bildserien zusammengestellt.\n\nWenn du gerade ein Shooting planst, ist jetzt ein guter Moment für die erste Anfrage.",
        ctaText: "Termin anfragen",
        ctaUrl: "https://bphoto.at/de/termin.html"
      },
      "portfolio-drop": {
        subject: "Neue Portfolio-Serie online | B. Photography",
        heading: "Neue Arbeiten im Portfolio",
        intro: "Im Portfolio ist eine neue Serie online – mit Portraits, Paarbildern und ausgewählten Editorial-Motiven.",
        body: "Wenn du sehen möchtest, wie sich die aktuelle Bildsprache weiterentwickelt, wirf einen Blick in die neue Serie.\n\nWenn du genau in diese Richtung möchtest, können wir direkt die Anfrage starten.",
        ctaText: "Portfolio ansehen",
        ctaUrl: "https://bphoto.at/de/portfolio.html"
      },
      "mini-session": {
        subject: "Limitierte Termine sind offen | B. Photography",
        heading: "Kurzfristig sind einige limitierte Slots frei",
        intro: "Für kurze, klare und hochwertig geführte Shootings sind gerade wenige zusätzliche Termine offen.",
        body: "Wenn du ein kompaktes Shooting mit sauberer Führung und premium Bearbeitung suchst, ist das die passende Gelegenheit.\n\nWenn du Interesse hast, lohnt sich eine schnelle Anfrage.",
        ctaText: "Preise ansehen",
        ctaUrl: "https://bphoto.at/de/preise.html"
      }
    };
  }

  function applyNewsletterCampaignPreset(force = true) {
    if (!ui.newsletterCampaignPreset || !ui.newsletterCampaignLang) return;

    const lang = ui.newsletterCampaignLang.value === "hu" ? "hu" : "de";
    const presets = getNewsletterCampaignPresets(lang);
    const selectedPreset = presets[ui.newsletterCampaignPreset.value] || presets["free-terms"];

    const fields = [
      [ui.newsletterCampaignSubject, selectedPreset.subject],
      [ui.newsletterCampaignHeading, selectedPreset.heading],
      [ui.newsletterCampaignIntro, selectedPreset.intro],
      [ui.newsletterCampaignBody, selectedPreset.body],
      [ui.newsletterCampaignCtaText, selectedPreset.ctaText],
      [ui.newsletterCampaignCtaUrl, selectedPreset.ctaUrl]
    ];

    fields.forEach(([field, value]) => {
      if (!field) return;
      if (force || !String(field.value || "").trim()) {
        field.value = value;
      }
    });
  }

  function setNewsletterScheduleDefault(force = false) {
    if (!ui.newsletterCampaignScheduleAt) return;
    if (!force && ui.newsletterCampaignScheduleAt.value) return;

    const next = new Date();
    next.setHours(next.getHours() + 2, 0, 0, 0);
    const pad = (value) => String(value).padStart(2, "0");
    ui.newsletterCampaignScheduleAt.value = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
  }

  function getCampaignAudienceCount(lang) {
    return state.newsletterSubscribers.filter((subscriber) => subscriber.status === "confirmed" && subscriber.lang === lang).length;
  }

  function getFollowupAudienceCount(lang) {
    const now = Date.now();

    return state.newsletterSubscribers.filter((subscriber) => {
      if (subscriber.status !== "confirmed" || subscriber.lang !== lang || subscriber.followup_sent_at) {
        return false;
      }

      const sourceDate = subscriber.welcome_sent_at || subscriber.confirmed_at;
      if (!sourceDate) return false;

      return now - new Date(sourceDate).getTime() >= 1000 * 60 * 60 * 24 * 2;
    }).length;
  }

  function getNewsletterStatusCount(status) {
    return state.newsletterSubscribers.filter((subscriber) => subscriber.status === status).length;
  }

  function getNewsletterWelcomeCount() {
    return state.newsletterSubscribers.filter((subscriber) => Boolean(subscriber.welcome_sent_at)).length;
  }

  function renderNewsletter() {
    if (!ui.newsletterRows) return;

    const filtered = getFilteredNewsletterSubscribers();
    const query = ui.newsletterSearch?.value.trim().toLowerCase() || "";
    const status = ui.newsletterStatusFilter?.value || "all";
    const lang = ui.newsletterLangFilter?.value || "all";
    const activeFilters = [];
    if (query) activeFilters.push(`keresés: "${query}"`);
    if (status !== "all") activeFilters.push(`státusz: ${STATUS_LABELS[status] || status}`);
    if (lang !== "all") activeFilters.push(`nyelv: ${LANG_LABELS[lang] || lang}`);
    setFilterSummary(
      ui.newsletterFilterSummary,
      ui.newsletterResetFiltersBtn,
      buildFilterSummary({
        total: state.newsletterSubscribers.length,
        filtered: filtered.length,
        noun: "feliratkozó",
        emptyText: "Még nincs hírlevél feliratkozó.",
        filters: activeFilters
      }),
      activeFilters.length > 0
    );

    ui.newsletterRows.innerHTML = filtered.map((subscriber) => `
      <tr data-newsletter-id="${subscriber.id}" class="${String(subscriber.id) === String(state.selectedNewsletterId) ? "is-selected" : ""}">
        <td><strong>${escapeHtml(subscriber.email || "-")}</strong></td>
        <td>${escapeHtml(LANG_LABELS[subscriber.lang] || subscriber.lang || "-")}</td>
        <td><span class="status-pill" data-status="${escapeHtml(subscriber.status || "")}">${escapeHtml(STATUS_LABELS[subscriber.status] || subscriber.status || "-")}</span></td>
        <td>${escapeHtml(subscriber.source || "-")}</td>
        <td>${escapeHtml(formatDateTime(subscriber.created_at))}</td>
      </tr>
    `).join("");

    ui.newsletterEmpty.classList.toggle("hidden", filtered.length > 0);

    const subscriber = getSelectedNewsletterSubscriber();
    ui.newsletterDetailEmpty.classList.toggle("hidden", !!subscriber);
    ui.newsletterDetailCard.classList.toggle("hidden", !subscriber);
    if (!subscriber) return;

    ui.newsletterDetailEmail.textContent = subscriber.email || "-";
    ui.newsletterDetailMeta.textContent = `Feliratkozó #${subscriber.id}`;
    ui.newsletterDetailLang.textContent = LANG_LABELS[subscriber.lang] || subscriber.lang || "-";
    ui.newsletterDetailStatus.textContent = STATUS_LABELS[subscriber.status] || subscriber.status || "-";
    ui.newsletterDetailStatus.dataset.status = subscriber.status || "";
    ui.newsletterDetailSource.textContent = subscriber.source || "-";
    ui.newsletterDetailCreated.textContent = formatDateTime(subscriber.created_at);
    ui.newsletterDetailConfirmed.textContent = formatDateTime(subscriber.confirmed_at);
    ui.newsletterDetailLastSent.textContent = formatDateTime(subscriber.last_confirmation_sent_at);
    ui.newsletterDetailUnsubscribed.textContent = formatDateTime(subscriber.unsubscribed_at);
    ui.newsletterDetailWelcomeSent.textContent = formatDateTime(subscriber.welcome_sent_at);
    ui.newsletterDetailResendId.textContent = subscriber.resend_contact_id || "Még nincs összekötve Resend contacttal.";
    ui.newsletterEmailLink.href = `mailto:${subscriber.email || ""}`;
    ui.newsletterResendBtn.disabled = subscriber.status !== "pending";
  }

  function renderNewsletterCampaigns() {
    if (!ui.newsletterCampaignAudience || !ui.newsletterCampaignLogList || !ui.newsletterCampaignLogEmpty || !ui.newsletterCampaignLang) return;

    const lang = ui.newsletterCampaignLang.value === "hu" ? "hu" : "de";
    ui.newsletterCampaignAudience.textContent = `${getCampaignAudienceCount(lang)} megerősített feliratkozó`;

    if (ui.newsletterFollowupAudience) {
      ui.newsletterFollowupAudience.textContent = `${getFollowupAudienceCount(lang)} esedékes feliratkozó`;
    }

    if (ui.newsletterSummaryPending) {
      ui.newsletterSummaryPending.textContent = String(getNewsletterStatusCount("pending"));
    }

    if (ui.newsletterSummaryConfirmed) {
      ui.newsletterSummaryConfirmed.textContent = String(getNewsletterStatusCount("confirmed"));
    }

    if (ui.newsletterSummaryUnsubscribed) {
      ui.newsletterSummaryUnsubscribed.textContent = String(getNewsletterStatusCount("unsubscribed"));
    }

    if (ui.newsletterSummaryWelcome) {
      ui.newsletterSummaryWelcome.textContent = String(getNewsletterWelcomeCount());
    }

    const diagnostics = state.newsletterDiagnostics || {};
    if (ui.newsletterDiagnosticsSender) {
      ui.newsletterDiagnosticsSender.textContent = diagnostics.from || "Nincs aktív küldő konfigurálva";
    }

    if (ui.newsletterDiagnosticsSenderSource) {
      ui.newsletterDiagnosticsSenderSource.textContent = diagnostics.senderSource
        ? `A jelenlegi küldő innen jön: ${diagnostics.senderSource}.`
        : "A kampányküldéshez használt feladó.";
    }

    if (ui.newsletterDiagnosticsAudience) {
      ui.newsletterDiagnosticsAudience.textContent = diagnostics.resendAudienceConfigured ? "Bekötve" : "Nincs bekötve";
    }

    if (ui.newsletterDiagnosticsSite) {
      ui.newsletterDiagnosticsSite.textContent = diagnostics.publicSiteUrl || "https://bphoto.at";
    }

    if (ui.newsletterScheduledJobsList && ui.newsletterScheduledJobsEmpty) {
      ui.newsletterScheduledJobsList.innerHTML = state.newsletterScheduledJobs.map((job) => `
        <article class="campaign-log-item ${job.status === "scheduled" || job.status === "processing" ? "is-pending" : job.status === "failed" ? "is-error" : "is-done"}">
          <div class="campaign-log-head">
            <p class="panel-kicker">${escapeHtml((LANG_LABELS[job.lang] || job.lang || "-").toUpperCase())} · ${escapeHtml(job.status || "scheduled")}</p>
            <span class="status-pill" data-status="${escapeHtml(job.status === "failed" ? "cancelled" : job.status === "processing" ? "pending" : job.status === "scheduled" ? "pending" : "confirmed")}">${escapeHtml(job.status || "scheduled")}</span>
          </div>
          <h3>${escapeHtml(job.subject || "-")}</h3>
          <p class="campaign-log-meta">Ütemezve: ${escapeHtml(formatDateTime(job.scheduled_for))}</p>
          <div class="campaign-log-chips">
            <span class="campaign-feedback-chip">Preset: ${escapeHtml(job.preset_key || "egyedi")}</span>
            <span class="campaign-feedback-chip">Sikeres: ${escapeHtml(String(job.sent_count || 0))}</span>
            <span class="campaign-feedback-chip">Hiba: ${escapeHtml(String(job.failed_count || 0))}</span>
          </div>
          ${job.error_message ? `<p class="campaign-log-meta">${escapeHtml(job.error_message)}</p>` : ""}
        </article>
      `).join("");

      ui.newsletterScheduledJobsEmpty.classList.toggle("hidden", state.newsletterScheduledJobs.length > 0);
      ui.newsletterScheduledJobsList.classList.toggle("hidden", state.newsletterScheduledJobs.length === 0);
    }

    ui.newsletterCampaignLogList.innerHTML = state.newsletterCampaignLogs.map((log) => `
      <article class="campaign-log-item ${Number(log.failed_count || 0) > 0 && Number(log.sent_count || 0) === 0 ? "is-error" : "is-done"}">
        <div class="campaign-log-head">
          <p class="panel-kicker">${escapeHtml(log.type === "followup" ? "Follow-up" : "Kampány")} · ${escapeHtml((LANG_LABELS[log.lang] || log.lang || "-").toUpperCase())}</p>
          <span class="status-pill" data-status="${escapeHtml(Number(log.failed_count || 0) > 0 && Number(log.sent_count || 0) === 0 ? "cancelled" : "confirmed")}">${escapeHtml(Number(log.failed_count || 0) > 0 && Number(log.sent_count || 0) === 0 ? "hiba" : "kész")}</span>
        </div>
        <h3>${escapeHtml(log.subject || "-")}</h3>
        <p class="campaign-log-meta">${escapeHtml(formatDateTime(log.created_at))}</p>
        <div class="campaign-log-chips">
          <span class="campaign-feedback-chip">Címzett: ${escapeHtml(String(log.recipient_count || 0))}</span>
          <span class="campaign-feedback-chip">Sikeres: ${escapeHtml(String(log.sent_count || 0))}</span>
          <span class="campaign-feedback-chip">Hiba: ${escapeHtml(String(log.failed_count || 0))}</span>
        </div>
      </article>
    `).join("");

    ui.newsletterCampaignLogEmpty.classList.toggle("hidden", state.newsletterCampaignLogs.length > 0);
    ui.newsletterCampaignLogList.classList.toggle("hidden", state.newsletterCampaignLogs.length === 0);
  }

  function render() {
    updateStats();
    renderBookings();
    renderContacts();
    renderGalleryUsers();
    renderPortfolio();
    renderNewsletter();
    renderNewsletterCampaigns();
  }

  function updatePortfolioFormMode(mode = "create", item = null) {
    if (!ui.portfolioFormHeading || !ui.portfolioFormNote || !ui.portfolioSaveBtn || !ui.portfolioResetBtn) return;

    if (mode === "edit" && item) {
      ui.portfolioFormHeading.textContent = "Portfólió elem szerkesztése";
      ui.portfolioFormNote.textContent = "Most a kiválasztott portfólió elemet szerkeszted. Ha teljesen új képet akarsz feltölteni, válts vissza új elem módra.";
      ui.portfolioSaveBtn.textContent = "Módosítás mentése";
      ui.portfolioResetBtn.textContent = "Új elem mód";
    } else {
      ui.portfolioFormHeading.textContent = "Új elem feltöltése";
      ui.portfolioFormNote.textContent = "Új képhez töltsd ki az űrlapot, majd ments. A jobb oldali listából választva szerkesztő mód nyílik.";
      ui.portfolioSaveBtn.textContent = "Mentés a portfólióba";
      ui.portfolioResetBtn.textContent = "Új elem mód";
    }
  }

  function resetPortfolioForm() {
    if (!ui.portfolioItemId) return;
    state.selectedPortfolioId = null;
    ui.portfolioItemId.value = "";
    ui.portfolioItemPath.value = "";
    ui.portfolioCategory.value = "portre";
    ui.portfolioLang.value = "hu";
    ui.portfolioTitle.value = "";
    ui.portfolioNote.value = "";
    ui.portfolioSortOrder.value = "100";
    ui.portfolioUploadInput.value = "";
    updatePortfolioFormMode("create");
    renderPortfolio();
  }

  function populatePortfolioForm(item) {
    if (!ui.portfolioItemId) return;
    ui.portfolioItemId.value = item.id || "";
    ui.portfolioItemPath.value = item.path || "";
    ui.portfolioCategory.value = item.category || "portre";
    ui.portfolioLang.value = item.lang || "hu";
    ui.portfolioTitle.value = item.title || "";
    ui.portfolioNote.value = item.note || "";
    ui.portfolioSortOrder.value = String(item.sort_order || 100);
    ui.portfolioUploadInput.value = "";
    updatePortfolioFormMode("edit", item);
  }
  async function refreshAll(options = {}) {
    const silent = options.silent === true;
    const failures = [];
    const failureDetails = {};
    const localPreviewMissingFunctions = [];

    if (!silent) clearFeedback();

    setButtonBusy(ui.refreshAllBtn, "Betöltés...");
    try {
      const steps = [
        { label: "foglalások", run: loadBookings, enabled: true },
        { label: "kapcsolati üzenetek", run: loadContacts, enabled: true },
        { label: "galéria ügyfelek", run: loadGalleryUsers, enabled: true },
        { label: "portfólió elemek", run: loadPortfolioItems, enabled: true },
        { label: "hírlevél feliratkozók", run: loadNewsletterSubscribers, enabled: true },
        { label: "hírlevél kampányok", run: loadNewsletterCampaignLogs, enabled: shouldLoadNewsletterCampaignData() }
      ].filter((step) => step.enabled);

      const results = await Promise.allSettled(
        steps.map(async (step) => {
          await step.run();
          return step.label;
        })
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") return;

        const label = steps[index].label;
        const error = result.reason;
        console.error(error);
        failures.push(label);
        failureDetails[label] = String(error?.message || error).slice(0, 260);
        if (String(error?.message || "").includes("Netlify funkciók ebben a helyi előnézetben")) {
          localPreviewMissingFunctions.push(label);
        }
      });

      if (!shouldLoadNewsletterCampaignData()) {
        state.newsletterCampaignLogs = [];
        state.newsletterScheduledJobs = [];
        state.newsletterDiagnostics = {};
      }

      if (shouldLoadGalleryMedia()) {
        try {
          await loadGalleryFiles(state.selectedGalleryUserId);
        } catch (error) {
          console.error(error);
          failures.push("galéria fájlok");
          failureDetails["galéria fájlok"] = String(error?.message || error).slice(0, 260);
          state.galleryFiles = [];
          if (String(error.message || "").includes("Netlify funkciók ebben a helyi előnézetben")) {
            localPreviewMissingFunctions.push("galéria fájlok");
          }
        }
      } else {
        state.galleryFiles = [];
      }

      updateStats();
      render();

      if (!silent) {
        if (failures.length && localPreviewMissingFunctions.length === failures.length) {
          showFeedback("Ebben a helyi 5500-as előnézetben a Netlify funkciók nem futnak. A foglalások látszanak, a kapcsolatok, galéria és portfólió admin Netlify Dev vagy éles domain alatt lesz teljes.", "success");
        } else if (failures.length) {
          const details = failures
            .map((label) => failureDetails[label] ? `${label}: ${failureDetails[label]}` : label)
            .join(" | ");
          showFeedback(`Részben sikerült a frissítés. ${details}`, "error");
        } else {
          showFeedback("Az admin adatok frissültek.");
        }
      }
    } finally {
      resetButtonBusy(ui.refreshAllBtn);
    }
  }

  async function updateBookingStatus(nextStatus) {
    const booking = getSelectedBooking();
    if (!booking) return;

    const { error } = await supabase.from("bookings_v2").update({ status: nextStatus }).eq("id", booking.id);
    if (error) throw error;

    booking.status = nextStatus;
    renderBookings();
    updateStats();
  }

  async function saveContact(statusOverride = null) {
    const contact = getSelectedContact();
    if (!contact) return;

    const nextStatus = statusOverride || contact.status || "new";
    const adminNote = ui.contactAdminNote.value.trim();

    await callAdmin("/.netlify/functions/admin-contact-messages", {
      method: "POST",
      body: JSON.stringify({ id: contact.id, status: nextStatus, adminNote })
    });

    contact.status = nextStatus;
    contact.admin_note = adminNote;
    renderContacts();
    updateStats();
  }

  async function createGalleryUser(email, lang, note) {
    const data = await callAdmin("/.netlify/functions/admin-gallery-users", {
      method: "POST",
      body: JSON.stringify({ action: "create", email, lang, note })
    });

    await loadGalleryUsers();
    state.selectedGalleryUserId = data.user?.id || state.selectedGalleryUserId;
    await loadGalleryFiles(state.selectedGalleryUserId);
    renderGalleryUsers();
    updateStats();
    setActiveTab("gallery");
    return data.user;
  }

  async function createGalleryFromBooking() {
    const booking = getSelectedBooking();
    if (!booking) return;

    const noteParts = [
      `Foglalás #${booking.id}`,
      booking.package ? `Csomag: ${booking.package}` : "",
      booking.booking_date ? `Dátum: ${booking.booking_date}` : "",
      booking.message || ""
    ].filter(Boolean);

    await createGalleryUser(booking.email, booking.lang, noteParts.join(" | "));
    await updateBookingStatus("confirmed");
    showFeedback("A foglaláshoz galériafiók készült, a jelszó emailben kiküldve.");
  }

  async function createGalleryFromContact() {
    const contact = getSelectedContact();
    if (!contact) return;

    const noteParts = [
      `Kapcsolat #${contact.id}`,
      contact.admin_note || "",
      contact.message || ""
    ].filter(Boolean);

    await createGalleryUser(contact.email, contact.lang, noteParts.join(" | "));
    await saveContact("converted");
    showFeedback("A kapcsolatfelvételhez galériafiók készült, a jelszó emailben kiküldve.");
  }

  async function saveGalleryMetadata() {
    const user = getSelectedGalleryUser();
    if (!user) return;

    const data = await callAdmin("/.netlify/functions/admin-gallery-users", {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        userId: user.id,
        lang: ui.galleryDetailLangSelect.value,
        note: ui.galleryDetailNote.value.trim()
      })
    });

    const index = state.galleryUsers.findIndex((item) => item.id === user.id);
    if (index >= 0 && data.user) {
      state.galleryUsers[index] = data.user;
    }

    renderGalleryUsers();
    showFeedback("A galéria ügyfél adatai elmentve.");
  }

  async function resetGalleryPassword() {
    const user = getSelectedGalleryUser();
    if (!user) return;

    await callAdmin("/.netlify/functions/admin-gallery-users", {
      method: "POST",
      body: JSON.stringify({ action: "reset_password", userId: user.id })
    });

    await loadGalleryUsers();
    renderGalleryUsers();
    showFeedback("Új ideiglenes jelszó készült és kiküldtem emailben.");
  }

  async function uploadGalleryFiles() {
    const user = getSelectedGalleryUser();
    const files = Array.from(ui.galleryUploadInput.files || []);

    if (!user) throw new Error("Előbb válassz ki egy galéria ügyfelet.");
    if (!files.length) throw new Error("Válassz ki legalább egy képfájlt a feltöltéshez.");

    const data = await callAdmin("/.netlify/functions/admin-gallery-media", {
      method: "POST",
      body: JSON.stringify({
        action: "prepare_upload",
        userId: user.id,
        files: files.map((file) => ({ name: file.name }))
      })
    });

    const uploads = data.uploads || [];
    if (uploads.length !== files.length) {
      throw new Error("Nem sikerült előkészíteni az összes galéria feltöltést.");
    }

    for (let index = 0; index < uploads.length; index += 1) {
      const upload = uploads[index];
      const file = files[index];
      const { error } = await supabase.storage.from("client-galleries").uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
    }

    ui.galleryUploadInput.value = "";
    await loadGalleryFiles(user.id);
    renderGalleryUsers();
    showFeedback("A galéria képei feltöltve.");
  }

  async function deleteGalleryFile(path) {
    const user = getSelectedGalleryUser();
    if (!user || !path) return;

    await callAdmin("/.netlify/functions/admin-gallery-media", {
      method: "POST",
      body: JSON.stringify({ action: "delete", userId: user.id, path })
    });

    await loadGalleryFiles(user.id);
    renderGalleryUsers();
    showFeedback("A galéria kép törölve.");
  }

  async function savePortfolioItem() {
    const title = ui.portfolioTitle.value.trim();
    const note = ui.portfolioNote.value.trim();
    const file = ui.portfolioUploadInput.files[0] || null;
    const existingPath = ui.portfolioItemPath.value.trim();
    const isEdit = Boolean(ui.portfolioItemId.value);

    if (!title || !note) {
      throw new Error("A portfólió elemhez cím és rövid leírás is kell.");
    }

    let nextPath = existingPath;

    if (file) {
      const prep = await callAdmin("/.netlify/functions/admin-portfolio-media", {
        method: "POST",
        body: JSON.stringify({ action: "prepare_upload", category: ui.portfolioCategory.value, fileName: file.name })
      });

      const upload = prep.upload;
      if (!upload?.path || !upload?.token) {
        throw new Error("A portfólió kép feltöltése nem lett előkészítve.");
      }

      const { error } = await supabase.storage.from("portfolio-media").uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
      nextPath = upload.path;
    }

    if (!nextPath) {
      throw new Error("Új portfólió elemnél képet is fel kell töltened.");
    }

    const id = ui.portfolioItemId.value ? Number(ui.portfolioItemId.value) : undefined;
    const data = await callAdmin("/.netlify/functions/admin-portfolio-media", {
      method: "POST",
      body: JSON.stringify({
        action: "save",
        id,
        previousPath: existingPath,
        path: nextPath,
        category: ui.portfolioCategory.value,
        title,
        note,
        lang: ui.portfolioLang.value,
        sortOrder: Number(ui.portfolioSortOrder.value || 100),
        isActive: true
      })
    });

    state.portfolioItems = data.items || [];
    ui.portfolioUploadInput.value = "";

    if (isEdit) {
      state.selectedPortfolioId = id || null;
      ui.portfolioItemPath.value = nextPath;
      renderPortfolio();

      if (state.selectedPortfolioId) {
        const currentItem = getSelectedPortfolioItem();
        if (currentItem) populatePortfolioForm(currentItem);
      }
    } else {
      resetPortfolioForm();
    }

    updateStats();
    showFeedback(isEdit ? "A portfólió elem frissítve." : "Az új portfólió elem mentve. Az űrlap visszaállt új feltöltés módba.");
  }

  async function deletePortfolioItem() {
    const item = getSelectedPortfolioItem();
    if (!item) return;

    if (!window.confirm("Biztosan törlöd a kiválasztott portfólió elemet?")) {
      return;
    }

    const data = await callAdmin("/.netlify/functions/admin-portfolio-media", {
      method: "POST",
      body: JSON.stringify({ action: "delete", id: item.id, path: item.path })
    });

    state.portfolioItems = data.items || [];
    resetPortfolioForm();
    updateStats();
    renderPortfolio();
    showFeedback("A portfólió elem törölve.");
  }

  async function resendNewsletterConfirmation() {
    const subscriber = getSelectedNewsletterSubscriber();
    if (!subscriber) return;

    const data = await callAdmin("/.netlify/functions/admin-newsletter-subscribers", {
      method: "POST",
      body: JSON.stringify({ action: "resend_confirmation", id: subscriber.id })
    });

    subscriber.status = "pending";
    subscriber.last_confirmation_sent_at = data.sentAt || new Date().toISOString();
    renderNewsletter();
    showFeedback("A megerősítő levél újraküldve.");
  }

  function getNewsletterCampaignPayload() {
    const lang = ui.newsletterCampaignLang?.value === "hu" ? "hu" : "de";
    return {
      lang,
      presetKey: ui.newsletterCampaignPreset?.value || "",
      subject: ui.newsletterCampaignSubject?.value.trim() || "",
      heading: ui.newsletterCampaignHeading?.value.trim() || "",
      intro: ui.newsletterCampaignIntro?.value.trim() || "",
      body: ui.newsletterCampaignBody?.value.trim() || "",
      ctaText: ui.newsletterCampaignCtaText?.value.trim() || "",
      ctaUrl: ui.newsletterCampaignCtaUrl?.value.trim() || ""
    };
  }

  async function sendNewsletterTest() {
    const testEmail = ui.newsletterCampaignTestEmail?.value.trim() || "";
    if (!testEmail) {
      throw new Error("Adj meg egy teszt email címet.");
    }

    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", {
      method: "POST",
      body: JSON.stringify({
        action: "send_test",
        testEmail,
        ...getNewsletterCampaignPayload()
      })
    });

    const message = data.message || "A teszt hírlevél elküldve.";
    showFeedback(message);
    setNewsletterCampaignFeedback({
      title: "Tesztküldés sikeres",
      eyebrow: LANG_LABELS[getNewsletterCampaignPayload().lang] || "Mind",
      message,
      meta: [
        `Teszt cím: ${testEmail}`,
        data.sender ? `Küldő: ${data.sender}` : "",
        data.senderSource ? `Forrás: ${data.senderSource}` : ""
      ]
    }, "success");
  }

  async function sendNewsletterCampaign() {
    const payload = getNewsletterCampaignPayload();
    const recipientCount = getCampaignAudienceCount(payload.lang);

    if (!recipientCount) {
      throw new Error("Nincs megerősített feliratkozó ehhez a nyelvhez.");
    }

    if (!window.confirm(`Biztosan elküldöd ezt a kampányt ${recipientCount} feliratkozónak?`)) {
      return;
    }

    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", {
      method: "POST",
      body: JSON.stringify({
        action: "send_campaign",
        ...payload
      })
    });

    await loadNewsletterCampaignLogs();
    renderNewsletterCampaigns();
    const message = data.message || `Kampány elküldve. Sikeres: ${data.sentCount || 0}, hiba: ${data.failedCount || 0}.`;
    showFeedback(message);
    setNewsletterCampaignFeedback({
      title: (data.failedCount || 0) > 0 ? "Kampány részben sikerült" : "Kampány elküldve",
      eyebrow: LANG_LABELS[payload.lang] || payload.lang,
      message,
      meta: [
        `Címzett: ${data.recipientCount || recipientCount}`,
        `Sikeres: ${data.sentCount || 0}`,
        `Hiba: ${data.failedCount || 0}`,
        data.sender ? `Küldő: ${data.sender}` : "",
        data.senderSource ? `Forrás: ${data.senderSource}` : ""
      ]
    }, (data.failedCount || 0) > 0 ? "warning" : "success");
  }

  async function scheduleNewsletterCampaign() {
    const payload = getNewsletterCampaignPayload();
    const scheduledFor = ui.newsletterCampaignScheduleAt?.value || "";

    if (!scheduledFor) {
      throw new Error("Adj meg ütemezett időpontot.");
    }

    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", {
      method: "POST",
      body: JSON.stringify({
        action: "schedule_campaign",
        scheduledFor,
        ...payload
      })
    });

    await loadNewsletterCampaignLogs();
    renderNewsletterCampaigns();
    setNewsletterScheduleDefault(true);
    const message = `A kampány időzítve: ${formatDateTime(data.job?.scheduled_for)}`;
    showFeedback(message);
    setNewsletterCampaignFeedback({
      title: "Kampány időzítve",
      eyebrow: LANG_LABELS[payload.lang] || payload.lang,
      message,
      meta: [
        `Időpont: ${formatDateTime(data.job?.scheduled_for)}`,
        `Tárgy: ${payload.subject}`
      ]
    }, "success");
  }

  async function runScheduledNewsletterJobs() {
    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", {
      method: "POST",
      body: JSON.stringify({ action: "run_scheduled" })
    });

    await loadNewsletterSubscribers();
    await loadNewsletterCampaignLogs();
    render();
    const message = `Az esedékes kampányok futtatása kész. Feldolgozott: ${data.processedCount || 0}.`;
    showFeedback(message);
    setNewsletterCampaignFeedback({
      title: "Időzített küldések lefutottak",
      message,
      meta: [`Feldolgozott feladatok: ${data.processedCount || 0}`]
    }, "success");
  }

  async function sendNewsletterFollowup() {
    const lang = ui.newsletterCampaignLang?.value === "hu" ? "hu" : "de";
    const recipientCount = getFollowupAudienceCount(lang);

    if (!recipientCount) {
      throw new Error("Nincs esedékes follow-up küldés ehhez a nyelvhez.");
    }

    const data = await callAdmin("/.netlify/functions/admin-newsletter-campaigns", {
      method: "POST",
      body: JSON.stringify({
        action: "send_followup",
        lang
      })
    });

    await loadNewsletterSubscribers();
    await loadNewsletterCampaignLogs();
    render();
    const message = data.message || `Follow-up küldés kész. Sikeres: ${data.sentCount || 0}, hiba: ${data.failedCount || 0}.`;
    showFeedback(message);
    setNewsletterCampaignFeedback({
      title: (data.failedCount || 0) > 0 ? "Follow-up részben sikerült" : "Follow-up elküldve",
      eyebrow: LANG_LABELS[lang] || lang,
      message,
      meta: [
        `Címzett: ${data.recipientCount || recipientCount}`,
        `Sikeres: ${data.sentCount || 0}`,
        `Hiba: ${data.failedCount || 0}`,
        data.sender ? `Küldő: ${data.sender}` : "",
        data.senderSource ? `Forrás: ${data.senderSource}` : ""
      ]
    }, (data.failedCount || 0) > 0 ? "warning" : "success");
  }

  function exportNewsletterCsv() {
    const rows = getFilteredNewsletterSubscribers();
    if (!rows.length) {
      showFeedback("Nincs exportálható feliratkozó a jelenlegi szűrőkkel.", "error");
      return;
    }

    const header = [
      "Email",
      "Nyelv",
      "Státusz",
      "Forrás",
      "Feliratkozott",
      "Megerősítve",
      "Leiratkozva",
      "Welcome email kiküldve",
      "Utolsó megerősítő levél",
      "Resend contact ID"
    ];

    const csvRows = rows.map((subscriber) => [
      subscriber.email || "",
      LANG_LABELS[subscriber.lang] || subscriber.lang || "",
      STATUS_LABELS[subscriber.status] || subscriber.status || "",
      subscriber.source || "",
      formatDateTime(subscriber.created_at),
      formatDateTime(subscriber.confirmed_at),
      formatDateTime(subscriber.unsubscribed_at),
      formatDateTime(subscriber.welcome_sent_at),
      formatDateTime(subscriber.last_confirmation_sent_at),
      subscriber.resend_contact_id || ""
    ]);

    const csv = [header, ...csvRows]
      .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

    link.href = url;
    link.download = `newsletter-feliratkozok-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showFeedback("A hírlevél CSV export elkészült.");
  }

  function bindEvents() {
    ui.tabButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });

    [ui.bookingSearch, ui.bookingStatusFilter, ui.bookingLangFilter].filter(Boolean).forEach((element) => {
      element.addEventListener("input", renderBookings);
      element.addEventListener("change", renderBookings);
    });
    ui.bookingResetFiltersBtn?.addEventListener("click", resetBookingFilters);

    [ui.contactSearch, ui.contactStatusFilter].filter(Boolean).forEach((element) => {
      element.addEventListener("input", renderContacts);
      element.addEventListener("change", renderContacts);
    });
    ui.contactResetFiltersBtn?.addEventListener("click", resetContactFilters);

    [ui.newsletterSearch, ui.newsletterStatusFilter, ui.newsletterLangFilter].filter(Boolean).forEach((element) => {
      element.addEventListener("input", renderNewsletter);
      element.addEventListener("change", renderNewsletter);
    });
    ui.newsletterResetFiltersBtn?.addEventListener("click", resetNewsletterFilters);

    ui.newsletterCampaignLang?.addEventListener("change", () => {
      applyNewsletterCampaignPreset(true);
      renderNewsletterCampaigns();
      setNewsletterCampaignFeedback();
    });

    ui.newsletterCampaignPreset?.addEventListener("change", () => {
      setNewsletterCampaignFeedback();
    });

    ui.galleryUserSearch?.addEventListener("input", renderGalleryUsers);

    ui.bookingRows?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-booking-id]");
      if (!row) return;
      state.selectedBookingId = row.dataset.bookingId;
      renderBookings();
    });

    ui.contactRows?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-contact-id]");
      if (!row) return;
      state.selectedContactId = row.dataset.contactId;
      renderContacts();
    });

    ui.newsletterRows?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-newsletter-id]");
      if (!row) return;
      state.selectedNewsletterId = row.dataset.newsletterId;
      renderNewsletter();
    });

    ui.galleryUserList?.addEventListener("click", async (event) => {
      const card = event.target.closest("[data-gallery-user-id]");
      if (!card) return;
      state.selectedGalleryUserId = card.dataset.galleryUserId;
      await loadGalleryFiles(state.selectedGalleryUserId);
      renderGalleryUsers();
    });

    ui.galleryMediaGrid?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-gallery-delete-path]");
      if (!button) return;
      if (!window.confirm("Biztosan törlöd ezt a galéria képet?")) return;

      try {
        await deleteGalleryFile(button.dataset.galleryDeletePath);
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült törölni a galéria képet.", "error");
      }
    });

    ui.portfolioList?.addEventListener("click", (event) => {
      const card = event.target.closest("[data-portfolio-id]");
      if (!card) return;
      state.selectedPortfolioId = card.dataset.portfolioId;
      const item = getSelectedPortfolioItem();
      if (item) populatePortfolioForm(item);
      renderPortfolio();
    });

    ui.bookingConfirmBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.bookingConfirmBtn, "Mentés...", () => updateBookingStatus("confirmed"));
        showFeedback("A foglalás megerősítve.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült módosítani a foglalást.", "error");
      }
    });

    ui.bookingPendingBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.bookingPendingBtn, "Mentés...", () => updateBookingStatus("pending"));
        showFeedback("A foglalás visszaállítva függőbe.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült módosítani a foglalást.", "error");
      }
    });

    ui.bookingCancelBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.bookingCancelBtn, "Mentés...", () => updateBookingStatus("cancelled"));
        showFeedback("A foglalás lemondottra állítva.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült módosítani a foglalást.", "error");
      }
    });

    ui.bookingCreateGalleryBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.bookingCreateGalleryBtn, "Létrehozás...", () => createGalleryFromBooking());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült galériafiókot létrehozni a foglaláshoz.", "error");
      }
    });

    ui.contactSaveBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.contactSaveBtn, "Mentés...", () => saveContact());
        showFeedback("A kapcsolatfelvétel megjegyzése elmentve.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült menteni a kapcsolatfelvételt.", "error");
      }
    });

    ui.contactReviewedBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.contactReviewedBtn, "Mentés...", () => saveContact("reviewed"));
        showFeedback("A kapcsolatfelvétel feldolgozottnak jelölve.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült menteni a kapcsolatfelvételt.", "error");
      }
    });

    ui.contactCreateGalleryBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.contactCreateGalleryBtn, "Létrehozás...", () => createGalleryFromContact());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült galériafiókot létrehozni a kapcsolatfelvételhez.", "error");
      }
    });

    ui.galleryCreateBtn?.addEventListener("click", async () => {
      const email = ui.galleryCreateEmail.value.trim();
      const lang = ui.galleryCreateLang.value;
      const note = ui.galleryCreateNote.value.trim();

      if (!email) {
        showFeedback("A galériafiók létrehozásához email cím kell.", "error");
        return;
      }

      try {
        await runBusyAction(ui.galleryCreateBtn, "Létrehozás...", () => createGalleryUser(email, lang, note));
        ui.galleryCreateEmail.value = "";
        ui.galleryCreateNote.value = "";
        showFeedback("A galériafiók elkészült és a jelszó email kiküldve.");
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült létrehozni a galériafiókot.", "error");
      }
    });

    ui.gallerySaveMetaBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.gallerySaveMetaBtn, "Mentés...", () => saveGalleryMetadata());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült menteni a galéria ügyfelet.", "error");
      }
    });

    ui.galleryResetPasswordBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.galleryResetPasswordBtn, "Küldés...", () => resetGalleryPassword());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült új jelszót küldeni.", "error");
      }
    });

    ui.galleryUploadBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.galleryUploadBtn, "Feltöltés...", () => uploadGalleryFiles());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült feltölteni a galéria képeket.", "error");
      }
    });

    ui.portfolioSaveBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.portfolioSaveBtn, "Mentés...", () => savePortfolioItem());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült menteni a portfólió elemet.", "error");
      }
    });

    ui.portfolioResetBtn?.addEventListener("click", resetPortfolioForm);

    ui.portfolioDeleteBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.portfolioDeleteBtn, "Törlés...", () => deletePortfolioItem());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült törölni a portfólió elemet.", "error");
      }
    });

    ui.newsletterResendBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterResendBtn, "Küldés...", () => resendNewsletterConfirmation());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült újraküldeni a megerősítő levelet.", "error");
      }
    });

    ui.newsletterExportBtn?.addEventListener("click", exportNewsletterCsv);

    ui.newsletterCampaignPresetBtn?.addEventListener("click", () => {
      applyNewsletterCampaignPreset(true);
      setNewsletterCampaignFeedback();
    });

    ui.newsletterCampaignTestBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterCampaignTestBtn, "Tesztküldés...", () => sendNewsletterTest());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült elküldeni a teszt hírlevelet.", "error");
        setNewsletterCampaignFeedback(error.message || "Nem sikerült elküldeni a teszt hírlevelet.", "error");
      }
    });

    ui.newsletterCampaignSendBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterCampaignSendBtn, "Küldés...", () => sendNewsletterCampaign());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült elküldeni a kampányt.", "error");
        setNewsletterCampaignFeedback(error.message || "Nem sikerült elküldeni a kampányt.", "error");
      }
    });

    ui.newsletterCampaignScheduleBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterCampaignScheduleBtn, "Időzítés...", () => scheduleNewsletterCampaign());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült időzíteni a kampányt.", "error");
        setNewsletterCampaignFeedback(error.message || "Nem sikerült időzíteni a kampányt.", "error");
      }
    });

    ui.newsletterCampaignRunScheduledBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterCampaignRunScheduledBtn, "Futtatás...", () => runScheduledNewsletterJobs());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült futtatni az esedékes kampányokat.", "error");
        setNewsletterCampaignFeedback(error.message || "Nem sikerült futtatni az esedékes kampányokat.", "error");
      }
    });

    ui.newsletterFollowupSendBtn?.addEventListener("click", async () => {
      try {
        await runBusyAction(ui.newsletterFollowupSendBtn, "Küldés...", () => sendNewsletterFollowup());
      } catch (error) {
        console.error(error);
        showFeedback(error.message || "Nem sikerült elküldeni a follow-up levelet.", "error");
        setNewsletterCampaignFeedback(error.message || "Nem sikerült elküldeni a follow-up levelet.", "error");
      }
    });

    ui.refreshAllBtn.addEventListener("click", async () => {
      await refreshAll();
    });

    ui.logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  bindEvents();
  applyNewsletterCampaignPreset(true);
  setNewsletterScheduleDefault(true);
  setActiveTab("bookings");
  await refreshAll();
  updatePortfolioFormMode("create");
});
