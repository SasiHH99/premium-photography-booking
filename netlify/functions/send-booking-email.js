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

function getBookingMailConfig() {
  const from =
    process.env.BOOKING_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    process.env.GALLERY_FROM_EMAIL ||
    "B. Photography <noreply@bphoto.at>";

  const adminRecipients = parseEmailRecipients(
    process.env.BOOKING_TO_EMAIL,
    process.env.CONTACT_TO_EMAIL,
    "busi.sandor@bphoto.at"
  );

  return { from, adminRecipients };
}

function createAdminMailHtml({ heading, intro, name, email, bookingDate, packageName, message }) {
  return createMailLayout({
    heading,
    intro,
    sections: `
      ${createInfoTable([
        { label: "Név / Name", value: name },
        { label: "Email", value: email },
        { label: "Dátum / Datum", value: bookingDate },
        { label: "Csomag / Paket", value: packageName }
      ])}
      ${createNoteBlock("Üzenet / Nachricht", message || "-")}
    `
  });
}

function createClientMailHtml({ lang, name, bookingDate, packageName }) {
  const isHu = lang === "hu";

  return createMailLayout({
    heading: isHu ? "Megérkezett a foglalási kérésed" : "Deine Buchungsanfrage ist eingegangen",
    intro: isHu
      ? `Szia ${name}! Megkaptam a foglalási kérésedet. Átnézem a részleteket, és általában 24 órán belül visszajelzek.`
      : `Hallo ${name}! Deine Buchungsanfrage ist angekommen. Ich prüfe jetzt die Details und melde mich in der Regel innerhalb von 24 Stunden persönlich zurück.`,
    sections: `
      ${createInfoTable([
        { label: isHu ? "Dátum" : "Datum", value: bookingDate },
        { label: isHu ? "Csomag" : "Paket", value: packageName }
      ])}
      ${createNoteBlock(
        isHu ? "Mi következik?" : "Wie geht es weiter?",
        isHu
          ? "Egyeztetjük a pontos irányt, a helyszínt és a részleteket, hogy a fotózás valóban hozzád illő és jól előkészített legyen."
          : "Als Nächstes stimmen wir Richtung, Location und Details ab, damit das Shooting wirklich zu dir passt und sauber vorbereitet ist."
      )}
    `,
    ctaText: isHu ? "Kapcsolat oldal" : "Kontaktseite",
    ctaUrl: isHu ? "https://bphoto.at/hu/kapcsolat.html" : "https://bphoto.at/de/kontakt.html",
    footerNote: isHu
      ? "Ha időközben pontosítanál valamit, nyugodtan válaszolj erre az e-mailre."
      : "Wenn du in der Zwischenzeit etwas ergänzen möchtest, antworte einfach auf diese E-Mail."
  });
}

async function notifyAdmins({ from, replyTo, recipients, subject, html }) {
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
    } catch (error) {
      console.error(`booking admin email failed for ${recipient}:`, error);
      results.push({
        recipient,
        ok: false,
        error: String(error?.message || error).slice(0, 400)
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

  const supabase = createServiceClient();
  const { from, adminRecipients } = getBookingMailConfig();

  try {
    const data = JSON.parse(event.body || "{}");
    const lang = data.lang === "hu" ? "hu" : "de";
    const bookingDate = String(data.booking_date || "").trim();
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email || "");
    const packageName = String(data.package || "").trim();
    const message = String(data.message || "").trim();

    if (!bookingDate || !name || !email || !packageName) {
      return json(400, { error: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

    const adminHeading = lang === "hu" ? "Új foglalási kérés" : "Neue Buchungsanfrage";
    const adminIntro =
      lang === "hu"
        ? "Érkezett egy új foglalási kérés a weboldalról."
        : "Es ist eine neue Buchungsanfrage über die Website eingegangen.";

    const { data: insertedBooking, error: insertError } = await supabase
      .from("bookings_v2")
      .insert({
        booking_date: bookingDate,
        name,
        email,
        package: packageName,
        message,
        status: "pending",
        lang
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Booking insert failed: ${insertError.message}`);
    }

    const adminHtml = createAdminMailHtml({
      heading: adminHeading,
      intro: adminIntro,
      name,
      email,
      bookingDate,
      packageName,
      message
    });

    const adminResults = await notifyAdmins({
      from,
      replyTo: email,
      recipients: adminRecipients,
      subject: `${adminHeading} - ${name}`,
      html: adminHtml
    });

    let clientNotification = { ok: false, recipient: email };
    try {
      await sendResendMail({
        from,
        to: email,
        replyTo: adminRecipients[0] || process.env.CONTACT_TO_EMAIL || "busi.sandor@bphoto.at",
        subject:
          lang === "hu"
            ? "Megérkezett a foglalási kérésed - B. Photography"
            : "Deine Buchungsanfrage ist eingegangen - B. Photography",
        html: createClientMailHtml({
          lang,
          name,
          bookingDate,
          packageName
        })
      });

      clientNotification = { ok: true, recipient: email };
    } catch (error) {
      console.error("booking client email failed:", error);
      clientNotification = {
        ok: false,
        recipient: email,
        error: String(error?.message || error).slice(0, 400)
      };
    }

    return json(200, {
      success: true,
      bookingId: insertedBooking?.id || null,
      adminNotifications: adminResults,
      clientNotification
    });
  } catch (error) {
    console.error("send-booking-email failed:", error);
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
