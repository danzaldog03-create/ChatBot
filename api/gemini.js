export default async function handler(req, res) {
  // Soporta POST (consulta) y GET (healthcheck simple)
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "gemini", ts: new Date().toISOString() });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return res.status(400).json({ error: "Falta 'prompt' (string) en el body." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en Vercel (Environment Variables)." });
    }

    // Modelo: por defecto gemini-2.5-flash, puedes cambiarlo en Vercel con GEMINI_MODEL
    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();

    // Google Generative Language API (v1beta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 700
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || "Error consultando Gemini";
      return res.status(response.status).json({ error: msg, raw: data });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ text, raw: undefined });
  } catch (error) {
    return res.status(500).json({ error: "Error interno", detail: String(error?.message || error) });
  }
}
