export default async function handler(req, res) {
  // CORS básico (por si llamas desde otro dominio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Falta 'prompt' (string) en el body." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Falta GEMINI_API_KEY en variables de entorno (Vercel)." });

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Endpoint Generative Language API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 800
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data?.error?.message || "Error al consultar Gemini.";
      return res.status(response.status).json({ error: msg, raw: data?.error || data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Error interno", detail: String(error?.message || error) });
  }
}
