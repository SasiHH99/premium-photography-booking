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

function createMailHtml({ heading, intro, name, email, bookingDate, packageName, message }) {
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

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const from = process.env.BOOKING_FROM_EMAIL || "B. Photography <noreply@bphoto.at>";
  const to = process.env.BOOKING_TO_EMAIL || "busi.sandor@bphoto.at";
  const supabase = createServiceClient();

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

    const heading = lang === "hu" ? "Új foglalási kérés" : "Neue Buchungsanfrage";
    const intro =
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

    await sendResendMail({
      from,
      to,
      replyTo: email,
      subject: `${heading} - ${name}`,
      html: createMailHtml({
        heading,
        intro,
        name,
        email,
        bookingDate,
        packageName,
        message
      })
    });

    return json(200, { success: true, bookingId: insertedBooking?.id || null });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};
