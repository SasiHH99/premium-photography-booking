import {
  CORS_HEADERS,
  json,
  verifyAdminFromEvent,
  generateToken,
  sendResendMail,
  createNewsletterConfirmationUrl,
  createNewsletterMailHtml
} from "./_admin.js";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation \"public.${relation}\" does not exist`);
}

const SETUP_ERROR =
  "Hiányzik a newsletter_subscribers tábla. Futtasd a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase } = admin;

  try {
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, lang, status, source, consent, confirmed_at, resend_contact_id, last_confirmation_sent_at, unsubscribed_at, welcome_sent_at, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (isMissingRelation(error, "newsletter_subscribers")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });
      return json(200, { subscribers: data || [] });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const action = String(body.action || "").trim();

    if (action !== "resend_confirmation") {
      return json(400, { error: "Unsupported action" });
    }

    const id = Number(body.id || 0);
    if (!id) {
      return json(400, { error: "Subscriber ID required" });
    }

    const { data: subscriber, error: subscriberError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, lang, status")
      .eq("id", id)
      .maybeSingle();

    if (isMissingRelation(subscriberError, "newsletter_subscribers")) {
      return json(500, { error: SETUP_ERROR });
    }

    if (subscriberError) {
      return json(400, { error: subscriberError.message });
    }

    if (!subscriber) {
      return json(404, { error: "A feliratkozó nem található." });
    }

    if (subscriber.status !== "pending") {
      return json(400, { error: "Megerősítő levelet csak függőben lévő feliratkozónál lehet újraküldeni." });
    }

    const token = generateToken(24);
    const confirmationUrl = createNewsletterConfirmationUrl(subscriber.lang || "de", token);
    const sentAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "pending",
        confirmation_token: token,
        last_confirmation_sent_at: sentAt
      })
      .eq("id", subscriber.id);

    if (updateError) {
      return json(400, { error: updateError.message });
    }

    const from =
      process.env.NEWSLETTER_FROM_EMAIL ||
      process.env.CONTACT_FROM_EMAIL ||
      "B. Photography <noreply@bphoto.at>";

    await sendResendMail({
      from,
      to: subscriber.email,
      subject:
        subscriber.lang === "hu"
          ? "Erősítsd meg a feliratkozásodat - B. Photography"
          : "Bestätige deine Anmeldung - B. Photography",
      html: createNewsletterMailHtml({
        lang: subscriber.lang || "de",
        email: subscriber.email,
        confirmationUrl
      })
    });

    return json(200, {
      success: true,
      sentAt
    });
  } catch (error) {
    console.error("admin-newsletter-subscribers failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
