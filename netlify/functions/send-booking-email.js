const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL || "B. Photography <noreply@bphoto.at>";
  const to = process.env.BOOKING_TO_EMAIL || "info@bphoto.at";

  if (!resendApiKey) {
    return json(500, { error: "Missing RESEND_API_KEY env var" });
  }

  try {
    const data = JSON.parse(event.body || "{}");

    const bookingDate = data.booking_date || "";
    const name = data.name || "";
    const email = data.email || "";
    const packageName = data.package || "";
    const message = data.message || "";
    const lang = data.lang || "de";

    if (!bookingDate || !name || !email || !packageName) {
      return json(400, { error: "Missing required fields" });
    }

    const subject =
      lang === "hu"
        ? `Új foglalási kérés - ${name}`
        : `Neue Buchungsanfrage - ${name}`;

    const html = `
      <h2>${lang === "hu" ? "Új foglalási kérés érkezett" : "Neue Buchungsanfrage eingegangen"}</h2>
      <p><strong>Név / Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Dátum / Datum:</strong> ${escapeHtml(bookingDate)}</p>
      <p><strong>Csomag / Paket:</strong> ${escapeHtml(packageName)}</p>
      <p><strong>Üzenet / Nachricht:</strong><br>${escapeHtml(message || "-")}</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return json(502, { error: "Email provider error", details: errText.slice(0, 400) });
    }

    return json(200, { success: true });
  } catch (error) {
    return json(500, { error: "Server error", details: String(error?.message || error) });
  }
};
