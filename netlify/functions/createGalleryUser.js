import {
  CORS_HEADERS,
  json,
  createServiceClient,
  getBearerToken,
  normalizeEmail,
  isValidEmail,
  generatePassword,
  createGalleryMailHtml,
  sendResendMail
} from "./_admin.js";

const supabase = createServiceClient();

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
    const from = process.env.GALLERY_FROM_EMAIL || "B. Photography <noreply@bphoto.at>";
    const subject = lang === "de" ? "Dein Zugang zur Online-Galerie" : "Hozzáférés az online galériához";
    const intro =
      lang === "de"
        ? "Deine Galerie ist bereit. Mit diesem temporären Passwort kannst du dich sofort einloggen. Beim ersten Login setzt du direkt dein eigenes Passwort."
        : "A galériád elkészült. Ezzel az ideiglenes jelszóval azonnal be tudsz lépni. Az első belépés után rögtön beállítod a saját jelszavadat.";
    const ctaText = lang === "de" ? "Zur Galerie" : "Galéria megnyitása";
    const ctaUrl =
      lang === "de" ? "https://bphoto.at/de/galeria-login.html" : "https://bphoto.at/hu/galeria-login.html";

    try {
      await sendResendMail({
        from,
        to: email,
        subject,
        html: createGalleryMailHtml({
          heading: subject,
          intro,
          email,
          password,
          ctaText,
          ctaUrl
        })
      });
    } catch (mailError) {
      if (createdUserId) await supabase.auth.admin.deleteUser(createdUserId);
      return json(502, {
        error: "Email send failed",
        details: String(mailError?.message || mailError).slice(0, 400)
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
