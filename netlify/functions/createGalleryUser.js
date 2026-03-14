import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}

function generatePassword() {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

function getBearerToken(headers = {}) {
  const auth = headers.authorization || headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice(7).trim();
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createMailHtml({ subject, intro, email, password, ctaText, ctaUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#0f1117;color:#f3efe5;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:#171a22;border:1px solid rgba(214,179,106,.18);border-radius:20px;padding:28px;">
        <p style="margin:0 0 12px;color:#d6b36a;letter-spacing:.18em;text-transform:uppercase;font-size:12px;">B. Photography</p>
        <h2 style="margin:0 0 18px;font-size:28px;color:#f3efe5;">${subject}</h2>
        <p style="margin:0 0 24px;line-height:1.7;color:#ddd7ca;">${intro}</p>
        <div style="margin:18px 0;padding:18px;border-radius:16px;background:#10131a;border:1px solid rgba(255,255,255,.06);">
          <p style="margin:0 0 8px;color:#a9a396;">Email</p>
          <p style="margin:0 0 16px;color:#f3efe5;">${email}</p>
          <p style="margin:0 0 8px;color:#a9a396;">Jelszó / Passwort</p>
          <p style="margin:0;color:#f3efe5;font-size:20px;letter-spacing:.08em;">${password}</p>
        </div>
        <a href="${ctaUrl}" style="display:inline-block;margin-top:8px;padding:14px 22px;border-radius:999px;background:#d6b36a;color:#16120c;text-decoration:none;font-weight:700;">${ctaText}</a>
      </div>
    </div>
  `;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const token = getBearerToken(event.headers || {});
    if (!token) return json(401, { error: "Missing bearer token" });

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) return json(401, { error: "Invalid token" });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return json(403, { error: "Forbidden" });
    }

    const body = JSON.parse(event.body || "{}");
    const email = normalizeEmail(body.email);
    const lang = body.lang === "de" ? "de" : "hu";

    if (!email) return json(400, { error: "Email required" });
    if (!isValidEmail(email)) return json(400, { error: "Invalid email format" });

    const password = generatePassword();

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        lang,
        role: "client",
        must_change_password: true,
        password_updated_at: new Date().toISOString()
      }
    });

    if (createError) {
      if (/already|exists|registered/i.test(createError.message || "")) {
        return json(400, { error: "User already exists" });
      }

      return json(400, { error: createError.message });
    }

    const createdUserId = created?.user?.id || null;
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.GALLERY_FROM_EMAIL || "B. Photography <noreply@bphoto.at>";

    if (!resendApiKey) {
      if (createdUserId) await supabase.auth.admin.deleteUser(createdUserId);
      return json(500, { error: "Missing RESEND_API_KEY env var" });
    }

    const subject = lang === "de" ? "Dein Zugang zur Online Galerie" : "Hozzáférés az online galériához";
    const intro =
      lang === "de"
        ? "Deine Galerie ist bereit. Mit diesem temporären Passwort kannst du dich sofort einloggen. Beim ersten Login legst du direkt dein eigenes Passwort fest."
        : "A galériád elkészült. Ezzel az ideiglenes jelszóval azonnal be tudsz lépni. Az első belépés után rögtön beállítod a saját jelszavadat.";
    const ctaText = lang === "de" ? "Zur Galerie" : "Galéria megnyitása";
    const ctaUrl =
      lang === "de" ? "https://bphoto.at/de/galeria-login.html" : "https://bphoto.at/hu/galeria-login.html";

    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html: createMailHtml({ subject, intro, email, password, ctaText, ctaUrl })
      })
    });

    if (!mailResponse.ok) {
      const details = await mailResponse.text();
      if (createdUserId) await supabase.auth.admin.deleteUser(createdUserId);

      return json(502, {
        error: "Email send failed",
        details: details.slice(0, 400)
      });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
