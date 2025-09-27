const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function listModels(req, res) {
  try {
    const list = await client.models.list();
    const ids = list.data.map(m => m.id);
    const preferred = ids.filter(id => /^gpt-4o/.test(id) || /^gpt-4\.1/.test(id) || /^gpt-4/.test(id) || /^o3/.test(id));
    const fallback = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"];
    const unique = Array.from(new Set(preferred.length ? preferred : fallback));
    res.json({ models: unique });
  } catch {
    res.json({ models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"] });
  }
}

module.exports = { listModels };