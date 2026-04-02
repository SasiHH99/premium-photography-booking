import {
  CORS_HEADERS,
  json,
  normalizeEmail,
  isValidEmail,
  parseEmailRecipients,
  createServiceClient,
  sendResendMail,
  createMailLayout,
  createInfoTable,
  createNoteBlock
} from "./_admin.js";

function getContactMailConfig() {
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    process.env.BOOKING_FROM_EMAIL ||
    process.env.GALLERY_FROM_EMAIL ||
    "B. Photography <noreply@bphoto.at>";

  const adminRecipients = parseEmailRecipients(
    process.env.CONTACT_TO_EMAIL,
    process.env.BOOKING_TO_EMAIL,
    "busi.sandor@bphoto.at"
  );

  return { from, adminRecipients };
}

function createMailHtml({ heading, intro, name, email, message }) {
  return createMailLayout({
    heading,
    intro,
    sections: `
      ${createInfoTable([
        { label: "Név / Name", value: name },
        { label: "Email", value: email }
      ])}
      ${createNoteBlock("Üzenet / Nachricht", message)}
    `
  });
}

async function notifyContactAdmins({ from, replyTo, recipients, subject, html }) {
  const results = [];

  for (const recipient of recipients) {
    try {
      await sendResendMail({
        from,
        to: recipient,
        replyTo,
        subject,
        html
      });

      results.push({ recipient, ok: true });
    } catch (mailError) {
      console.error(`contact email failed for ${recipient}:`, mailError);
      results.push({
        recipient,
        ok: false,
        error: String(mailError?.message || mailError).slice(0, 400)
      });
    }
  }

  return results;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const { from, adminRecipients } = getContactMailConfig();
  const supabase = createServiceClient();

  try {
    const data = JSON.parse(event.body || "{}");
    const lang = data.lang === "hu" ? "hu" : data.lang === "en" ? "en" : "de";
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email || "");
    const message = String(data.message || "").trim();

    if (!name || !email || !message) {
      return json(400, { error: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

    const heading =
      lang === "hu"
        ? "Új kapcsolatfelvétel"
        : lang === "en"
          ? "New contact request"
          : "Neue Kontaktanfrage";

    const intro =
      lang === "hu"
        ? "Érkezett egy új üzenet a kapcsolat oldalról."
        : lang === "en"
          ? "A new message came in through the contact page."
          : "Es ist eine neue Nachricht über das Kontaktformular eingegangen.";

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
      lang,
      status: "new",
      source: "contact_form"
    });

    if (insertError) {
      console.error("contact_messages insert failed", insertError);
    }

    const notifications = await notifyContactAdmins({
      from,
      replyTo: email,
      recipients: adminRecipients,
      subject: `${heading} - ${name}`,
      html: createMailHtml({ heading, intro, name, email, message })
    });

    const sentCount = notifications.filter((item) => item.ok).length;
    const failedCount = notifications.length - sentCount;

    return json(200, {
      success: true,
      stored: !insertError,
      adminNotified: sentCount > 0,
      partial: failedCount > 0,
      sender: from,
      recipients: adminRecipients,
      notificationCount: sentCount,
      failedCount,
      notifications
    });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
