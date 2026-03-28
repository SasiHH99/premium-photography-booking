import {
  CORS_HEADERS,
  json,
  normalizeEmail,
  isValidEmail,
  createServiceClient,
  sendResendMail,
  generateToken,
  createNewsletterConfirmationUrl,
  createNewsletterMailHtml
} from "./_admin.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabase = createServiceClient();

  try {
    const data = JSON.parse(event.body || "{}");
    const lang = data.lang === "hu" ? "hu" : "de";
    const email = normalizeEmail(data.email || "");
    const consent = data.consent === true;
    const source = String(data.source || "homepage").trim().slice(0, 60) || "homepage";

    if (!email || !isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

    if (!consent) {
      return json(400, { error: "Consent required" });
    }

    const { data: existing, error: existingError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, confirmed_at")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`newsletter_subscribers lookup failed: ${existingError.message}`);
    }

    if (existing?.status === "confirmed" && existing?.confirmed_at) {
      return json(200, {
        success: true,
        state: "already_confirmed"
      });
    }

    const token = generateToken(24);
    const unsubscribeToken = generateToken(24);
    const confirmationUrl = createNewsletterConfirmationUrl(lang, token);

    const payload = {
      email,
      lang,
      consent: true,
      source,
      status: "pending",
      confirmation_token: token,
      unsubscribe_token: unsubscribeToken,
      confirmed_at: null,
      unsubscribed_at: null,
      welcome_sent_at: null,
      last_confirmation_sent_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(payload, { onConflict: "email" });

    if (upsertError) {
      throw new Error(`newsletter_subscribers upsert failed: ${upsertError.message}`);
    }

    const from =
      process.env.NEWSLETTER_FROM_EMAIL ||
      process.env.CONTACT_FROM_EMAIL ||
      "B. Photography <noreply@bphoto.at>";

    await sendResendMail({
      from,
      to: email,
      subject:
        lang === "hu"
          ? "Erősítsd meg a feliratkozásodat - B. Photography"
          : "Bestätige deine Anmeldung - B. Photography",
      html: createNewsletterMailHtml({ lang, email, confirmationUrl })
    });

    return json(200, {
      success: true,
      state: "confirmation_sent"
    });
  } catch (error) {
    console.error("newsletter-subscribe failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
