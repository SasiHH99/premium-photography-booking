import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
      email_confirm: true
    });

    if (createError) {
      if (/already|exists|registered/i.test(createError.message || "")) {
        return json(400, { error: "User already exists" });
      }
      return json(400, { error: createError.message });
    }

    const createdUserId = created?.user?.id || null;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      if (createdUserId) {
        await supabase.auth.admin.deleteUser(createdUserId);
      }
      return json(500, { error: "Missing RESEND_API_KEY env var" });
    }

    const subject =
      lang === "de" ? "Online Galerie Zugang" : "Online Galéria Hozzáférés";

    const intro =
      lang === "de"
        ? "Deine Online Galerie ist fertig."
        : "Az online galériád elkészült.";

    const ctaText =
      lang === "de" ? "Zur Galerie" : "Belépés a galériába";

    const ctaUrl =
      lang === "de"
        ? "https://bphoto.at/de/galeria-login.html"
        : "https://bphoto.at/hu/galeria-login.html";

    const mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "B. Photography <noreply@bphoto.at>",
        to: email,
        subject,
        html: `
          <h2>${subject}</h2>
          <p>${intro}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Jelszó / Passwort:</strong> ${password}</p>
          <p><a href="${ctaUrl}">${ctaText}</a></p>
        `
      })
    });

    if (!mailResponse.ok) {
      const errText = await mailResponse.text();

      // Ha az email nem ment ki, töröljük a usert, hogy újrapróbálható legyen.
      if (createdUserId) {
        await supabase.auth.admin.deleteUser(createdUserId);
      }

      return json(502, {
        error: "Email send failed",
        details: errText.slice(0, 300)
      });
    }

    return json(200, { success: true });
  } catch (err) {
    return json(500, { error: "Server error", details: String(err?.message || err) });
  }
};
