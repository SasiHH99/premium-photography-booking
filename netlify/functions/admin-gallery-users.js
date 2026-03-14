import {
  CORS_HEADERS,
  json,
  verifyAdminFromEvent,
  normalizeEmail,
  isValidEmail,
  generatePassword,
  sendResendMail,
  createGalleryMailHtml
} from "./_admin.js";

function toGalleryCopy(lang, password) {
  const isDe = lang === "de";
  return {
    subject: isDe ? "Dein Zugang zur Online-Galerie" : "Hozzáférés az online galériához",
    intro: isDe
      ? "Deine Galerie ist bereit. Mit diesem temporären Passwort kannst du dich sofort einloggen. Beim ersten Login legst du direkt dein eigenes Passwort fest."
      : "A galériád elkészült. Ezzel az ideiglenes jelszóval azonnal be tudsz lépni. Az első belépés után rögtön beállítod a saját jelszavadat.",
    ctaText: isDe ? "Zur Galerie" : "Galéria megnyitása",
    ctaUrl: isDe ? "https://bphoto.at/de/galeria-login.html" : "https://bphoto.at/hu/galeria-login.html",
    password
  };
}

function mapUser(user) {
  return {
    id: user.id,
    email: user.email || "",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
    emailConfirmedAt: user.email_confirmed_at,
    note: user.user_metadata?.admin_note || "",
    lang: user.user_metadata?.lang || "hu",
    role: user.user_metadata?.role || "client",
    passwordUpdatedAt: user.user_metadata?.password_updated_at || null,
    mustChangePassword: user.user_metadata?.must_change_password === true
  };
}

async function listAllUsers(supabase) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }

  return users;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase } = admin;

  try {
    if (event.httpMethod === "GET") {
      const users = await listAllUsers(supabase);
      const galleryUsers = users
        .filter((user) => user.email && user.user_metadata?.role !== "admin")
        .map(mapUser)
        .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

      return json(200, { users: galleryUsers });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const action = body.action || "create";

    if (action === "create") {
      const email = normalizeEmail(body.email || "");
      const lang = body.lang === "de" ? "de" : "hu";
      const note = String(body.note || "").trim();

      if (!email || !isValidEmail(email)) {
        return json(400, { error: "Valid email required" });
      }

      const password = generatePassword();
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          lang,
          role: "client",
          admin_note: note,
          password_updated_at: new Date().toISOString(),
          must_change_password: true
        }
      });

      if (createError) {
        return json(400, { error: createError.message });
      }

      const copy = toGalleryCopy(lang, password);
      await sendResendMail({
        from: process.env.GALLERY_FROM_EMAIL || "B. Photography <noreply@bphoto.at>",
        to: email,
        subject: copy.subject,
        html: createGalleryMailHtml({
          heading: copy.subject,
          intro: copy.intro,
          email,
          password,
          ctaText: copy.ctaText,
          ctaUrl: copy.ctaUrl
        })
      });

      return json(200, { success: true, user: mapUser(created.user) });
    }

    if (action === "update") {
      const userId = String(body.userId || "").trim();
      const note = String(body.note || "").trim();
      const lang = body.lang === "de" ? "de" : "hu";

      if (!userId) return json(400, { error: "User ID required" });

      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data?.user) return json(404, { error: "User not found" });

      const nextMetadata = {
        ...(data.user.user_metadata || {}),
        lang,
        role: data.user.user_metadata?.role || "client",
        admin_note: note
      };

      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: nextMetadata
      });

      if (updateError) return json(400, { error: updateError.message });
      return json(200, { success: true, user: mapUser(updated.user) });
    }

    if (action === "reset_password") {
      const userId = String(body.userId || "").trim();
      if (!userId) return json(400, { error: "User ID required" });

      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data?.user?.email) return json(404, { error: "User not found" });

      const password = generatePassword();
      const lang = data.user.user_metadata?.lang === "de" ? "de" : "hu";
      const nextMetadata = {
        ...(data.user.user_metadata || {}),
        password_updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          ...nextMetadata,
          must_change_password: true
        }
      });
      if (updateError) return json(400, { error: updateError.message });

      const copy = toGalleryCopy(lang, password);
      await sendResendMail({
        from: process.env.GALLERY_FROM_EMAIL || "B. Photography <noreply@bphoto.at>",
        to: data.user.email,
        subject: copy.subject,
        html: createGalleryMailHtml({
          heading: copy.subject,
          intro: lang === "de"
            ? "Dein Passwort wurde zurückgesetzt. Mit diesem temporären Passwort kannst du dich wieder einloggen und direkt ein eigenes neues Passwort setzen."
            : "A jelszavad újra lett állítva. Ezzel az ideiglenes jelszóval újra be tudsz lépni, majd rögtön beállíthatod a sajátodat.",
          email: data.user.email,
          password,
          ctaText: copy.ctaText,
          ctaUrl: copy.ctaUrl
        })
      });

      return json(200, { success: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
