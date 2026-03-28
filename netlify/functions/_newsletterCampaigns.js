import {
  generateToken,
  sendResendMail,
  createNewsletterCampaignHtml,
  createNewsletterFollowupHtml,
  createNewsletterUnsubscribeUrl
} from "./_admin.js";

export const NEWSLETTER_SETUP_ERROR =
  "Hiányzik a newsletter_subscribers, newsletter_campaign_logs vagy newsletter_broadcast_jobs tábla. Futtasd újra a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";

export function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation \"public.${relation}\" does not exist`);
}

export function cleanText(value = "", max = 8000) {
  return String(value || "").trim().slice(0, max);
}

export async function ensureUnsubscribeToken(supabase, subscriber) {
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

export async function insertCampaignLog(supabase, payload) {
  const { error } = await supabase.from("newsletter_campaign_logs").insert(payload);
  if (error && !isMissingRelation(error, "newsletter_campaign_logs")) {
    throw new Error(`newsletter_campaign_logs insert failed: ${error.message}`);
  }
}

export async function sendCampaignBatch({
  supabase,
  from,
  lang,
  subject,
  heading,
  intro,
  body,
  ctaText,
  ctaUrl,
  createdBy = null,
  logType = "campaign"
}) {
  const { data: subscribers, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, lang, status, unsubscribe_token")
    .eq("status", "confirmed")
    .eq("lang", lang)
    .order("created_at", { ascending: true });

  if (isMissingRelation(error, "newsletter_subscribers")) {
    throw new Error(NEWSLETTER_SETUP_ERROR);
  }

  if (error) throw new Error(error.message);

  const recipients = subscribers || [];
  if (!recipients.length) {
    return { recipientCount: 0, sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;
  const sampleErrors = [];

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
          body,
          ctaText,
          ctaUrl,
          unsubscribeUrl
        })
      });

      sentCount += 1;
    } catch (sendError) {
      failedCount += 1;
      if (sampleErrors.length < 3) {
        sampleErrors.push(`${subscriber.email}: ${String(sendError?.message || sendError).slice(0, 180)}`);
      }
      console.error("newsletter campaign send failed:", subscriber.email, sendError);
    }
  }

  await insertCampaignLog(supabase, {
    type: logType,
    lang,
    subject,
    heading,
    intro,
    body,
    cta_text: ctaText,
    cta_url: ctaUrl,
    recipient_count: recipients.length,
    sent_count: sentCount,
    failed_count: failedCount,
    created_by: createdBy
  });

  return {
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    sampleErrors
  };
}

export async function sendFollowupBatch({
  supabase,
  from,
  lang,
  createdBy = null,
  logType = "followup"
}) {
  const { data: subscribers, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, lang, status, confirmed_at, welcome_sent_at, followup_sent_at, unsubscribe_token")
    .eq("status", "confirmed")
    .eq("lang", lang)
    .is("followup_sent_at", null)
    .order("confirmed_at", { ascending: true });

  if (isMissingRelation(error, "newsletter_subscribers")) {
    throw new Error(NEWSLETTER_SETUP_ERROR);
  }

  if (error) throw new Error(error.message);

  const now = Date.now();
  const eligible = (subscribers || []).filter((subscriber) => {
    const sourceDate = subscriber.welcome_sent_at || subscriber.confirmed_at;
    if (!sourceDate) return false;
    const ageMs = now - new Date(sourceDate).getTime();
    return ageMs >= 1000 * 60 * 60 * 24 * 2;
  });

  if (!eligible.length) {
    return { recipientCount: 0, sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;
  const sentIds = [];
  const sampleErrors = [];

  for (const subscriber of eligible) {
    try {
      const unsubscribeToken = await ensureUnsubscribeToken(supabase, subscriber);
      const unsubscribeUrl = createNewsletterUnsubscribeUrl(subscriber.lang || lang, unsubscribeToken);

      await sendResendMail({
        from,
        to: subscriber.email,
        subject:
          subscriber.lang === "hu"
            ? "Van már elképzelésed a következő fotózásról? | B. Photography"
            : "Planst du schon dein nächstes Shooting? | B. Photography",
        html: createNewsletterFollowupHtml({
          lang: subscriber.lang || lang,
          unsubscribeUrl
        })
      });

      sentCount += 1;
      sentIds.push(subscriber.id);
    } catch (sendError) {
      failedCount += 1;
      if (sampleErrors.length < 3) {
        sampleErrors.push(`${subscriber.email}: ${String(sendError?.message || sendError).slice(0, 180)}`);
      }
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
    type: logType,
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
    created_by: createdBy
  });

  return {
    recipientCount: eligible.length,
    sentCount,
    failedCount,
    sampleErrors
  };
}

export async function processScheduledCampaignJobs({
  supabase,
  from,
  createdBy = null,
  nowIso = new Date().toISOString()
}) {
  const { data: jobs, error } = await supabase
    .from("newsletter_broadcast_jobs")
    .select("id, lang, preset_key, subject, heading, intro, body, cta_text, cta_url, scheduled_for, status")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(10);

  if (isMissingRelation(error, "newsletter_broadcast_jobs")) {
    throw new Error(NEWSLETTER_SETUP_ERROR);
  }

  if (error) throw new Error(error.message);

  const dueJobs = jobs || [];
  const processed = [];

  for (const job of dueJobs) {
    const processingAt = new Date().toISOString();

    await supabase
      .from("newsletter_broadcast_jobs")
      .update({ status: "processing", last_run_at: processingAt, error_message: null })
      .eq("id", job.id);

    try {
      const result = await sendCampaignBatch({
        supabase,
        from,
        lang: job.lang,
        subject: job.subject,
        heading: job.heading,
        intro: job.intro,
        body: job.body,
        ctaText: job.cta_text,
        ctaUrl: job.cta_url,
        createdBy,
        logType: "scheduled_campaign"
      });

      const finalStatus =
        result.sentCount > 0 && result.failedCount > 0
          ? "partial"
          : result.sentCount > 0
            ? "sent"
            : result.recipientCount === 0
              ? "sent"
              : "failed";

      const processedAt = new Date().toISOString();
      await supabase
        .from("newsletter_broadcast_jobs")
        .update({
          status: finalStatus,
          recipient_count: result.recipientCount,
          sent_count: result.sentCount,
          failed_count: result.failedCount,
          last_run_at: processedAt,
          processed_at: processedAt,
          error_message: result.failedCount && !result.sentCount ? "Minden küldés hibára futott." : null
        })
        .eq("id", job.id);

      processed.push({ id: job.id, status: finalStatus, ...result });
    } catch (errorDuringJob) {
      const failedAt = new Date().toISOString();
      await supabase
        .from("newsletter_broadcast_jobs")
        .update({
          status: "failed",
          last_run_at: failedAt,
          processed_at: failedAt,
          error_message: String(errorDuringJob?.message || errorDuringJob).slice(0, 600)
        })
        .eq("id", job.id);

      processed.push({ id: job.id, status: "failed", error: String(errorDuringJob?.message || errorDuringJob) });
    }
  }

  return {
    processedCount: processed.length,
    jobs: processed
  };
}
