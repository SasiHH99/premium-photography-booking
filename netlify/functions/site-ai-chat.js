import { CORS_HEADERS, json } from "./_admin.js";

const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";

function getKnowledgeBase(lang = "de") {
  const isHu = lang === "hu";

  return isHu
    ? `
Brand: B. Photography egy prémium fotós márka Ausztriában, főként Bécsben és környékén.
Fő szolgáltatások: portré, páros, természet, autós, baba/családi fotózás.
Árak:
- Essence: 97 EUR, 30-40 perc, 8-12 retusált kép, 1 helyszín, online galéria.
- Signature: 167 EUR, 60 perc, 20 retusált kép, 1-2 helyszín, online galéria.
- Prestige: 219 EUR, 90 perc, 25+ retusált kép, több helyszín vagy koncepció, online galéria.
- Event / egyedi ajánlat: személyre szabott.
Foglalás menete:
- a látogató elküldi az igényt a foglalási oldalon,
- általában 24 órán belül visszajelzés érkezik,
- utána egyeztetés történik helyszínről, hangulatról és részletekről.
Kapcsolat:
- email: busi.sandor@bphoto.at
- foglalási oldal: https://bphoto.at/hu/foglalas.html
- kapcsolat oldal: https://bphoto.at/hu/kapcsolat.html
- portfólió: https://bphoto.at/hu/portfolio.html
- árak: https://bphoto.at/hu/arak.html
Fontos:
- pontos szabad időpontot ne találj ki; ha elérhetőségről kérdeznek, irányítsd a foglalási oldalra vagy kapcsolatfelvételre,
- ne ígérj olyat, ami nincs a fenti információkban,
- ha foglalni akar, egyértelműen ajánld a foglalási oldalt.
`
    : `
Brand: B. Photography ist eine Premium-Fotomarke in Österreich, hauptsächlich in Wien und Umgebung.
Leistungen: Portrait, Paar, Natur, Auto sowie Baby- und Familienshootings.
Pakete:
- Essence: 97 EUR, 30-40 Minuten, 8-12 retuschierte Bilder, 1 Location, Online-Galerie.
- Signature: 167 EUR, 60 Minuten, 20 retuschierte Bilder, 1-2 Locations, Online-Galerie.
- Prestige: 219 EUR, 90 Minuten, 25+ retuschierte Bilder, mehrere Locations oder kreative Richtung, Online-Galerie.
- Event / individuelles Angebot: maßgeschneidert.
Buchungsablauf:
- die Anfrage wird über die Buchungsseite gesendet,
- in der Regel kommt innerhalb von 24 Stunden eine Rückmeldung,
- danach werden Ort, Stimmung und Details abgestimmt.
Kontakt:
- E-Mail: busi.sandor@bphoto.at
- Buchungsseite: https://bphoto.at/de/termin.html
- Kontaktseite: https://bphoto.at/de/kontakt.html
- Portfolio: https://bphoto.at/de/portfolio.html
- Preise: https://bphoto.at/de/preise.html
Wichtig:
- keine exakten freien Termine erfinden; bei Verfügbarkeit immer auf Buchungsseite oder Kontakt verweisen,
- nichts versprechen, das nicht in diesen Fakten steht,
- wenn jemand buchen will, klar die Buchungsseite empfehlen.
`;
}

function buildInstructions(lang = "de") {
  return `You are the AI assistant of B. Photography, a premium photographer in Austria. You help visitors with questions about photoshoots, packages, booking, and contact.

${getKnowledgeBase(lang)}

Rules:
- Reply in ${lang === "hu" ? "Hungarian" : "German"} unless the user clearly writes in another language.
- Keep answers concise, practical, and premium in tone.
- Usually answer in 2-4 short paragraphs or a short bullet list.
- If the visitor asks about booking, recommend the booking page.
- If the visitor asks about prices, summarize the relevant packages and mention the prices.
- If the visitor asks about portfolio, point them to the portfolio page.
- If the question is outside the known website/business information, answer briefly and redirect to contact for exact details.`;
}

function extractReply(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }

  return chunks.join("\n\n").trim();
}

function detectIntent(message = "", lang = "de") {
  const text = String(message).toLowerCase();
  const isHu = lang === "hu";

  if (/(foglal|időpont|idopont|book|buch|termin|anfrage)/i.test(text)) {
    return {
      label: isHu ? "Foglalási oldal" : "Zur Buchungsseite",
      url: isHu ? "/hu/foglalas.html" : "/de/termin.html"
    };
  }

  if (/(ár|arak|mennyi|price|preise|paket|csomag)/i.test(text)) {
    return {
      label: isHu ? "Árak megnyitása" : "Preise ansehen",
      url: isHu ? "/hu/arak.html" : "/de/preise.html"
    };
  }

  if (/(portfolio|portfól|munkák|arbeiten|bilder)/i.test(text)) {
    return {
      label: isHu ? "Portfólió megnyitása" : "Portfolio ansehen",
      url: isHu ? "/hu/portfolio.html" : "/de/portfolio.html"
    };
  }

  if (/(kapcsolat|email|kontakt|contact)/i.test(text)) {
    return {
      label: isHu ? "Kapcsolat oldal" : "Kontaktseite",
      url: isHu ? "/hu/kapcsolat.html" : "/de/kontakt.html"
    };
  }

  return null;
}

async function createResponse(payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(503, { error: "Missing OPENAI_API_KEY env var" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const lang = body.lang === "hu" ? "hu" : "de";
    const message = String(body.message || "").trim();
    const previousResponseId = String(body.previousResponseId || "").trim();

    if (!message) {
      return json(400, { error: "Message is required" });
    }

    if (message.length > 1200) {
      return json(400, { error: "Message is too long" });
    }

    const payload = {
      model: DEFAULT_MODEL,
      instructions: buildInstructions(lang),
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: message }]
        }
      ],
      max_output_tokens: 320
    };

    if (previousResponseId) {
      payload.previous_response_id = previousResponseId;
    }

    let result = await createResponse(payload);

    if (!result.ok && previousResponseId && result.status === 400) {
      delete payload.previous_response_id;
      result = await createResponse(payload);
    }

    if (!result.ok) {
      const details = result.data?.error?.message || "OpenAI request failed";
      throw new Error(details);
    }

    const reply = extractReply(result.data);
    if (!reply) {
      throw new Error("No assistant reply was returned");
    }

    return json(200, {
      reply,
      responseId: result.data.id || null,
      cta: detectIntent(message, lang)
    });
  } catch (error) {
    return json(500, {
      error: "AI chat request failed",
      details: String(error?.message || error)
    });
  }
};
