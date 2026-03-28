import { json, createServiceClient } from "./_admin.js";
import { processScheduledCampaignJobs } from "./_newsletterCampaigns.js";

export const config = {
  schedule: "*/15 * * * *"
};

export const handler = async () => {
  const supabase = createServiceClient();
  const from =
    process.env.NEWSLETTER_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    "B. Photography <noreply@bphoto.at>";

  try {
    const result = await processScheduledCampaignJobs({
      supabase,
      from,
      createdBy: null
    });

    return json(200, {
      success: true,
      processedCount: result.processedCount,
      jobs: result.jobs
    });
  } catch (error) {
    console.error("newsletter-broadcast-runner failed:", error);
    return json(500, {
      error: "Scheduled newsletter run failed",
      details: String(error?.message || error)
    });
  }
};
