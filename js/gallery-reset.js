const GALLERY_RESET_COPY = {
  hu: {
    heroTitle: "Itt tudsz új jelszót beállítani a privát galériádhoz.",
    heroCopy: "Nyisd meg az emailben kapott linket ugyanazon az eszközön, majd állíts be egy új jelszót a galériádhoz.",
    cardTitle: "Új jelszó beállítása",
    cardCopy: "Az új jelszó mentése után rögtön vissza tudsz menni a galéria belépéshez.",
    forceHeroTitle: "Első belépésnél állíts be saját jelszót a galériádhoz.",
    forceHeroCopy: "A generált jelszó csak belépésre szolgál. Mielőtt továbbmész, válassz egy saját, könnyebben használható jelszót.",
    forceCardTitle: "Saját jelszó beállítása",
    forceCardCopy: "Ezután már a saját jelszavaddal fogsz belépni a privát galériádba.",
    home: "Vissza a főoldalra",
    password: "Új jelszó",
    passwordAgain: "Új jelszó újra",
    submit: "Jelszó mentése",
    loading: "Mentés...",
    missing: "Mindkét jelszómezőt töltsd ki.",
    short: "A jelszó legyen legalább 8 karakter hosszú.",
    mismatch: "A két jelszó nem egyezik.",
    success: "Az új jelszó mentve. Most már be tudsz lépni a galériába.",
    forceSuccess: "Az új saját jelszó mentve. Megnyitom a galériát.",
    invalid: "A jelszó-visszaállító link lejárt vagy hibás. Kérj új emailt a galéria belépő oldalon.",
    unexpected: "Váratlan hiba történt. Próbáld meg újra.",
    backToLogin: "Vissza a galéria belépéshez"
  },
  de: {
    heroTitle: "Hier setzt du ein neues Passwort für deine private Galerie.",
    heroCopy: "Öffne den Link aus der E-Mail am besten auf demselben Gerät und vergib danach ein neues Passwort.",
    cardTitle: "Neues Passwort festlegen",
    cardCopy: "Nach dem Speichern kannst du direkt zurück zum Galerie-Login gehen.",
    forceHeroTitle: "Lege beim ersten Login direkt dein eigenes Passwort fest.",
    forceHeroCopy: "Das generierte Passwort ist nur für den ersten Einstieg gedacht. Vergib jetzt ein eigenes Passwort, das du leichter benutzen kannst.",
    forceCardTitle: "Eigenes Passwort festlegen",
    forceCardCopy: "Danach meldest du dich nur noch mit deinem eigenen Passwort in der Galerie an.",
    home: "Zur Startseite",
    password: "Neues Passwort",
    passwordAgain: "Neues Passwort wiederholen",
    submit: "Passwort speichern",
    loading: "Speichern...",
    missing: "Bitte beide Passwortfelder ausfüllen.",
    short: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    mismatch: "Die beiden Passwörter stimmen nicht überein.",
    success: "Das neue Passwort wurde gespeichert. Du kannst dich jetzt wieder einloggen.",
    forceSuccess: "Dein eigenes Passwort wurde gespeichert. Die Galerie wird geöffnet.",
    invalid: "Der Link zum Zurücksetzen ist abgelaufen oder ungültig. Bitte fordere auf der Login-Seite eine neue E-Mail an.",
    unexpected: "Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen.",
    backToLogin: "Zurück zum Galerie-Login"
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const shell = document.querySelector("[data-gallery-reset]");
  if (!shell) return;

  const lang = shell.dataset.lang === "de" ? "de" : "hu";
  const copy = GALLERY_RESET_COPY[lang];
  const loginUrl = lang === "de" ? "/de/galeria-login.html" : "/hu/galeria-login.html";
  const galleryUrl = lang === "de" ? "/de/galeria.html" : "/hu/galeria.html";
  const homeUrl = lang === "de" ? "/de/index.html" : "/hu/index.html";
  const supabase = window.supabaseClient;
  if (!supabase) return;

  const params = new URLSearchParams(window.location.search);
  const forceChange = params.get("flow") === "first-login";

  const heroTitle = document.getElementById("galleryResetHeroTitle");
  const heroCopy = document.getElementById("galleryResetHeroCopy");
  const cardTitle = document.getElementById("galleryResetTitle");
  const cardCopy = document.getElementById("galleryResetCopy");
  const homeLink = document.getElementById("galleryResetHome");
  const loginLink = document.getElementById("galleryResetLoginLink");
  const passwordLabel = document.getElementById("galleryResetPasswordLabel");
  const passwordAgainLabel = document.getElementById("galleryResetPasswordAgainLabel");
  const passwordInput = document.getElementById("password");
  const passwordAgainInput = document.getElementById("passwordAgain");
  const button = document.getElementById("galleryResetBtn");
  const errorBox = document.getElementById("galleryResetError");
  const successBox = document.getElementById("galleryResetSuccess");

  heroTitle.textContent = forceChange ? copy.forceHeroTitle : copy.heroTitle;
  heroCopy.textContent = forceChange ? copy.forceHeroCopy : copy.heroCopy;
  cardTitle.textContent = forceChange ? copy.forceCardTitle : copy.cardTitle;
  cardCopy.textContent = forceChange ? copy.forceCardCopy : copy.cardCopy;
  homeLink.textContent = copy.home;
  homeLink.href = homeUrl;
  loginLink.textContent = copy.backToLogin;
  loginLink.href = loginUrl;
  passwordLabel.textContent = copy.password;
  passwordAgainLabel.textContent = copy.passwordAgain;
  passwordInput.placeholder = copy.password;
  passwordAgainInput.placeholder = copy.passwordAgain;
  button.textContent = copy.submit;

  function setError(message = "") {
    errorBox.textContent = message;
  }

  function setSuccess(message = "") {
    successBox.textContent = message;
    successBox.classList.toggle("is-visible", Boolean(message));
  }

  async function ensureSessionForPasswordChange() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) return true;

    return await new Promise((resolve) => {
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && nextSession) {
          window.clearTimeout(timeout);
          data.subscription.unsubscribe();
          resolve(true);
        }
      });

      const timeout = window.setTimeout(() => {
        data.subscription.unsubscribe();
        resolve(false);
      }, 1800);
    });
  }

  const hasSession = await ensureSessionForPasswordChange();
  if (!hasSession) {
    setError(copy.invalid);
  }

  async function handleReset() {
    setError("");
    setSuccess("");

    const password = passwordInput.value.trim();
    const passwordAgain = passwordAgainInput.value.trim();

    if (!password || !passwordAgain) {
      setError(copy.missing);
      return;
    }

    if (password.length < 8) {
      setError(copy.short);
      return;
    }

    if (password !== passwordAgain) {
      setError(copy.mismatch);
      return;
    }

    button.disabled = true;
    button.textContent = copy.loading;

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const nextMetadata = {
        ...(user?.user_metadata || {}),
        must_change_password: false,
        password_updated_at: new Date().toISOString()
      };

      const { error } = await supabase.auth.updateUser({
        password,
        data: nextMetadata
      });

      if (error) {
        setError(copy.invalid);
        return;
      }

      setSuccess(forceChange ? copy.forceSuccess : copy.success);
      passwordInput.value = "";
      passwordAgainInput.value = "";

      window.setTimeout(() => {
        window.location.href = forceChange ? galleryUrl : loginUrl;
      }, 900);
    } catch (error) {
      console.error("Gallery password reset error:", error);
      setError(copy.unexpected);
    } finally {
      button.disabled = false;
      button.textContent = copy.submit;
    }
  }

  button.addEventListener("click", handleReset);
  [passwordInput, passwordAgainInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleReset();
    });
  });
});
