exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const data = JSON.parse(event.body);
    const isGerman = data.lang === "de";

    /* =========================
       1️⃣ ADMIN EMAIL (NEKED)
    ========================= */

    const adminSubject = isGerman
      ? "Neue Buchungsanfrage eingegangen"
      : "Új időpontfoglalás érkezett";

    const adminHtml = isGerman
      ? `
        <div style="font-family:Arial;background:#111;padding:30px;color:#fff">
          <h2 style="color:#d4af37;">Neue Buchung</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Datum:</strong> ${data.booking_date}</p>
          <p><strong>Paket:</strong> ${data.package}</p>
          <hr style="margin:20px 0;border:1px solid #333">
          <p><strong>Nachricht:</strong></p>
          <p>${data.message || "-"}</p>
        </div>
      `
      : `
        <div style="font-family:Arial;background:#111;padding:30px;color:#fff">
          <h2 style="color:#d4af37;">Új foglalás</h2>
          <p><strong>Név:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Dátum:</strong> ${data.booking_date}</p>
          <p><strong>Csomag:</strong> ${data.package}</p>
          <hr style="margin:20px 0;border:1px solid #333">
          <p><strong>Üzenet:</strong></p>
          <p>${data.message || "-"}</p>
        </div>
      `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Bphoto <busi.sandor@bphoto.at>",
        to: ["busi.sandor@bphoto.at"],
        subject: adminSubject,
        html: adminHtml
      })
    });

    /* =========================
       2️⃣ CLIENT EMAIL (AUTOREPLY)
    ========================= */

    const clientSubject = isGerman
      ? "Deine Buchungsanfrage wurde erhalten"
      : "Foglalásod megérkezett";

    const clientHtml = isGerman
      ? `
        <div style="font-family:Arial;background:#111;padding:30px;color:#fff">
          <h2 style="color:#d4af37;">Vielen Dank für deine Anfrage!</h2>
          <p>Hallo ${data.name},</p>
          <p>Deine Buchungsanfrage für den ${data.booking_date} ist eingegangen.</p>
          <p>Ich melde mich innerhalb von 24 Stunden bei dir.</p>
          <br>
          <p>Liebe Grüße,<br>B. Photography<br>Busi Sandor</p>
        </div>
      `
      : `
        <div style="font-family:Arial;background:#111;padding:30px;color:#fff">
          <h2 style="color:#d4af37;">Köszönöm a foglalásod!</h2>
          <p>Kedves ${data.name},</p>
          <p>Időpont kérésed (${data.booking_date}) megérkezett.</p>
          <p>24 órán belül felveszem veled a kapcsolatot.</p>
          <br>
          <p>Üdvözlettel,<br>B. Photography<br>Busi Sandor</p>
        </div>
      `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Bphoto <busi.sandor@bphoto.at>",
        to: [data.email],
        subject: clientSubject,
        html: clientHtml
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error("FUNCTION ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email sending failed" }),
    };
  }
};
