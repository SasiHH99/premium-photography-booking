const { Resend } = require("resend");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = JSON.parse(event.body);

    const { name, email, booking_date, package, message } = data;

    await resend.emails.send({
      from: "Bphoto <busi.sandor@bphoto.at>",
      to: "busi.sandor@bphoto.at",
      subject: "Új időpontfoglalás érkezett",
      html: `
        <h2>Új foglalás</h2>
        <p><strong>Név:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Dátum:</strong> ${booking_date}</p>
        <p><strong>Csomag:</strong> ${package}</p>
        <p><strong>Üzenet:</strong><br>${message || "-"}</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error("EMAIL ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email sending failed" }),
    };
  }
};
