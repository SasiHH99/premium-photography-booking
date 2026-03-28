import {
  CORS_HEADERS,
  json,
  createServiceClient,
  updateResendContactSubscription
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
    const token = String(data.token || "").trim();

    if (!token) {
      return json(400, { error: "Missing unsubscribe token" });
    }

    const { data: subscriber, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, lang, status, unsubscribe_token, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`newsletter_subscribers lookup failed: ${lookupError.message}`);
    }

    if (!subscriber) {
      return json(404, { error: "Invalid or expired token" });
    }

    if (subscriber.status === "unsubscribed" && subscriber.unsubscribed_at) {
      return json(200, {
        success: true,
        state: "already_unsubscribed",
        lang: subscriber.lang || "de"
      });
    }

    const unsubscribedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: unsubscribedAt,
        confirmation_token: null
      })
      .eq("id", subscriber.id);

    if (updateError) {
      throw new Error(`newsletter_subscribers update failed: ${updateError.message}`);
    }

    try {
      await updateResendContactSubscription({
        email: subscriber.email,
        unsubscribed: true
      });
    } catch (resendError) {
      console.error("newsletter unsubscribe sync failed:", resendError);
    }

    return json(200, {
      success: true,
      state: "unsubscribed",
      lang: subscriber.lang || "de"
    });
  } catch (error) {
    console.error("newsletter-unsubscribe failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
