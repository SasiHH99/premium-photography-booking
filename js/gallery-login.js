const GALLERY_LOGIN_COPY = {
  hu: {
    heroTitle: "A galériád itt érhető el privát és kényelmes formában.",
    heroCopy: "A foglaláskor megadott emaillel és az általunk küldött jelszóval tudsz belépni. Itt tudod végignézni az összes átadott képet és kijelölni a kedvenceidet.",
    cardTitle: "Online galéria belépés",
    cardCopy: "A belépés után azonnal megnyílik a privát galériád. Ha még nem kaptad meg a hozzáférést, várj a képátadásról küldött emailre.",
    home: "Vissza a főoldalra",
    email: "Email",
    password: "Jelszó",
    submit: "Belépés",
    loading: "Ellenőrzés...",
    forgot: "Elfelejtett jelszó",
    forgotLoading: "Küldés...",
    forgotMissing: "Az új jelszó kéréséhez add meg az email címedet.",
    forgotSuccess: "Küldtem egy jelszó-visszaállító emailt. Nyisd meg a benne lévő linket ugyanazon az eszközön.",
    forgotTitle: "Új jelszó kérése",
    forgotCopy: "Írd be azt az email címet, amivel a privát galériádhoz tartozó fiók készült. A rendszer küld egy linket az új jelszó beállításához.",
    forgotSubmit: "Új jelszó link küldése",
    forgotClose: "Bezárás",
    missingFields: "Kérlek tölts ki minden mezőt.",
    invalidEmail: "Adj meg érvényes email címet.",
    invalidLogin: "Hibás email vagy jelszó.",
    unexpected: "Váratlan hiba történt. Próbáld meg újra.",
    note: "Amint a galériád készen áll, emailben küldjük a belépési adatokat. Ugyanazzal az email címmel jelentkezz be, amit a foglaláskor megadtál."
  },
  de: {
    heroTitle: "Deine Galerie ist hier privat und direkt erreichbar.",
    heroCopy: "Melde dich mit der E-Mail-Adresse aus deiner Buchung und dem zugesendeten Passwort an. Danach kannst du alle Bilder ansehen und Favoriten markieren.",
    cardTitle: "Login zur Online-Galerie",
    cardCopy: "Nach dem Login landest du direkt in deiner privaten Galerie. Wenn du noch keinen Zugang erhalten hast, warte bitte auf unsere E-Mail zur Bildübergabe.",
    home: "Zur Startseite",
    email: "E-Mail",
    password: "Passwort",
    submit: "Login",
    loading: "Prüfung...",
    forgot: "Passwort vergessen",
    forgotLoading: "Senden...",
    forgotMissing: "Für ein neues Passwort brauche ich deine E-Mail-Adresse.",
    forgotSuccess: "Ich habe dir eine E-Mail zum Zurücksetzen geschickt. Öffne den Link am besten auf demselben Gerät.",
    forgotTitle: "Neues Passwort anfordern",
    forgotCopy: "Gib die E-Mail-Adresse ein, mit der dein Galerie-Zugang erstellt wurde. Danach sendet das System einen Link zum Setzen eines neuen Passworts.",
    forgotSubmit: "Passwort-Link senden",
    forgotClose: "Schließen",
    missingFields: "Bitte alle Felder ausfüllen.",
    invalidEmail: "Bitte eine gültige E-Mail-Adresse eingeben.",
    invalidLogin: "Falsche E-Mail oder falsches Passwort.",
    unexpected: "Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen.",
    note: "Sobald deine Galerie bereit ist, senden wir dir die Zugangsdaten per E-Mail. Bitte melde dich mit derselben E-Mail-Adresse an, die du bei der Buchung verwendet hast."
  },
  en: {
    heroTitle: "Your gallery is available here in a private, direct view.",
    heroCopy: "Sign in with the email from your booking and the password we sent you. After that, you can review every delivered image and mark favorites.",
    cardTitle: "Online gallery login",
    cardCopy: "After login, your private gallery opens immediately. If you have not received access yet, wait for the handover email.",
    home: "Back to home",
    email: "Email",
    password: "Password",
    submit: "Log in",
    loading: "Checking...",
    forgot: "Forgot password",
    forgotLoading: "Sending...",
    forgotMissing: "Enter your email address to request a new password.",
    forgotSuccess: "I sent you a password reset email. Open the link on the same device if possible.",
    forgotTitle: "Request a new password",
    forgotCopy: "Enter the email address used for your private gallery account. The system will send a link to set a new password.",
    forgotSubmit: "Send password link",
    forgotClose: "Close",
    missingFields: "Please fill in every field.",
    invalidEmail: "Please enter a valid email address.",
    invalidLogin: "Incorrect email or password.",
    unexpected: "An unexpected error occurred. Please try again.",
    note: "As soon as your gallery is ready, we send the access details by email. Please sign in with the same email address you used for the booking."
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const shell = document.querySelector("[data-gallery-login]");
  if (!shell) return;

  const lang = ["hu", "de", "en"].includes(shell.dataset.lang) ? shell.dataset.lang : "de";
  const copy = GALLERY_LOGIN_COPY[lang];
  const redirectUrl = lang === "hu" ? "/hu/galeria.html" : lang === "en" ? "/en/gallery.html" : "/de/galeria.html";
  const homeUrl = lang === "hu" ? "/hu/index.html" : lang === "en" ? "/en/index.html" : "/de/index.html";
  const siteOrigin = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "https://bphoto.at"
    : window.location.origin;
  const resetUrl = `${siteOrigin}${lang === "hu" ? "/hu/galeria-jelszo.html" : lang === "en" ? "/en/gallery-password.html" : "/de/galeria-jelszo.html"}`;
  const firstLoginResetUrl = `${resetUrl}?flow=first-login`;
  const supabase = window.supabaseClient;
  if (!supabase) return;

  const heroTitle = document.getElementById("galleryLoginHeroTitle");
  const heroCopy = document.getElementById("galleryLoginHeroCopy");
  const cardTitle = document.getElementById("galleryLoginTitle");
  const cardCopy = document.getElementById("galleryLoginCopy");
  const homeLink = document.getElementById("galleryLoginHome");
  const note = document.getElementById("galleryLoginNote");
  const emailLabel = document.getElementById("galleryLoginEmailLabel");
  const passwordLabel = document.getElementById("galleryLoginPasswordLabel");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const button = document.getElementById("loginBtn");
  const forgotButton = document.getElementById("galleryForgotBtn");
  const errorBox = document.getElementById("galleryLoginError");
  const successBox = document.getElementById("galleryLoginSuccess");
  const forgotModal = document.getElementById("galleryForgotModal");
  const forgotClose = document.getElementById("galleryForgotClose");
  const forgotKicker = document.getElementById("galleryForgotModalKicker");
  const forgotTitle = document.getElementById("galleryForgotModalTitle");
  const forgotCopy = document.getElementById("galleryForgotModalCopy");
  const forgotEmailLabel = document.getElementById("galleryForgotEmailLabel");
  const forgotEmailInput = document.getElementById("galleryForgotEmail");
  const forgotSubmit = document.getElementById("galleryForgotSubmit");
  const forgotSuccess = document.getElementById("galleryForgotSuccess");
  const forgotError = document.getElementById("galleryForgotError");
  const modalCloseAreas = Array.from(document.querySelectorAll("[data-gallery-modal-close]"));

  heroTitle.textContent = copy.heroTitle;
  heroCopy.textContent = copy.heroCopy;
  cardTitle.textContent = copy.cardTitle;
  cardCopy.textContent = copy.cardCopy;
  homeLink.textContent = copy.home;
  homeLink.href = homeUrl;
  note.textContent = copy.note;
  emailLabel.textContent = copy.email;
  passwordLabel.textContent = copy.password;
  emailInput.placeholder = copy.email;
  passwordInput.placeholder = copy.password;
  button.textContent = copy.submit;
  forgotButton.textContent = copy.forgot;
  forgotKicker.textContent = copy.forgot;
  forgotTitle.textContent = copy.forgotTitle;
  forgotCopy.textContent = copy.forgotCopy;
  forgotEmailLabel.textContent = copy.email;
  forgotEmailInput.placeholder = copy.email;
  forgotSubmit.textContent = copy.forgotSubmit;
  forgotClose.setAttribute("aria-label", copy.forgotClose);

  function getPostLoginUrl(user) {
    if (user?.user_metadata?.must_change_password === true) {
      return firstLoginResetUrl;
    }
    return redirectUrl;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    window.location.href = getPostLoginUrl(session.user);
    return;
  }

  function setError(message = "") {
    errorBox.textContent = message;
  }

  function setSuccess(message = "") {
    successBox.textContent = message;
    successBox.classList.toggle("is-visible", Boolean(message));
  }

  function setForgotError(message = "") {
    forgotError.textContent = message;
  }

  function setForgotSuccess(message = "") {
    forgotSuccess.textContent = message;
    forgotSuccess.classList.toggle("is-visible", Boolean(message));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function openForgotModal() {
    forgotModal.hidden = false;
    forgotEmailInput.value = emailInput.value.trim();
    setForgotError("");
    setForgotSuccess("");
    window.setTimeout(() => forgotEmailInput.focus(), 30);
  }

  function closeForgotModal() {
    forgotModal.hidden = true;
    setForgotError("");
    setForgotSuccess("");
    forgotSubmit.disabled = false;
    forgotSubmit.textContent = copy.forgotSubmit;
  }

  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError(copy.missingFields);
      return;
    }

    if (!isValidEmail(email)) {
      setError(copy.invalidEmail);
      return;
    }

    button.disabled = true;
    button.textContent = copy.loading;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(copy.invalidLogin);
        return;
      }
      window.location.href = getPostLoginUrl(data.user || data.session?.user);
    } catch (error) {
      console.error("Gallery login error:", error);
      setError(copy.unexpected);
    } finally {
      button.disabled = false;
      button.textContent = copy.submit;
    }
  }

  async function handleForgotPassword() {
    const email = forgotEmailInput.value.trim();

    setForgotError("");
    setForgotSuccess("");

    if (!email) {
      setForgotError(copy.forgotMissing);
      return;
    }

    if (!isValidEmail(email)) {
      setForgotError(copy.invalidEmail);
      return;
    }

    forgotSubmit.disabled = true;
    forgotSubmit.textContent = copy.forgotLoading;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetUrl });
      if (error) {
        setForgotError(copy.unexpected);
        return;
      }
      setForgotSuccess(copy.forgotSuccess);
      emailInput.value = email;
    } catch (error) {
      console.error("Gallery forgot password error:", error);
      setForgotError(copy.unexpected);
    } finally {
      forgotSubmit.disabled = false;
      forgotSubmit.textContent = copy.forgotSubmit;
    }
  }

  button.addEventListener("click", handleLogin);
  forgotButton.addEventListener("click", openForgotModal);
  forgotSubmit.addEventListener("click", handleForgotPassword);
  forgotClose.addEventListener("click", closeForgotModal);
  modalCloseAreas.forEach((item) => item.addEventListener("click", closeForgotModal));

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleLogin();
    });
  });

  forgotEmailInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleForgotPassword();
    if (event.key === "Escape") closeForgotModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !forgotModal.hidden) {
      closeForgotModal();
    }
  });
});
