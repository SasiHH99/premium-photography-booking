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
    const { email, bookingId } = JSON.parse(event.body);

    if (!email || !bookingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and bookingId required" })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    const password = generatePassword();

    // 1️⃣ Auth user létrehozása
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (userError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: userError.message })
      };
    }

    const userId = userData.user.id;

    // 2️⃣ Booking frissítése gallery_user_id-val
    const { error: updateError } = await supabase
      .from("bookings_v2")
      .update({ gallery_user_id: userId })
      .eq("id", bookingId);

    if (updateError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: updateError.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Gallery user created",
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