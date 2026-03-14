import { CORS_HEADERS, json, createServiceClient, getBearerToken } from "./_admin.js";

function isMissingRelation(error, relation) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || message.includes(`relation "public.${relation}" does not exist`);
}

async function getUserFromEvent(supabase, event) {
  const token = getBearerToken(event.headers || {});
  if (!token) {
    return { ok: false, response: json(401, { error: "Missing bearer token" }) };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, response: json(401, { error: "Invalid token" }) };
  }

  return { ok: true, user: data.user };
}

async function listSignedImages(supabase, userId) {
  const { data: fileList, error: fileError } = await supabase.storage.from("client-galleries").list(userId, {
    limit: 200,
    sortBy: { column: "name", order: "asc" }
  });

  if (fileError) {
    throw new Error(fileError.message || "Gallery file listing failed");
  }

  const files = (fileList || []).filter((file) => file.name);
  const signedItems = await Promise.all(
    files.map(async (file) => {
      const path = `${userId}/${file.name}`;
      const { data, error } = await supabase.storage.from("client-galleries").createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) return null;
      return {
        id: path,
        path,
        name: file.name,
        url: data.signedUrl
      };
    })
  );

  return signedItems.filter(Boolean);
}

async function loadFavorites(supabase, userId) {
  const { data, error } = await supabase
    .from("gallery_favorites")
    .select("image_path")
    .eq("user_id", userId);

  if (isMissingRelation(error, "gallery_favorites")) {
    return [];
  }

  if (error) {
    throw new Error(error.message || "Favorites loading failed");
  }

  return (data || []).map((item) => item.image_path);
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const supabase = createServiceClient();
  const auth = await getUserFromEvent(supabase, event);
  if (!auth.ok) return auth.response;

  const userId = auth.user.id;

  try {
    if (event.httpMethod === "GET") {
      const [images, favorites] = await Promise.all([
        listSignedImages(supabase, userId),
        loadFavorites(supabase, userId)
      ]);

      return json(200, { images, favorites });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const imagePath = String(body.imagePath || "").trim();
    const favorite = body.favorite === true;

    if (!imagePath) {
      return json(400, { error: "Image path required" });
    }

    if (!imagePath.startsWith(`${userId}/`)) {
      return json(403, { error: "Forbidden image path" });
    }

    if (favorite) {
      const { error } = await supabase.from("gallery_favorites").upsert(
        { user_id: userId, image_path: imagePath },
        { onConflict: "user_id,image_path" }
      );

      if (isMissingRelation(error, "gallery_favorites")) {
        return json(500, {
          error: "Hiányzik a gallery_favorites tábla. Futtasd a frissített supabase/admin_tables.sql fájlt."
        });
      }

      if (error) return json(400, { error: error.message });
      return json(200, { success: true });
    }

    const { error } = await supabase
      .from("gallery_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("image_path", imagePath);

    if (isMissingRelation(error, "gallery_favorites")) {
      return json(500, {
        error: "Hiányzik a gallery_favorites tábla. Futtasd a frissített supabase/admin_tables.sql fájlt."
      });
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
