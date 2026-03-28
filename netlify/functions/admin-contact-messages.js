import { CORS_HEADERS, json, verifyAdminFromEvent } from "./_admin.js";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation "public.${relation}" does not exist`);
}

const SETUP_ERROR =
  "Hiányzik a contact_messages tábla. Futtasd a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase } = admin;

  try {
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMissingRelation(error, "contact_messages")) {
        return json(500, { error: SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });
      return json(200, { messages: data || [] });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const id = Number(body.id || 0);
    const status = String(body.status || "new").trim();
    const adminNote = String(body.adminNote || "").trim();

    if (!id) return json(400, { error: "Message ID required" });

    const { error } = await supabase
      .from("contact_messages")
      .update({ status, admin_note: adminNote || null })
      .eq("id", id);

    if (isMissingRelation(error, "contact_messages")) {
      return json(500, { error: SETUP_ERROR });
    }

    if (error) return json(400, { error: error.message });

    return json(200, { success: true });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};

