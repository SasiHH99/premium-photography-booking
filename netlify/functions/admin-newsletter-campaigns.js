import {
  CORS_HEADERS,
  json,
  verifyAdminFromEvent,
  isValidEmail,
  sendResendMail,
  createNewsletterCampaignHtml
} from "./_admin.js";
import {
  NEWSLETTER_SETUP_ERROR,
  isMissingRelation,
  cleanText,
  sendCampaignBatch,
  sendFollowupBatch,
  processScheduledCampaignJobs
} from "./_newsletterCampaigns.js";

function buildCampaignDefaults(lang = "de") {
  if (lang === "hu") {
    return {
      subject: "Szabad időpontok és új sorozatok | B. Photography",
      heading: "Új szabad időpontok és friss képi anyagok",
      intro: "Rövid frissítés az aktuális időpontokról, új sorozatokról és kiválasztott fotózási lehetőségekről.",
      body:
        "Ha korán szeretnél értesülni az új időpontokról és friss anyagokról, ez a lista erre való.\n\nHa már most tudod, hogy fotózást szeretnél, innen rögtön tovább is mehetsz a foglalásra.",
      ctaText: "Időpontot kérek",
      ctaUrl: "https://bphoto.at/hu/foglalas.html"
    };
  }

  return {
    subject: "Freie Termine und neue Serien | B. Photography",
    heading: "Neue freie Termine und frische Bildserien",
    intro: "Kurzes Update zu aktuellen Verfügbarkeiten, neuen Serien und ausgewählten Shooting-Möglichkeiten.",
    body:
      "Wenn du früh über neue Termine und frische Arbeiten informiert werden möchtest, ist diese Liste genau dafür da.\n\nWenn du schon weißt, dass du ein Shooting planst, kannst du direkt deine Anfrage senden.",
    ctaText: "Termin anfragen",
    ctaUrl: "https://bphoto.at/de/termin.html"
  };
}

function normalizePayload(body = {}) {
  const lang = body.lang === "hu" ? "hu" : "de";
  const defaults = buildCampaignDefaults(lang);

  return {
    lang,
    presetKey: cleanText(body.presetKey || "", 60),
    subject: cleanText(body.subject || defaults.subject, 160),
    heading: cleanText(body.heading || defaults.heading, 160),
    intro: cleanText(body.intro || defaults.intro, 320),
    campaignBody: cleanText(body.body || defaults.body, 5000),
    ctaText: cleanText(body.ctaText || defaults.ctaText, 60),
    ctaUrl: cleanText(body.ctaUrl || defaults.ctaUrl, 260)
  };
}

function ensureCampaignPayload(payload) {
  if (!payload.subject || !payload.heading || !payload.campaignBody || !payload.ctaText || !payload.ctaUrl) {
    throw new Error("A kampányhoz tárgy, heading, szöveg és CTA is kell.");
  }
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase, user } = admin;
  const senderSource =
    process.env.NEWSLETTER_FROM_EMAIL ? "NEWSLETTER_FROM_EMAIL" :
    process.env.CONTACT_FROM_EMAIL ? "CONTACT_FROM_EMAIL" :
    process.env.BOOKING_FROM_EMAIL ? "BOOKING_FROM_EMAIL" :
    process.env.GALLERY_FROM_EMAIL ? "GALLERY_FROM_EMAIL" :
    "default fallback";

  const from =
    process.env.NEWSLETTER_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    process.env.BOOKING_FROM_EMAIL ||
    process.env.GALLERY_FROM_EMAIL ||
    "B. Photography <noreply@bphoto.at>";

  try {
    if (event.httpMethod === "GET") {
      const [{ data: logs, error: logsError }, { data: schedules, error: schedulesError }] = await Promise.all([
        supabase
          .from("newsletter_campaign_logs")
          .select("id, type, lang, subject, heading, intro, body, cta_text, cta_url, recipient_count, sent_count, failed_count, created_at")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("newsletter_broadcast_jobs")
          .select("id, lang, preset_key, subject, heading, scheduled_for, status, recipient_count, sent_count, failed_count, created_at, processed_at")
          .order("scheduled_for", { ascending: true })
          .limit(12)
      ]);

      if (isMissingRelation(logsError, "newsletter_campaign_logs") || isMissingRelation(schedulesError, "newsletter_broadcast_jobs")) {
        return json(500, { error: NEWSLETTER_SETUP_ERROR });
      }

      if (logsError) return json(400, { error: logsError.message });
      if (schedulesError) return json(400, { error: schedulesError.message });
      return json(200, {
        logs: logs || [],
        schedules: schedules || [],
        diagnostics: {
          from,
          senderSource,
          publicSiteUrl: process.env.PUBLIC_SITE_URL || "https://bphoto.at",
          resendAudienceConfigured: Boolean(process.env.RESEND_AUDIENCE_ID)
        }
      });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const action = String(body.action || "").trim();
    const payload = normalizePayload(body);

    if (action === "send_test") {
      ensureCampaignPayload(payload);
      const testEmail = String(body.testEmail || "").trim().slice(0, 120).toLowerCase();
      if (!isValidEmail(testEmail)) {
        return json(400, { error: "Érvényes teszt email cím kell." });
      }

      await sendResendMail({
        from,
        to: testEmail,
        subject: `[TESZT] ${payload.subject}`,
        html: createNewsletterCampaignHtml({
          lang: payload.lang,
          heading: payload.heading,
          intro: payload.intro,
          body: payload.campaignBody,
          ctaText: payload.ctaText,
          ctaUrl: payload.ctaUrl,
          isTest: true
        })
      });

      return json(200, {
        success: true,
        message: `Tesztlevél elküldve erre: ${testEmail}. Küldő: ${from}.`,
        sender: from,
        senderSource
      });
    }

    if (action === "send_campaign") {
      ensureCampaignPayload(payload);
      const result = await sendCampaignBatch({
        supabase,
        from,
        lang: payload.lang,
        subject: payload.subject,
        heading: payload.heading,
        intro: payload.intro,
        body: payload.campaignBody,
        ctaText: payload.ctaText,
        ctaUrl: payload.ctaUrl,
        createdBy: user.id,
        logType: "campaign"
      });

      if (!result.recipientCount) {
        return json(400, { error: "Nincs megerősített feliratkozó ehhez a nyelvhez." });
      }

      if (!result.sentCount && result.failedCount) {
        return json(502, {
          error: "A kampány minden címnél hibára futott. Ellenőrizd a küldő emailt és a Resend beállításokat.",
          details: (result.sampleErrors || []).join(" | ")
        });
      }

      return json(200, {
        success: true,
        message: `Kampány kiküldve. Sikeres: ${result.sentCount || 0}, hiba: ${result.failedCount || 0}.`,
        sender: from,
        senderSource,
        ...result
      });
    }

    if (action === "send_followup") {
      const result = await sendFollowupBatch({
        supabase,
        from,
        lang: payload.lang,
        createdBy: user.id,
        logType: "followup"
      });

      if (!result.recipientCount) {
        return json(400, { error: "Nincs esedékes follow-up küldés ehhez a nyelvhez." });
      }

      if (!result.sentCount && result.failedCount) {
        return json(502, {
          error: "A follow-up minden címnél hibára futott. Ellenőrizd a Resend beállításokat.",
          details: (result.sampleErrors || []).join(" | ")
        });
      }

      return json(200, {
        success: true,
        message: `Follow-up kiküldve. Sikeres: ${result.sentCount || 0}, hiba: ${result.failedCount || 0}.`,
        sender: from,
        senderSource,
        ...result
      });
    }

    if (action === "schedule_campaign") {
      ensureCampaignPayload(payload);
      const scheduledForRaw = String(body.scheduledFor || "").trim();
      const scheduledFor = new Date(scheduledForRaw);

      if (!scheduledForRaw || Number.isNaN(scheduledFor.getTime())) {
        return json(400, { error: "Érvényes időpont kell az ütemezéshez." });
      }

      if (scheduledFor.getTime() < Date.now() + 60 * 1000) {
        return json(400, { error: "Az ütemezett időpont legalább 1 perccel legyen a jelenlegi idő után." });
      }

      const { data, error } = await supabase
        .from("newsletter_broadcast_jobs")
        .insert({
          lang: payload.lang,
          preset_key: payload.presetKey || null,
          subject: payload.subject,
          heading: payload.heading,
          intro: payload.intro,
          body: payload.campaignBody,
          cta_text: payload.ctaText,
          cta_url: payload.ctaUrl,
          scheduled_for: scheduledFor.toISOString(),
          status: "scheduled",
          created_by: user.id
        })
        .select("id, scheduled_for, status")
        .single();

      if (isMissingRelation(error, "newsletter_broadcast_jobs")) {
        return json(500, { error: NEWSLETTER_SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });

      return json(200, {
        success: true,
        message: "A kampány időzítve.",
        job: data
      });
    }

    if (action === "run_scheduled") {
      const result = await processScheduledCampaignJobs({
        supabase,
        from,
        createdBy: user.id
      });

      return json(200, {
        success: true,
        processedCount: result.processedCount,
        jobs: result.jobs
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
