import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function generatePassword() {
  return crypto.randomBytes(9).toString("base64").slice(0, 12);
}

export const handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email required" })
      };
    }

    // Ellenőrizzük létezik-e már
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);

    if (existing) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User already exists" })
      };
    }

    const password = generatePassword();

    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Email küldés Resend-del
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "B. Photography <noreply@bphoto.at>",
        to: email,
        subject: "Online Galéria Hozzáférés",
        html: `
          <h2>Online Galéria Hozzáférés</h2>
          <p>Kedves Ügyfelünk!</p>
          <p>Az online galériája elkészült.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Jelszó:</strong> ${password}</p>
          <p>
            <a href="https://bphoto.at/hu/galeria-login.html">
              Belépés a galériába
            </a>
          </p>
          <p>Kérjük első belépés után változtassa meg a jelszavát.</p>
        `
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};