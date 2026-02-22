const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

function generatePassword() {
  return crypto.randomBytes(8).toString("base64").slice(0, 12);
}

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email required" })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // 🔎 1️⃣ Ellenőrizzük, létezik-e már
    const { data: existingUsers } =
      await supabase.auth.admin.listUsers();

    const existing = existingUsers.users.find(u => u.email === email);

    if (existing) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "User already exists",
          id: existing.id
        })
      };
    }

    // 🆕 2️⃣ Ha nem létezik → létrehozzuk
    const password = generatePassword();

    const { data, error } = await supabase.auth.admin.createUser({
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User created",
        id: data.user.id,
        password
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};