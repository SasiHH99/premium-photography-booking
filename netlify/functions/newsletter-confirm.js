import {
  CORS_HEADERS,
  json,
  createServiceClient,
  createResendAudienceContact,
  updateResendContactSubscription,
  sendResendMail,
  createNewsletterWelcomeHtml,
  createNewsletterUnsubscribeUrl,
  generateToken
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
      return json(400, { error: "Missing confirmation token" });
    }

    const { data: subscriber, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, lang, status, confirmation_token, confirmed_at, resend_contact_id, unsubscribe_token")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`newsletter_subscribers lookup failed: ${lookupError.message}`);
    }

    if (!subscriber) {
      return json(404, { error: "Invalid or expired token" });
    }

    if (subscriber.status === "confirmed" && subscriber.confirmed_at) {
      return json(200, {
        success: true,
        state: "already_confirmed",
        lang: subscriber.lang || "de"
      });
    }

    const confirmedAt = new Date().toISOString();
    const unsubscribeToken = subscriber.unsubscribe_token || generateToken(24);

    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "confirmed",
        confirmed_at: confirmedAt,
        confirmation_token: null,
        unsubscribe_token: unsubscribeToken,
        unsubscribed_at: null
      })
      .eq("id", subscriber.id);

    if (updateError) {
      throw new Error(`newsletter_subscribers update failed: ${updateError.message}`);
    }

    let audienceResult = { ok: false, skipped: true };
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (audienceId) {
      try {
        audienceResult = await createResendAudienceContact({
          audienceId,
          email: subscriber.email
        });

        await updateResendContactSubscription({
          email: subscriber.email,
          unsubscribed: false
        });

        const contactId = audienceResult?.data?.id || audienceResult?.data?.data?.id || null;
        if (contactId) {
          const { error: contactUpdateError } = await supabase
            .from("newsletter_subscribers")
            .update({ resend_contact_id: contactId })
            .eq("id", subscriber.id);

          if (contactUpdateError) {
            console.error("newsletter contact id update failed:", contactUpdateError);
          }
        }
      } catch (audienceError) {
        console.error("newsletter audience sync failed:", audienceError);
        audienceResult = {
          ok: false,
          skipped: false,
          error: String(audienceError?.message || audienceError).slice(0, 400)
        };
      }
    }

    const unsubscribeUrl = createNewsletterUnsubscribeUrl(subscriber.lang || "de", unsubscribeToken);
    const welcomeSentAt = new Date().toISOString();
    const from =
      process.env.NEWSLETTER_FROM_EMAIL ||
      process.env.CONTACT_FROM_EMAIL ||
      "B. Photography <noreply@bphoto.at>";

    try {
      await sendResendMail({
        from,
        to: subscriber.email,
        subject:
          subscriber.lang === "hu"
            ? "Feliratkozás sikeres - B. Photography"
            : "Du bist eingetragen - B. Photography",
        html: createNewsletterWelcomeHtml({
          lang: subscriber.lang || "de",
          email: subscriber.email,
          unsubscribeUrl
        })
      });

      const { error: welcomeUpdateError } = await supabase
        .from("newsletter_subscribers")
        .update({ welcome_sent_at: welcomeSentAt })
        .eq("id", subscriber.id);

      if (welcomeUpdateError) {
        console.error("newsletter welcome timestamp update failed:", welcomeUpdateError);
      }
    } catch (welcomeError) {
      console.error("newsletter welcome mail failed:", welcomeError);
    }

    return json(200, {
      success: true,
      state: "confirmed",
      lang: subscriber.lang || "de",
      audienceResult
    });
  } catch (error) {
    console.error("newsletter-confirm failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
