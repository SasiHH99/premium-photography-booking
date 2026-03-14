import {
  CORS_HEADERS,
  json,
  normalizeEmail,
  isValidEmail,
  createServiceClient,
  sendResendMail,
  createMailLayout,
  createInfoTable,
  createNoteBlock
} from "./_admin.js";

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

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const from = process.env.CONTACT_FROM_EMAIL || "B. Photography <noreply@bphoto.at>";
  const to = process.env.CONTACT_TO_EMAIL || "busi.sandor@bphoto.at";
  const supabase = createServiceClient();

  try {
    const data = JSON.parse(event.body || "{}");
    const lang = data.lang === "hu" ? "hu" : "de";
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email || "");
    const message = String(data.message || "").trim();

    if (!name || !email || !message) {
      return json(400, { error: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

    const heading = lang === "hu" ? "Új kapcsolatfelvétel" : "Neue Kontaktanfrage";
    const intro =
      lang === "hu"
        ? "Érkezett egy új üzenet a kapcsolat oldalról."
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

    await sendResendMail({
      from,
      to,
      replyTo: email,
      subject: `${heading} - ${name}`,
      html: createMailHtml({ heading, intro, name, email, message })
    });

    return json(200, { success: true, stored: !insertError });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
