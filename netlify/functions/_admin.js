import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  };
}

export function createServiceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function getBearerToken(headers = {}) {
  const auth = headers.authorization || headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice(7).trim();
}

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseEmailRecipients(...values) {
  const recipients = values
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      return String(value || "")
        .split(/[,\n;]+/g)
        .map((part) => part.trim());
    })
    .map((value) => normalizeEmail(value))
    .filter((value) => value && isValidEmail(value));

  return [...new Set(recipients)];
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generatePassword() {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

export async function verifyAdminFromEvent(event) {
  const supabase = createServiceClient();
  const token = getBearerToken(event.headers || {});

  if (!token) {
    return { ok: false, response: json(401, { error: "Missing bearer token" }) };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { ok: false, response: json(401, { error: "Invalid token" }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, response: json(403, { error: "Forbidden" }) };
  }

  return { ok: true, supabase, user: authData.user };
}

export async function sendResendMail({ to, subject, html, from, replyTo }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY env var");
  }

  const payload = { from, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details.slice(0, 500));
  }
}

export function createMailLayout({ eyebrow = "B. Photography", heading, intro, sections = "", ctaText = "", ctaUrl = "", footerNote = "" }) {
  const cta = ctaText && ctaUrl
    ? `
      <div style="margin-top:28px;">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:linear-gradient(135deg,#d6b36a,#f0ca82);color:#17120b;text-decoration:none;font-weight:700;letter-spacing:.04em;">${ctaText}</a>
      </div>
    `
    : "";

  const footer = footerNote
    ? `<p style="margin:22px 0 0;color:#9f998c;line-height:1.6;font-size:13px;">${footerNote}</p>`
    : "";

  return `
    <div style="margin:0;padding:32px 16px;background:#0b0e13;font-family:Arial,sans-serif;color:#f3efe5;">
      <div style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,#171b23,#11151c);border:1px solid rgba(214,179,106,.18);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.38);">
        <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,.06);background:radial-gradient(circle at top right, rgba(214,179,106,.12), transparent 30%);">
          <p style="margin:0;color:#d6b36a;letter-spacing:.22em;text-transform:uppercase;font-size:12px;">${eyebrow}</p>
        </div>
        <div style="padding:32px 28px 34px;">
          <h1 style="margin:0 0 14px;font-size:30px;line-height:1.15;color:#f7f1e2;font-family:Georgia,serif;">${heading}</h1>
          <p style="margin:0 0 24px;line-height:1.75;color:#d7d0c3;font-size:15px;">${intro}</p>
          ${sections}
          ${cta}
          ${footer}
        </div>
      </div>
    </div>
  `;
}

export function createInfoTable(rows = []) {
  const safeRows = rows
    .filter((row) => row && row.label)
    .map((row) => `
      <tr>
        <td style="padding:12px 0;color:#a9a396;font-size:13px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:12px 0 12px 18px;color:#f3efe5;font-size:15px;line-height:1.6;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:top;">${escapeHtml(row.value || "-")}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="padding:18px 20px;border-radius:20px;background:#0f141b;border:1px solid rgba(255,255,255,.06);">
      <table style="width:100%;border-collapse:collapse;">${safeRows}</table>
    </div>
  `;
}

export function createNoteBlock(label, body) {
  return `
    <div style="margin-top:18px;padding:18px 20px;border-radius:20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);">
      <p style="margin:0 0 10px;color:#d6b36a;text-transform:uppercase;letter-spacing:.18em;font-size:11px;">${escapeHtml(label)}</p>
      <p style="margin:0;line-height:1.75;color:#f3efe5;font-size:15px;">${escapeHtml(body || "-")}</p>
    </div>
  `;
}

export function createGalleryMailHtml({ heading, intro, email, password, ctaText, ctaUrl }) {
  const sections = `
    ${createInfoTable([
      { label: "Email", value: email },
      { label: "Ideiglenes jelszó / Temporäres Passwort", value: password }
    ])}
    ${createNoteBlock(
      "Fontos",
      "Az első belépés után / Beim ersten Login a rendszer rögtön saját jelszó megadását kéri."
    )}
  `;

  return createMailLayout({
    heading,
    intro,
    sections,
    ctaText,
    ctaUrl,
    footerNote: "Ha a gomb nem nyílik meg, nyisd meg kézzel a weboldalt, és jelentkezz be a kapott adatokkal."
  });
}
