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

const COPY = {
  hu: {
    adminHeading: "Új kapcsolatfelvétel",
    adminIntro: "Érkezett egy új üzenet a kapcsolat oldalról.",
    clientSubject: "Megérkezett az üzeneted - B. Photography",
    clientHeading: "Megérkezett az üzeneted",
    clientIntro: (name) =>
      `Szia ${name}! Köszönöm az üzenetet. Átnézem a részleteket, és általában 24 órán belül visszajelzek.`,
    nextLabel: "Mi történik most?",
    nextBody:
      "Ha a fotózás iránya már nagyjából tiszta, a következő lépés egy rövid egyeztetés a részletekről, időpontról és helyszínről.",
    ctaText: "Foglalás megnyitása",
    ctaUrl: "https://bphoto.at/hu/foglalas.html",
    footerNote: "Ha közben kiegészítenél valamit, egyszerűen válaszolj erre az e-mailre."
  },
  de: {
    adminHeading: "Neue Kontaktanfrage",
    adminIntro: "Es ist eine neue Nachricht über das Kontaktformular eingegangen.",
    clientSubject: "Deine Nachricht ist eingegangen - B. Photography",
    clientHeading: "Deine Nachricht ist eingegangen",
    clientIntro: (name) =>
      `Hallo ${name}! Danke für deine Nachricht. Ich prüfe jetzt die Details und melde mich in der Regel innerhalb von 24 Stunden zurück.`,
    nextLabel: "Wie geht es weiter?",
    nextBody:
      "Wenn die Richtung des Shootings schon klar ist, stimmen wir als Nächstes kurz Stil, Termin und Location ab.",
    ctaText: "Terminseite öffnen",
    ctaUrl: "https://bphoto.at/de/termin.html",
    footerNote: "Wenn du in der Zwischenzeit noch etwas ergänzen möchtest, antworte einfach auf diese E-Mail."
  },
  en: {
    adminHeading: "New contact request",
    adminIntro: "A new message came in through the contact page.",
    clientSubject: "Your message is in - B. Photography",
    clientHeading: "Your message is in",
    clientIntro: (name) =>
      `Hi ${name}! Thanks for your message. I will review the details and usually reply within 24 hours.`,
    nextLabel: "What happens next?",
    nextBody:
      "If the direction is already fairly clear, the next step is a short alignment on style, timing and location.",
    ctaText: "Open booking",
    ctaUrl: "https://bphoto.at/en/booking.html",
    footerNote: "If you want to add anything in the meantime, just reply to this email."
  }
};

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

function createAdminMailHtml({ copy, name, email, message }) {
  return createMailLayout({
    heading: copy.adminHeading,
    intro: copy.adminIntro,
    sections: `
      ${createInfoTable([
        { label: "Név / Name", value: name },
        { label: "Email", value: email }
      ])}
      ${createNoteBlock("Üzenet / Nachricht", message)}
    `
  });
}

function createClientMailHtml({ copy, name, email, message }) {
  return createMailLayout({
    heading: copy.clientHeading,
    intro: copy.clientIntro(name),
    sections: `
      ${createInfoTable([
        { label: "Email", value: email }
      ])}
      ${createNoteBlock(copy.nextLabel, copy.nextBody)}
      ${createNoteBlock("Message / Nachricht", message || "-")}
    `,
    ctaText: copy.ctaText,
    ctaUrl: copy.ctaUrl,
    footerNote: copy.footerNote
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
    const copy = COPY[lang];
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email || "");
    const message = String(data.message || "").trim();

    if (!name || !email || !message) {
      return json(400, { error: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

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
      subject: `${copy.adminHeading} - ${name}`,
      html: createAdminMailHtml({ copy, name, email, message })
    });

    const sentCount = notifications.filter((item) => item.ok).length;
    const failedCount = notifications.length - sentCount;

    let clientNotification = { ok: false, recipient: email };
    try {
      await sendResendMail({
        from,
        to: email,
        replyTo: adminRecipients[0] || process.env.CONTACT_TO_EMAIL || "busi.sandor@bphoto.at",
        subject: copy.clientSubject,
        html: createClientMailHtml({ copy, name, email, message })
      });

      clientNotification = { ok: true, recipient: email };
    } catch (clientError) {
      console.error("contact client email failed:", clientError);
      clientNotification = {
        ok: false,
        recipient: email,
        error: String(clientError?.message || clientError).slice(0, 400)
      };
    }

    return json(200, {
      success: true,
      stored: !insertError,
      adminNotified: sentCount > 0,
      partial: failedCount > 0,
      sender: from,
      recipients: adminRecipients,
      notificationCount: sentCount,
      failedCount,
      notifications,
      clientNotification
    });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
