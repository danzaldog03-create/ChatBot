// /api/gemini.js  (Vercel Serverless Function - Node/CommonJS)
module.exports = async (req, res) => {
  // CORS básico (por si luego lo consumes desde otro dominio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Falta 'prompt' (string) en el body." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "No existe GEMINI_API_KEY en variables de entorno de Vercel." });
    }

    // ✅ Modelo vigente (según lista de modelos)
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      // Regresa el error tal cual para que lo veas en el front
      return res.status(r.status).json({
        error: data?.error?.message || "Error al consultar Gemini",
        raw: data,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Error interno", detail: String(e?.message || e) });
  }
};
