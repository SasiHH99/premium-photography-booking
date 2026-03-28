import {
  CORS_HEADERS,
  json,
  verifyAdminFromEvent,
  isValidEmail,
  generateToken,
  sendResendMail,
  createNewsletterCampaignHtml,
  createNewsletterFollowupHtml,
  createNewsletterUnsubscribeUrl
} from "./_admin.js";

const SETUP_ERROR =
  "Hiányzik a newsletter_subscribers vagy a newsletter_campaign_logs tábla. Futtasd újra a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation \"public.${relation}\" does not exist`);
}

function cleanText(value = "", max = 8000) {
  return String(value || "").trim().slice(0, max);
}

function buildCampaignDefaults(lang = "de") {
  if (lang === "hu") {
    return {
      subject: "Szabad időpontok és új sorozatok | B. Photography",
      heading: "Új szabad időpontok és friss képi anyagok",
      intro: "Rövid frissítés a nyitott időpontokról, új sorozatokról és válogatott fotózási lehetőségekről.",
      body:
        "Ha szeretnél időben értesülni az új időpontokról és az új képi anyagokról, ez a lista erre szolgál.\n\nHa már most tudod, hogy fotózást szeretnél, elindíthatod a foglalást is.",
      ctaText: "Időpontot kérek",
      ctaUrl: "https://bphoto.at/hu/foglalas.html"
    };
  }

  return {
    subject: "Freie Termine und neue Serien | B. Photography",
    heading: "Neue freie Termine und frische Bildserien",
    intro: "Kurzes Update zu aktuellen Verfügbarkeiten, neuen Serien und ausgewählten Shooting-Möglichkeiten.",
    body:
      "Wenn du früh über neue Termine und neue Arbeiten informiert werden möchtest, ist diese Liste genau dafür da.\n\nWenn du schon weißt, dass du ein Shooting planst, kannst du auch direkt eine Anfrage senden.",
    ctaText: "Termin anfragen",
    ctaUrl: "https://bphoto.at/de/termin.html"
  };
}

async function ensureUnsubscribeToken(supabase, subscriber) {
  if (subscriber.unsubscribe_token) return subscriber.unsubscribe_token;

  const token = generateToken(24);
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({ unsubscribe_token: token })
    .eq("id", subscriber.id);

  if (error) {
    throw new Error(`Unsubscribe token update failed: ${error.message}`);
  }

  return token;
}

async function insertCampaignLog(supabase, payload) {
  const { error } = await supabase.from("newsletter_campaign_logs").insert(payload);
  if (error && !isMissingRelation(error, "newsletter_campaign_logs")) {
    throw new Error(`newsletter_campaign_logs insert failed: ${error.message}`);
  }
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase, user } = admin;

  try {
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("newsletter_campaign_logs")
        .select("id, type, lang, subject, heading, intro, body, cta_text, cta_url, recipient_count, sent_count, failed_count, created_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (isMissingRelation(error, "newsletter_campaign_logs")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });
      return json(200, { logs: data || [] });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const action = String(body.action || "").trim();
    const lang = body.lang === "hu" ? "hu" : "de";
    const defaults = buildCampaignDefaults(lang);
    const subject = cleanText(body.subject || defaults.subject, 160);
    const heading = cleanText(body.heading || defaults.heading, 160);
    const intro = cleanText(body.intro || defaults.intro, 320);
    const campaignBody = cleanText(body.body || defaults.body, 5000);
    const ctaText = cleanText(body.ctaText || defaults.ctaText, 60);
    const ctaUrl = cleanText(body.ctaUrl || defaults.ctaUrl, 260);
    const from =
      process.env.NEWSLETTER_FROM_EMAIL ||
      process.env.CONTACT_FROM_EMAIL ||
      "B. Photography <noreply@bphoto.at>";

    if (action === "send_test") {
      const testEmail = cleanText(body.testEmail || "", 120).toLowerCase();
      if (!isValidEmail(testEmail)) {
        return json(400, { error: "Érvényes teszt email cím kell." });
      }

      await sendResendMail({
        from,
        to: testEmail,
        subject: `[TESZT] ${subject}`,
        html: createNewsletterCampaignHtml({
          lang,
          heading,
          intro,
          body: campaignBody,
          ctaText,
          ctaUrl,
          isTest: true
        })
      });

      return json(200, { success: true, message: "Tesztlevél elküldve." });
    }

    if (action === "send_campaign") {
      const { data: subscribers, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, lang, status, unsubscribe_token")
        .eq("status", "confirmed")
        .eq("lang", lang)
        .order("created_at", { ascending: true });

      if (isMissingRelation(error, "newsletter_subscribers")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });

      const recipients = subscribers || [];
      if (!recipients.length) {
        return json(400, { error: "Nincs megerősített feliratkozó ehhez a nyelvhez." });
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const subscriber of recipients) {
        try {
          const unsubscribeToken = await ensureUnsubscribeToken(supabase, subscriber);
          const unsubscribeUrl = createNewsletterUnsubscribeUrl(subscriber.lang || lang, unsubscribeToken);

          await sendResendMail({
            from,
            to: subscriber.email,
            subject,
            html: createNewsletterCampaignHtml({
              lang: subscriber.lang || lang,
              heading,
              intro,
              body: campaignBody,
              ctaText,
              ctaUrl,
              unsubscribeUrl
            })
          });

          sentCount += 1;
        } catch (sendError) {
          failedCount += 1;
          console.error("newsletter campaign send failed:", subscriber.email, sendError);
        }
      }

      await insertCampaignLog(supabase, {
        type: "campaign",
        lang,
        subject,
        heading,
        intro,
        body: campaignBody,
        cta_text: ctaText,
        cta_url: ctaUrl,
        recipient_count: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount,
        created_by: user.id
      });

      return json(200, {
        success: true,
        recipientCount: recipients.length,
        sentCount,
        failedCount
      });
    }

    if (action === "send_followup") {
      const { data: subscribers, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, lang, status, confirmed_at, welcome_sent_at, followup_sent_at, unsubscribe_token")
        .eq("status", "confirmed")
        .eq("lang", lang)
        .is("followup_sent_at", null)
        .order("confirmed_at", { ascending: true });

      if (isMissingRelation(error, "newsletter_subscribers")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });

      const now = Date.now();
      const eligible = (subscribers || []).filter((subscriber) => {
        const sourceDate = subscriber.welcome_sent_at || subscriber.confirmed_at;
        if (!sourceDate) return false;
        const ageMs = now - new Date(sourceDate).getTime();
        return ageMs >= 1000 * 60 * 60 * 24 * 2;
      });

      if (!eligible.length) {
        return json(200, {
          success: true,
          recipientCount: 0,
          sentCount: 0,
          failedCount: 0
        });
      }

      let sentCount = 0;
      let failedCount = 0;
      const sentIds = [];

      for (const subscriber of eligible) {
        try {
          const unsubscribeToken = await ensureUnsubscribeToken(supabase, subscriber);
          const unsubscribeUrl = createNewsletterUnsubscribeUrl(subscriber.lang || lang, unsubscribeToken);

          await sendResendMail({
            from,
            to: subscriber.email,
            subject: subscriber.lang === "hu" ? "Van már elképzelésed a következő fotózásról? | B. Photography" : "Planst du schon dein nächstes Shooting? | B. Photography",
            html: createNewsletterFollowupHtml({
              lang: subscriber.lang || lang,
              unsubscribeUrl
            })
          });

          sentCount += 1;
          sentIds.push(subscriber.id);
        } catch (sendError) {
          failedCount += 1;
          console.error("newsletter followup send failed:", subscriber.email, sendError);
        }
      }

      if (sentIds.length) {
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({ followup_sent_at: new Date().toISOString() })
          .in("id", sentIds);

        if (updateError) {
          console.error("newsletter followup timestamp update failed:", updateError);
        }
      }

      await insertCampaignLog(supabase, {
        type: "followup",
        lang,
        subject: lang === "hu" ? "Második follow-up" : "Zweiter Follow-up",
        heading: lang === "hu" ? "Második follow-up" : "Zweiter Follow-up",
        intro: null,
        body: null,
        cta_text: lang === "hu" ? "Időpontot kérek" : "Termin anfragen",
        cta_url: lang === "hu" ? "https://bphoto.at/hu/foglalas.html" : "https://bphoto.at/de/termin.html",
        recipient_count: eligible.length,
        sent_count: sentCount,
        failed_count: failedCount,
        created_by: user.id
      });

      return json(200, {
        success: true,
        recipientCount: eligible.length,
        sentCount,
        failedCount
      });
    }

    return json(400, { error: "Unsupported action" });
  } catch (error) {
    console.error("admin-newsletter-campaigns failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
