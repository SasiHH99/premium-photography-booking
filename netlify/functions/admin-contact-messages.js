import {
  CORS_HEADERS,
  json,
  parseEmailRecipients,
  createMailLayout,
  createInfoTable,
  createNoteBlock,
  sendResendMail,
  verifyAdminFromEvent
} from "./_admin.js";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation "public.${relation}" does not exist`);
}

const SETUP_ERROR =
  "Hiányzik a contact_messages tábla. Futtasd a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";

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

function createContactMailHtml({ heading, intro, name, email, message }) {
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

async function resendContactNotification({ contact }) {
  const lang = contact.lang === "hu" ? "hu" : contact.lang === "en" ? "en" : "de";
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

  const { from, adminRecipients } = getContactMailConfig();
  const results = [];

  for (const recipient of adminRecipients) {
    try {
      await sendResendMail({
        from,
        to: recipient,
        replyTo: contact.email,
        subject: `${heading} - ${contact.name}`,
        html: createContactMailHtml({
          heading,
          intro,
          name: contact.name,
          email: contact.email,
          message: contact.message
        })
      });

      results.push({ recipient, ok: true });
    } catch (error) {
      console.error(`contact resend failed for ${recipient}:`, error);
      results.push({
        recipient,
        ok: false,
        error: String(error?.message || error).slice(0, 400)
      });
    }
  }

  return {
    sender: from,
    recipients: adminRecipients,
    sentCount: results.filter((item) => item.ok).length,
    failedCount: results.filter((item) => !item.ok).length,
    notifications: results
  };
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
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMissingRelation(error, "contact_messages")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });
      return json(200, { messages: data || [] });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const id = Number(body.id || 0);

    if (!id) return json(400, { error: "Message ID required" });

    if (body.action === "resend_notification") {
      const { data: contact, error: contactError } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (isMissingRelation(contactError, "contact_messages")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (contactError || !contact) {
        return json(404, { error: "Kapcsolati üzenet nem található." });
      }

      const result = await resendContactNotification({ contact });

      return json(200, {
        success: true,
        message:
          result.sentCount > 0
            ? `Értesítő email újraküldve. Sikeres: ${result.sentCount}, hiba: ${result.failedCount}.`
            : "Az értesítő email újraküldése nem sikerült egyetlen címre sem.",
        ...result
      });
    }

    const status = String(body.status || "new").trim();
    const adminNote = String(body.adminNote || "").trim();

    const { error } = await supabase
      .from("contact_messages")
      .update({ status, admin_note: adminNote || null })
      .eq("id", id);

    if (isMissingRelation(error, "contact_messages")) {
      return json(500, { error: SETUP_ERROR });
    }

    if (error) return json(400, { error: error.message });

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
