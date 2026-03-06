const SUPABASE_URL = "https://hxvhsxppmdzcbklcberm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_feNwyFggYsuxRqOr85cIng_h2pP4zn8";

function initSupabaseClient() {
  if (window.supabaseClient || !window.supabase?.createClient) return;
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function injectWhatsappButton() {
  if (document.querySelector(".whatsapp-float")) return;

  const a = document.createElement("a");
  a.href = "https://wa.me/4367761496331";
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "whatsapp-float";
  a.setAttribute("aria-label", "WhatsApp");

  a.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.2 4 14.6c0 2.6.9 5 2.3 6.9L5 29l7.7-1.9c1.9 1 4.1 1.6 6.3 1.6 6.6 0 12-5.2 12-11.6S22.6 3 16 3z"></path>
      <path d="M12 11c.2-.4.5-.4.8-.4h.6c.2 0 .4 0 .6.5s.8 2 .9 2.2c.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.2.8.2.4.9 1.6 2 2.6 1.4 1.2 2.6 1.6 3 .1.4-.2.6-.2.8-.1.2.1.9.4 1.4.7.4.3.7.4.8.6.1.2.1 1.2-.3 1.8-.4.6-1 .9-1.6.9-1.1 0-3.2-.6-5.2-2.5-2.4-2.3-3.5-4.9-3.5-6.5 0-.9.5-1.6.8-2z"></path>
    </svg>
  `;

  document.body.appendChild(a);
}

document.addEventListener("DOMContentLoaded", () => {
  initSupabaseClient();
  injectWhatsappButton();
});
