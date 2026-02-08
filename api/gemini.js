// Vercel Serverless Function: /api/gemini
// Usa Gemini Developer API (ai.google.dev) por ENV var: GEMINI_API_KEY
// Model default: gemini-2.5-flash
//
// Env en Vercel:
// - GEMINI_API_KEY = tu API key de Google AI Studio / Gemini Developer API
// - GEMINI_MODEL   = (opcional) gemini-2.5-flash | gemini-2.5-pro | gemini-2.5-flash-lite
//
// Ref (nombres de modelos): https://firebase.google.com/docs/ai-logic/models citeturn1view0

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { prompt, model } = (req.body || {});
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Falta 'prompt' (string) en el body." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel (Environment Variables)." });
    }

    const allowed = new Set(["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"]);
    const chosen = (typeof model === "string" && allowed.has(model)) ? model : (process.env.GEMINI_MODEL || "gemini-2.5-flash");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosen)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 900
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || "Error en Gemini API",
        raw: data
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join("\n") ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sin respuesta de IA.";

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Error interno", detail: String(e?.message || e) });
  }
}
