exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const data = JSON.parse(event.body);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Bphoto <busi.sandor@bphoto.at>",
        to: ["busi.sandor@bphoto.at"],
        subject: "Új időpontfoglalás érkezett",
        html: `
          <div style="font-family:Arial,sans-serif;background:#111;padding:30px;color:#fff">
            <h2 style="color:#d4af37;">Új foglalás</h2>

            <p><strong>Név:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Dátum:</strong> ${data.booking_date}</p>
            <p><strong>Csomag:</strong> ${data.package}</p>

            <hr style="margin:20px 0;border:1px solid #333">

            <p><strong>Üzenet:</strong></p>
            <p>${data.message || "-"}</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error:", errText);
      throw new Error("Email sending failed");
    }

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
