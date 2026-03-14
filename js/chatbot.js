const CHAT_CONFIG = {
  hu: {
    kicker: "AI asszisztens",
    title: "Kérdezz gyorsan a fotózásról",
    welcome:
      "Szia, itt a B. Photography AI asszisztense. Tudok segíteni csomagokkal, árakkal, foglalással, helyszínnel, portfólióval és kapcsolatfelvétellel kapcsolatban.",
    placeholder: "Írd ide a kérdésedet...",
    send: "Küldés",
    typing: "Az asszisztens válaszol",
    error:
      "Az AI asszisztens most nem elérhető. Használd a kapcsolat oldalt, vagy írj ide: busi.sandor@bphoto.at",
    ariaOpen: "AI chat megnyitása",
    ariaClose: "Chat bezárása",
    quickLabel: "Gyakori témák",
    quickActions: [
      { label: "Árak", prompt: "Milyen csomagok vannak és mennyibe kerülnek?" },
      { label: "Foglalás", prompt: "Hogyan működik a foglalás?" },
      { label: "Portfólió", prompt: "Hol tudom megnézni a portfóliót?" },
      { label: "Fotózás menete", prompt: "Hogyan zajlik egy fotózás?" }
    ]
  },
  de: {
    kicker: "AI Assistent",
    title: "Fragen zum Shooting direkt hier",
    welcome:
      "Hallo, ich bin der Assistent von B. Photography. Ich helfe dir bei Paketen, Preisen, Buchung, Orten, Portfolio und Kontakt.",
    placeholder: "Schreibe deine Frage...",
    send: "Senden",
    typing: "Der Assistent schreibt",
    error:
      "Der AI Assistent ist gerade nicht erreichbar. Nutze bitte die Kontaktseite oder schreibe an busi.sandor@bphoto.at",
    ariaOpen: "AI Chat öffnen",
    ariaClose: "Chat schließen",
    quickLabel: "Schnelle Themen",
    quickActions: [
      { label: "Preise ansehen", prompt: "Welche Pakete gibt es und was kosten sie?" },
      { label: "Termin anfragen", prompt: "Wie läuft die Buchung ab?" },
      { label: "Portfolio ansehen", prompt: "Wo kann ich das Portfolio ansehen?" },
      { label: "Wie läuft ein Shooting ab?", prompt: "Wie läuft ein Shooting ab?" }
    ]
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

function formatMessageText(text = "") {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function createBubble(role, text, cta = null) {
  const item = document.createElement("article");
  item.className = `site-chat-message is-${role}`;
  item.innerHTML = `
    <div class="site-chat-bubble">
      <p>${formatMessageText(text)}</p>
    </div>
  `;

  if (cta?.url && cta?.label) {
    const action = document.createElement("a");
    action.className = "site-chat-inline-cta";
    action.href = cta.url;
    action.textContent = cta.label;
    item.appendChild(action);
  }

  return item;
}

function initSiteChat() {
  if (document.querySelector(".site-chat")) return;
  if (window.location.pathname.startsWith("/admin")) return;

  const lang = window.location.pathname.startsWith("/hu") ? "hu" : "de";
  const copy = CHAT_CONFIG[lang];
  const state = {
    messages: [{ role: "assistant", text: copy.welcome }],
    previousResponseId: null
  };

  const host = document.createElement("section");
  host.className = "site-chat";
  host.innerHTML = `
    <button type="button" class="site-chat-toggle" aria-label="${copy.ariaOpen}">
      <span class="site-chat-toggle-icon">✦</span>
      <span class="site-chat-toggle-text">AI</span>
    </button>
    <div class="site-chat-panel" aria-live="polite">
      <div class="site-chat-head">
        <div>
          <p class="site-chat-kicker">${copy.kicker}</p>
          <h2 class="site-chat-title">${copy.title}</h2>
        </div>
        <button type="button" class="site-chat-close" aria-label="${copy.ariaClose}">×</button>
      </div>
      <div class="site-chat-quick-shell">
        <p class="site-chat-quick-label">${copy.quickLabel}</p>
        <div class="site-chat-quick-actions"></div>
      </div>
      <div class="site-chat-messages"></div>
      <div class="site-chat-typing" hidden>
        <span></span><span></span><span></span>
        <strong>${copy.typing}</strong>
      </div>
      <form class="site-chat-form">
        <input type="text" class="site-chat-input" maxlength="600" placeholder="${copy.placeholder}" autocomplete="off">
        <button type="submit" class="site-chat-send">${copy.send}</button>
      </form>
    </div>
  `;

  document.body.appendChild(host);
  document.body.classList.add("has-site-chat");

  const toggle = host.querySelector(".site-chat-toggle");
  const close = host.querySelector(".site-chat-close");
  const quickActions = host.querySelector(".site-chat-quick-actions");
  const messages = host.querySelector(".site-chat-messages");
  const typing = host.querySelector(".site-chat-typing");
  const form = host.querySelector(".site-chat-form");
  const input = host.querySelector(".site-chat-input");

  function renderMessages() {
    messages.innerHTML = "";
    state.messages.forEach((message) => {
      messages.appendChild(createBubble(message.role, message.text, message.cta || null));
    });
    messages.scrollTop = messages.scrollHeight;
  }

  function setTyping(visible) {
    typing.hidden = !visible;
    if (visible) messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text, cta = null) {
    state.messages.push({ role, text, cta });
    state.messages = state.messages.slice(-12);
    renderMessages();
  }

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";
    setTyping(true);

    try {
      const response = await fetch("/.netlify/functions/site-ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          previousResponseId: state.previousResponseId,
          lang
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.reply) {
        throw new Error(body.details || body.error || "AI request failed");
      }

      state.previousResponseId = body.responseId || state.previousResponseId;
      addMessage("assistant", body.reply, body.cta || null);
    } catch (error) {
      console.error("AI chat error:", error);
      addMessage("assistant", copy.error, {
        label: lang === "hu" ? "Kapcsolat oldal" : "Kontaktseite",
        url: lang === "hu" ? "/hu/kapcsolat.html" : "/de/kontakt.html"
      });
    } finally {
      setTyping(false);
    }
  }

  quickActions.innerHTML = copy.quickActions
    .map(
      (action, index) =>
        `<button type="button" class="site-chat-quick-btn" data-quick-index="${index}">${action.label}</button>`
    )
    .join("");

  quickActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-index]");
    if (!button) return;
    const action = copy.quickActions[Number(button.dataset.quickIndex)];
    if (!action) return;
    sendMessage(action.prompt);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  toggle.addEventListener("click", () => {
    host.classList.toggle("is-open");
    if (host.classList.contains("is-open")) input.focus();
  });

  close.addEventListener("click", () => host.classList.remove("is-open"));

  renderMessages();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteChat, { once: true });
} else {
  initSiteChat();
}
