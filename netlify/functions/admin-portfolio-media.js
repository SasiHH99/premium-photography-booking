import { CORS_HEADERS, json, verifyAdminFromEvent } from "./_admin.js";

const BUCKET = "portfolio-media";
const TABLE_SETUP_ERROR =
  "Hiányzik a portfolio_items tábla. Futtasd a supabase/admin_tables.sql fájlt a Supabase SQL Editorban.";
const BUCKET_SETUP_ERROR =
  "Hiányzik a portfolio-media storage bucket. Hozd létre Supabase-ben vagy futtasd a frissített supabase/admin_tables.sql fájlt.";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation "public.${relation}" does not exist`);
}

function isMissingBucket(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("bucket") && (message.includes("not found") || message.includes("does not exist"));
}

async function listItemsWithUrls(supabase) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (isMissingRelation(error, "portfolio_items")) {
    throw new Error(TABLE_SETUP_ERROR);
  }

  if (error) throw error;

  const items = data || [];
  const signed = await Promise.all(
    items.map(async (item) => {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(item.path, 3600);

      return {
        ...item,
        url: signedError ? "" : signedData?.signedUrl || ""
      };
    })
  );

  return signed;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const admin = await verifyAdminFromEvent(event);
  if (!admin.ok) return admin.response;

  const { supabase } = admin;

  try {
    if (event.httpMethod === "GET") {
      const items = await listItemsWithUrls(supabase);
      return json(200, { items });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const action = body.action || "list";

    if (action === "prepare_upload") {
      const fileName = String(body.fileName || "image.webp").replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${body.category || "portre"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

      if (isMissingBucket(error)) {
        return json(500, { error: BUCKET_SETUP_ERROR });
      }

      if (error || !data?.token) return json(400, { error: error?.message || "Upload URL creation failed" });
      return json(200, { upload: { path, token: data.token } });
    }

    if (action === "save") {
      const payload = {
        id: body.id || undefined,
        path: String(body.path || "").trim(),
        previousPath: String(body.previousPath || "").trim(),
        category: String(body.category || "portre").trim(),
        title: String(body.title || "").trim(),
        note: String(body.note || "").trim(),
        lang: body.lang === "de" ? "de" : "hu",
        sort_order: Number(body.sortOrder || 100),
        is_active: body.isActive !== false
      };

      if (!payload.path || !payload.title || !payload.note) {
        return json(400, { error: "Missing required fields" });
      }

      let error = null;
      if (payload.id) {
        const { error: updateError } = await supabase
          .from("portfolio_items")
          .update({
            path: payload.path,
            category: payload.category,
            title: payload.title,
            note: payload.note,
            lang: payload.lang,
            sort_order: payload.sort_order,
            is_active: payload.is_active
          })
          .eq("id", payload.id);

        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("portfolio_items").insert({
          path: payload.path,
          category: payload.category,
          title: payload.title,
          note: payload.note,
          lang: payload.lang,
          sort_order: payload.sort_order,
          is_active: payload.is_active
        });

        error = insertError;
      }

      if (isMissingRelation(error, "portfolio_items")) {
        return json(500, { error: TABLE_SETUP_ERROR });
      }

      if (error) return json(400, { error: error.message });

      if (payload.previousPath && payload.previousPath !== payload.path) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove([payload.previousPath]);
        if (isMissingBucket(removeError)) {
          return json(500, { error: BUCKET_SETUP_ERROR });
        }
      }

      const items = await listItemsWithUrls(supabase);
      return json(200, { success: true, items });
    }

    if (action === "delete") {
      const id = Number(body.id || 0);
      const path = String(body.path || "").trim();
      if (!id || !path) return json(400, { error: "ID and path required" });

      const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
      if (isMissingBucket(storageError)) {
        return json(500, { error: BUCKET_SETUP_ERROR });
      }
      if (storageError) return json(400, { error: storageError.message });

      const { error: rowError } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (isMissingRelation(rowError, "portfolio_items")) {
        return json(500, { error: TABLE_SETUP_ERROR });
      }
      if (rowError) return json(400, { error: rowError.message });

      const items = await listItemsWithUrls(supabase);
      return json(200, { success: true, items });
    }

    return json(400, { error: "Unknown action" });
  } catch (error) {
    return json(500, {
      error: "Server error",
      details: String(error?.message || error)
    });
  }
};

