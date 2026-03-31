const ROUTE_MAP = {
  hu: {
    index: 'index.html',
    portfolio: 'portfolio.html',
    drone: 'dron.html',
    pricing: 'arak.html',
    booking: 'foglalas.html',
    contact: 'kapcsolat.html',
    galleryLogin: 'galeria-login.html',
    gallery: 'galeria.html',
    galleryPassword: 'galeria-jelszo.html',
    newsletterConfirm: 'hirlevel-megerosites.html',
    newsletterUnsubscribe: 'hirlevel-leiratkozas.html',
    privacy: 'privacy.html',
    terms: 'aszf.html',
    imprint: 'impresszum.html',
    thanksBooking: 'koszonjuk-foglalas.html',
    thanksContact: 'koszonjuk-kapcsolat.html'
  },
  de: {
    index: 'index.html',
    portfolio: 'portfolio.html',
    drone: 'drohne.html',
    pricing: 'preise.html',
    booking: 'termin.html',
    contact: 'kontakt.html',
    galleryLogin: 'galeria-login.html',
    gallery: 'galeria.html',
    galleryPassword: 'galeria-jelszo.html',
    newsletterConfirm: 'newsletter-bestaetigen.html',
    newsletterUnsubscribe: 'newsletter-abmelden.html',
    privacy: 'datenschutz.html',
    terms: 'agb.html',
    imprint: 'impressum.html',
    thanksBooking: 'danke-termin.html',
    thanksContact: 'danke-kontakt.html'
  },
  en: {
    index: 'index.html',
    portfolio: 'portfolio.html',
    drone: 'drone.html',
    pricing: 'pricing.html',
    booking: 'booking.html',
    contact: 'contact.html',
    galleryLogin: 'gallery-login.html',
    gallery: 'gallery.html',
    galleryPassword: 'gallery-password.html',
    newsletterConfirm: 'newsletter-confirm.html',
    newsletterUnsubscribe: 'newsletter-unsubscribe.html',
    privacy: 'privacy.html',
    terms: 'terms.html',
    imprint: 'imprint.html',
    thanksBooking: 'thank-you-booking.html',
    thanksContact: 'thank-you-contact.html'
  }
};

const FILE_TO_KEY = Object.entries(ROUTE_MAP).reduce((acc, [, pages]) => {
  Object.entries(pages).forEach(([key, file]) => {
    acc[file] = key;
  });
  return acc;
}, {});

const HEADER_COPY = {
  hu: {
    home: 'Kezdőlap',
    portfolio: 'Portfólió',
    drone: 'Drón',
    pricing: 'Árak',
    booking: 'Foglalás',
    contact: 'Kapcsolat',
    gallery: 'Online galéria',
    bookingCta: 'Időpontot kérek',
    ariaHome: 'B. Photography kezdőlap',
    ariaNav: 'Fő navigáció',
    ariaLang: 'Nyelvváltás',
    ariaOpen: 'Menü megnyitása',
    ariaClose: 'Menü bezárása',
    mobileNav: 'Mobil navigáció',
    response: '24 órán belüli válasz',
    area: 'Bécs és környéke',
    delivery: 'Online galéria'
  },
  de: {
    home: 'Startseite',
    portfolio: 'Portfolio',
    drone: 'Drohne',
    pricing: 'Preise',
    booking: 'Termin',
    contact: 'Kontakt',
    gallery: 'Online Galerie',
    bookingCta: 'Termin anfragen',
    ariaHome: 'B. Photography Startseite',
    ariaNav: 'Hauptnavigation',
    ariaLang: 'Sprachwechsel',
    ariaOpen: 'Menü öffnen',
    ariaClose: 'Menü schließen',
    mobileNav: 'Mobile Navigation',
    response: 'Antwort innerhalb von 24h',
    area: 'Wien und Umgebung',
    delivery: 'Online-Galerie'
  },
  en: {
    home: 'Home',
    portfolio: 'Portfolio',
    drone: 'Drone',
    pricing: 'Pricing',
    booking: 'Booking',
    contact: 'Contact',
    gallery: 'Online Gallery',
    bookingCta: 'Book a shoot',
    ariaHome: 'B. Photography homepage',
    ariaNav: 'Main navigation',
    ariaLang: 'Language switcher',
    ariaOpen: 'Open menu',
    ariaClose: 'Close menu',
    mobileNav: 'Mobile navigation',
    response: 'Reply within 24h',
    area: 'Vienna and surrounding area',
    delivery: 'Online gallery'
  }
};

function getRouteInfo() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const lang = ['hu', 'de', 'en'].includes(parts[0]) ? parts[0] : 'de';
  const page = ['hu', 'de', 'en'].includes(parts[0]) ? (parts[1] || 'index.html') : (parts[0] || 'index.html');
  return { lang, page };
}

function resolvePageKey(page) {
  return FILE_TO_KEY[page] || 'index';
}

function getPageHref(lang, key) {
  return `/${lang}/${ROUTE_MAP[lang][key] || ROUTE_MAP[lang].index}`;
}

function switchLanguage(targetLang) {
  const { lang, page } = getRouteInfo();
  if (targetLang === lang) return;
  const pageKey = resolvePageKey(page);
  window.location.href = getPageHref(targetLang, pageKey);
}

function buildHeaderMarkup(lang) {
  const copy = HEADER_COPY[lang] || HEADER_COPY.de;
  const current = getRouteInfo();
  const pageKey = resolvePageKey(current.page);
  const isActive = (key) => (pageKey === key ? 'active' : '');

  return `
<header class="site-header">
  <div class="header-inner">
    <div class="logo">
      <a href="${getPageHref(lang, 'index')}" aria-label="${copy.ariaHome}">
        <span class="logo-main">B.</span>
        <span class="logo-sub">PHOTOGRAPHY</span>
      </a>
    </div>

    <nav class="main-nav" aria-label="${copy.ariaNav}">
      <a class="${isActive('index')}" href="${getPageHref(lang, 'index')}">${copy.home}</a>
      <a class="${isActive('portfolio')}" href="${getPageHref(lang, 'portfolio')}">${copy.portfolio}</a>
      <a class="${isActive('drone')}" href="${getPageHref(lang, 'drone')}">${copy.drone}</a>
      <a class="${isActive('pricing')}" href="${getPageHref(lang, 'pricing')}">${copy.pricing}</a>
      <a class="${isActive('contact')}" href="${getPageHref(lang, 'contact')}">${copy.contact}</a>
      <a class="${isActive('galleryLogin') || isActive('gallery') ? 'active' : ''}" href="${getPageHref(lang, 'galleryLogin')}">${copy.gallery}</a>
    </nav>

    <div class="header-actions">
      <div class="lang-switch" aria-label="${copy.ariaLang}">
        <button type="button" data-lang="hu" class="${lang === 'hu' ? 'active' : ''}">HU</button>
        <span aria-hidden="true">|</span>
        <button type="button" data-lang="de" class="${lang === 'de' ? 'active' : ''}">DE</button>
        <span aria-hidden="true">|</span>
        <button type="button" data-lang="en" class="${lang === 'en' ? 'active' : ''}">EN</button>
      </div>

      <a class="nav-cta" href="${getPageHref(lang, 'booking')}">${copy.bookingCta}</a>

      <button class="menu-toggle" type="button" aria-label="${copy.ariaOpen}" aria-controls="mobileMenu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-menu-backdrop" id="mobileMenuBackdrop" hidden style="display:none;visibility:hidden;opacity:0;pointer-events:none;"></div>

<aside class="mobile-menu" id="mobileMenu" aria-hidden="true" hidden style="display:none;visibility:hidden;opacity:0;pointer-events:none;">
  <div class="mobile-menu-panel">
    <div class="mobile-menu-top">
      <div class="mobile-menu-brand">
        <span class="logo-main">B.</span>
        <span class="logo-sub">PHOTOGRAPHY</span>
      </div>
      <button class="mobile-menu-close" type="button" aria-label="${copy.ariaClose}">×</button>
    </div>

    <div class="lang-switch mobile-lang-switch" aria-label="${copy.ariaLang}">
      <button type="button" data-lang="hu" class="${lang === 'hu' ? 'active' : ''}">HU</button>
      <span aria-hidden="true">|</span>
      <button type="button" data-lang="de" class="${lang === 'de' ? 'active' : ''}">DE</button>
      <span aria-hidden="true">|</span>
      <button type="button" data-lang="en" class="${lang === 'en' ? 'active' : ''}">EN</button>
    </div>

    <nav class="mobile-menu-nav" aria-label="${copy.mobileNav}">
      <a class="${isActive('index')}" href="${getPageHref(lang, 'index')}">${copy.home}</a>
      <a class="${isActive('portfolio')}" href="${getPageHref(lang, 'portfolio')}">${copy.portfolio}</a>
      <a class="${isActive('drone')}" href="${getPageHref(lang, 'drone')}">${copy.drone}</a>
      <a class="${isActive('pricing')}" href="${getPageHref(lang, 'pricing')}">${copy.pricing}</a>
      <a class="${isActive('booking')}" href="${getPageHref(lang, 'booking')}">${copy.booking}</a>
      <a class="${isActive('contact')}" href="${getPageHref(lang, 'contact')}">${copy.contact}</a>
      <a class="${isActive('galleryLogin') || isActive('gallery') ? 'active' : ''}" href="${getPageHref(lang, 'galleryLogin')}">${copy.gallery}</a>
    </nav>

    <a class="nav-cta mobile-menu-cta" href="${getPageHref(lang, 'booking')}">${copy.bookingCta}</a>

    <div class="mobile-menu-meta">
      <span>${copy.response}</span>
      <span>${copy.area}</span>
      <span>${copy.delivery}</span>
    </div>
  </div>
</aside>
`;
}

function initLangSwitch() {
  document.querySelectorAll('.lang-switch button').forEach((button) => {
    button.addEventListener('click', () => switchLanguage(button.dataset.lang));
  });
}

function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header || header.dataset.scrollBound) return;
  header.dataset.scrollBound = 'true';

  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

function initResponsiveHeaderState() {
  const mainNav = document.querySelector('.main-nav');
  const desktopCta = document.querySelector('.header-actions .nav-cta');
  const desktopLang = document.querySelector('.header-actions .lang-switch');
  const menuToggle = document.querySelector('.menu-toggle');

  if (!mainNav || !menuToggle) return;

  const applyState = () => {
    const isMobile = window.innerWidth <= 1100;

    if (isMobile) {
      mainNav.style.display = 'none';
      mainNav.style.opacity = '0';
      mainNav.style.visibility = 'hidden';
      mainNav.style.pointerEvents = 'none';
      mainNav.style.width = '0';
      mainNav.style.overflow = 'hidden';

      if (desktopCta) {
        desktopCta.style.display = 'none';
        desktopCta.style.visibility = 'hidden';
        desktopCta.style.pointerEvents = 'none';
      }

      if (desktopLang) {
        desktopLang.style.display = 'none';
        desktopLang.style.visibility = 'hidden';
        desktopLang.style.pointerEvents = 'none';
      }

      menuToggle.style.display = 'inline-flex';
      menuToggle.style.visibility = 'visible';
      menuToggle.style.pointerEvents = 'auto';
    } else {
      mainNav.style.display = 'flex';
      mainNav.style.opacity = '';
      mainNav.style.visibility = '';
      mainNav.style.pointerEvents = '';
      mainNav.style.width = '';
      mainNav.style.overflow = '';

      if (desktopCta) {
        desktopCta.style.display = 'inline-flex';
        desktopCta.style.visibility = '';
        desktopCta.style.pointerEvents = '';
      }

      if (desktopLang) {
        desktopLang.style.display = 'inline-flex';
        desktopLang.style.visibility = '';
        desktopLang.style.pointerEvents = '';
      }

      menuToggle.style.display = 'none';
      menuToggle.style.visibility = '';
      menuToggle.style.pointerEvents = '';
    }
  };

  applyState();
  window.addEventListener('resize', applyState, { passive: true });
}

function initHamburger() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobileMenu');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  const close = document.querySelector('.mobile-menu-close');
  const panel = menu?.querySelector('.mobile-menu-panel');
  const nav = menu?.querySelector('.mobile-menu-nav');

  if (!toggle || !menu || toggle.dataset.bound) return;
  toggle.dataset.bound = 'true';

  if (backdrop && backdrop.parentElement !== document.body) {
    document.body.appendChild(backdrop);
  }
  if (menu && menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }

  const applyLayerStyles = (isOpen) => {
    if (backdrop) {
      backdrop.hidden = !isOpen;
      backdrop.style.display = isOpen ? 'block' : 'none';
      backdrop.style.position = 'fixed';
      backdrop.style.inset = '0';
      backdrop.style.zIndex = '100010';
      backdrop.style.visibility = isOpen ? 'visible' : 'hidden';
      backdrop.style.opacity = isOpen ? '1' : '0';
      backdrop.style.pointerEvents = isOpen ? 'auto' : 'none';
    }

    menu.hidden = !isOpen;
    menu.style.display = isOpen ? 'flex' : 'none';
    menu.style.position = 'fixed';
    menu.style.inset = '0';
    menu.style.justifyContent = 'flex-end';
    menu.style.zIndex = '100020';
    menu.style.visibility = isOpen ? 'visible' : 'hidden';
    menu.style.opacity = isOpen ? '1' : '0';
    menu.style.pointerEvents = isOpen ? 'auto' : 'none';

    if (panel) {
      panel.style.display = 'grid';
      panel.style.width = 'min(420px, 100%)';
      panel.style.maxWidth = '420px';
      panel.style.height = '100%';
      panel.style.padding = '22px';
      panel.style.background = 'linear-gradient(180deg, rgba(15, 18, 25, 0.98), rgba(10, 12, 17, 0.98))';
      panel.style.borderLeft = '1px solid rgba(255, 255, 255, 0.08)';
      panel.style.boxShadow = '-24px 0 80px rgba(0, 0, 0, 0.4)';
      panel.style.transform = isOpen ? 'translateX(0)' : 'translateX(104%)';
    }

    if (nav) {
      nav.style.display = 'grid';
      nav.style.gap = '16px';
    }
  };

  const closeMenu = () => {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('open');
    document.body.classList.remove('menu-open');
    applyLayerStyles(false);
  };

  const openMenu = () => {
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('open');
    document.body.classList.add('menu-open');
    applyLayerStyles(true);
  };

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  close?.addEventListener('click', closeMenu);
  backdrop?.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) closeMenu();
  });

  closeMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('site-header');
  if (!target) return;
  const { lang } = getRouteInfo();
  target.innerHTML = buildHeaderMarkup(lang);
  initResponsiveHeaderState();
  initLangSwitch();
  initStickyHeader();
  initHamburger();
});
