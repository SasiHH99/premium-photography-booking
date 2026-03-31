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

function normalizeLang(value = "") {
  return value === "hu" || value === "en" ? value : "de";
}

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

const COPY = {
  hu: {
    adminHeading: "Új foglalási kérés",
    adminIntro: "Új foglalási kérés érkezett a weboldalról.",
    clientSubject: "Megérkezett a foglalási kérésed - B. Photography",
    clientHeading: "Megérkezett a foglalási kérésed",
    clientIntro: (name) => `Szia ${name}! Megkaptam a foglalási kérésedet. Átnézem a részleteket, és általában 24 órán belül visszajelzek.`,
    nextLabel: "Mi következik?",
    nextBody:
      "Egyeztetjük a pontos irányt, a helyszínt és a részleteket, hogy a fotózás valóban hozzád illő és jól előkészített legyen.",
    ctaText: "Kapcsolat oldal",
    ctaUrl: "https://bphoto.at/hu/kapcsolat.html",
    footerNote: "Ha időközben pontosítanál valamit, nyugodtan válaszolj erre az e-mailre.",
    labels: {
      name: "Név",
      email: "Email",
      bookingDate: "Dátum",
      packageName: "Csomag",
      projectType: "Projekt típusa",
      projectLocation: "Helyszín",
      projectScope: "Projekt jellege",
      contentUse: "Felhasználás",
      sensitiveLocation: "Érzékeny / engedélyköteles helyszín",
      message: "Üzenet"
    },
    projectType: {
      portrait: "Portré",
      couple: "Páros",
      family: "Családi",
      automotive: "Autós",
      branding: "Branding",
      drone: "Drón / légi anyag",
      real_estate: "Ingatlan",
      hospitality: "Hotel / hospitality",
      event: "Esemény",
      other: "Egyéb"
    },
    projectScope: {
      private: "Privát projekt",
      commercial: "Üzleti / kereskedelmi projekt",
      mixed: "Még nem eldöntött"
    },
    contentUse: {
      social: "Social media",
      website: "Weboldal",
      campaign: "Kampány / hirdetés",
      real_estate: "Ingatlan / bemutató",
      hotel: "Hotel / hospitality",
      personal: "Privát használat",
      other: "Egyéb"
    },
    sensitiveLocation: {
      no: "Nem, normál helyszín",
      yes: "Igen, előzetes ellenőrzés kell",
      unsure: "Még bizonytalan"
    }
  },
  de: {
    adminHeading: "Neue Buchungsanfrage",
    adminIntro: "Es ist eine neue Buchungsanfrage über die Website eingegangen.",
    clientSubject: "Deine Buchungsanfrage ist eingegangen - B. Photography",
    clientHeading: "Deine Buchungsanfrage ist eingegangen",
    clientIntro: (name) => `Hallo ${name}! Deine Buchungsanfrage ist angekommen. Ich prüfe jetzt die Details und melde mich in der Regel innerhalb von 24 Stunden persönlich zurück.`,
    nextLabel: "Wie geht es weiter?",
    nextBody:
      "Als Nächstes stimmen wir Richtung, Location und Details ab, damit das Shooting wirklich zu dir passt und sauber vorbereitet ist.",
    ctaText: "Kontaktseite",
    ctaUrl: "https://bphoto.at/de/kontakt.html",
    footerNote: "Wenn du in der Zwischenzeit etwas ergänzen möchtest, antworte einfach auf diese E-Mail.",
    labels: {
      name: "Name",
      email: "E-Mail",
      bookingDate: "Datum",
      packageName: "Paket",
      projectType: "Projektart",
      projectLocation: "Location",
      projectScope: "Projektumfang",
      contentUse: "Verwendungszweck",
      sensitiveLocation: "Genehmigungssensible Location",
      message: "Nachricht"
    },
    projectType: {
      portrait: "Portrait",
      couple: "Paar",
      family: "Familie",
      automotive: "Automotive",
      branding: "Branding",
      drone: "Drohne / Aerial",
      real_estate: "Immobilie",
      hospitality: "Hotel / Hospitality",
      event: "Event",
      other: "Sonstiges"
    },
    projectScope: {
      private: "Privates Projekt",
      commercial: "Kommerzielles Projekt",
      mixed: "Noch offen / gemischt"
    },
    contentUse: {
      social: "Social Media",
      website: "Website",
      campaign: "Kampagne / Anzeige",
      real_estate: "Immobilie / Exposé",
      hotel: "Hotel / Hospitality",
      personal: "Privat / Erinnerung",
      other: "Sonstiges"
    },
    sensitiveLocation: {
      no: "Nein, normale Location",
      yes: "Ja, bitte vorab prüfen",
      unsure: "Noch nicht sicher"
    }
  },
  en: {
    adminHeading: "New booking request",
    adminIntro: "A new booking request came in through the website.",
    clientSubject: "Your booking request is in - B. Photography",
    clientHeading: "Your booking request is in",
    clientIntro: (name) => `Hi ${name}! Your booking request came through. I will review the details and usually reply within 24 hours.`,
    nextLabel: "What happens next?",
    nextBody:
      "Next we align the direction, location and details so the shoot is genuinely tailored and properly prepared.",
    ctaText: "Contact page",
    ctaUrl: "https://bphoto.at/en/contact.html",
    footerNote: "If you want to add anything in the meantime, just reply to this email.",
    labels: {
      name: "Name",
      email: "Email",
      bookingDate: "Date",
      packageName: "Package",
      projectType: "Project type",
      projectLocation: "Location",
      projectScope: "Project scope",
      contentUse: "Intended use",
      sensitiveLocation: "Sensitive / permission-based location",
      message: "Message"
    },
    projectType: {
      portrait: "Portrait",
      couple: "Couple",
      family: "Family",
      automotive: "Automotive",
      branding: "Branding",
      drone: "Drone / aerial",
      real_estate: "Real estate",
      hospitality: "Hotel / hospitality",
      event: "Event",
      other: "Other"
    },
    projectScope: {
      private: "Private project",
      commercial: "Commercial project",
      mixed: "Still open / mixed"
    },
    contentUse: {
      social: "Social media",
      website: "Website",
      campaign: "Campaign / ads",
      real_estate: "Real estate / listing",
      hotel: "Hotel / hospitality",
      personal: "Personal use",
      other: "Other"
    },
    sensitiveLocation: {
      no: "No, standard location",
      yes: "Yes, please review in advance",
      unsure: "Not sure yet"
    }
  }
};

function resolveMappedValue(copy, group, value) {
  if (!value) return "-";
  return copy[group]?.[value] || value;
}

function buildStoredMessage({ copy, message, projectType, projectLocation, projectScope, contentUse, sensitiveLocation }) {
  const lines = [
    `${copy.labels.projectType}: ${resolveMappedValue(copy, "projectType", projectType)}`,
    `${copy.labels.projectLocation}: ${projectLocation || "-"}`,
    `${copy.labels.projectScope}: ${resolveMappedValue(copy, "projectScope", projectScope)}`,
    `${copy.labels.contentUse}: ${resolveMappedValue(copy, "contentUse", contentUse)}`,
    `${copy.labels.sensitiveLocation}: ${resolveMappedValue(copy, "sensitiveLocation", sensitiveLocation)}`
  ];

  return [message, "", lines.join("\n")].filter(Boolean).join("\n");
}

function createAdminMailHtml({ copy, name, email, bookingDate, packageName, projectType, projectLocation, projectScope, contentUse, sensitiveLocation, message }) {
  return createMailLayout({
    heading: copy.adminHeading,
    intro: copy.adminIntro,
    sections: `
      ${createInfoTable([
        { label: copy.labels.name, value: name },
        { label: copy.labels.email, value: email },
        { label: copy.labels.bookingDate, value: bookingDate },
        { label: copy.labels.packageName, value: packageName },
        { label: copy.labels.projectType, value: resolveMappedValue(copy, "projectType", projectType) },
        { label: copy.labels.projectLocation, value: projectLocation || "-" },
        { label: copy.labels.projectScope, value: resolveMappedValue(copy, "projectScope", projectScope) },
        { label: copy.labels.contentUse, value: resolveMappedValue(copy, "contentUse", contentUse) },
        { label: copy.labels.sensitiveLocation, value: resolveMappedValue(copy, "sensitiveLocation", sensitiveLocation) }
      ])}
      ${createNoteBlock(copy.labels.message, message || "-")}
    `
  });
}

function createClientMailHtml({ copy, name, bookingDate, packageName, projectType }) {
  return createMailLayout({
    heading: copy.clientHeading,
    intro: copy.clientIntro(name),
    sections: `
      ${createInfoTable([
        { label: copy.labels.bookingDate, value: bookingDate },
        { label: copy.labels.packageName, value: packageName },
        { label: copy.labels.projectType, value: resolveMappedValue(copy, "projectType", projectType) }
      ])}
      ${createNoteBlock(copy.nextLabel, copy.nextBody)}
    `,
    ctaText: copy.ctaText,
    ctaUrl: copy.ctaUrl,
    footerNote: copy.footerNote
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
    const lang = normalizeLang(data.lang);
    const copy = COPY[lang];

    const bookingDate = String(data.booking_date || "").trim();
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email || "");
    const packageName = String(data.package || "").trim();
    const message = String(data.message || "").trim();
    const projectType = String(data.project_type || "").trim();
    const projectLocation = String(data.project_location || "").trim();
    const projectScope = String(data.project_scope || "").trim();
    const contentUse = String(data.content_use || "").trim();
    const sensitiveLocation = String(data.sensitive_location || "").trim();

    if (!bookingDate || !name || !email || !packageName) {
      return json(400, { error: "Missing required fields" });
    }

    if (!isValidEmail(email)) {
      return json(400, { error: "Invalid email format" });
    }

    const messageForStorage = buildStoredMessage({
      copy,
      message,
      projectType,
      projectLocation,
      projectScope,
      contentUse,
      sensitiveLocation
    });

    const { data: insertedBooking, error: insertError } = await supabase
      .from("bookings_v2")
      .insert({
        booking_date: bookingDate,
        name,
        email,
        package: packageName,
        message: messageForStorage,
        status: "pending",
        lang
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Booking insert failed: ${insertError.message}`);
    }

    const adminHtml = createAdminMailHtml({
      copy,
      name,
      email,
      bookingDate,
      packageName,
      projectType,
      projectLocation,
      projectScope,
      contentUse,
      sensitiveLocation,
      message
    });

    const adminResults = await notifyAdmins({
      from,
      replyTo: email,
      recipients: adminRecipients,
      subject: `${copy.adminHeading} - ${name}`,
      html: adminHtml
    });

    let clientNotification = { ok: false, recipient: email };
    try {
      await sendResendMail({
        from,
        to: email,
        replyTo: adminRecipients[0] || process.env.CONTACT_TO_EMAIL || "busi.sandor@bphoto.at",
        subject: copy.clientSubject,
        html: createClientMailHtml({
          copy,
          name,
          bookingDate,
          packageName,
          projectType
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
