const axios = require("axios");

// Fetches an image from a local URL (like /uploads/...) and converts it to base64
async function imageToB64(url) {
  try {
    const API_BASE_URL = process.env.API_URL || "http://localhost:3001";
    const absoluteUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    const response = await axios.get(absoluteUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    return buffer.toString("base64");
  } catch (error) {
    console.error(
      `Failed to fetch and convert image to base64: ${url}`,
      error.message
    );
    return null;
  }
}

// Normalize whatever Stable Horde (or other providers) return into a displayable <img src="...">
function toDisplayableImage(val, fallbackMime = "image/webp") {
  if (!val) return "";
  const s = String(val).trim();
  if (/^data:image\//i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^blob:/i.test(s)) return s;
  const b64 = s.replace(/\s+/g, "");
  const mime = b64.startsWith("iVBOR")
    ? "image/png"
    : b64.startsWith("/9j/")
    ? "image/jpeg"
    : b64.startsWith("UklG")
    ? "image/webp"
    : b64.startsWith("R0lG")
    ? "image/gif"
    : fallbackMime;
  return `data:${mime};base64,${b64}`;
}

function clampInt(n, min, max) {
  const v = parseInt(n, 10);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

// Pollinations (no API key, instant URL)
function pollinationsImage(prompt) {
  const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}`;
  return { imageUrl: url, previewUrl: url, _provider: "pollinations" };
}

// DeepAI (API key required)
async function deepaiImage(prompt) {
  const apiKey = process.env.DEEPAI_API_KEY;
  if (!apiKey) throw new Error("DeepAI API key missing");
  const res = await axios.post(
    "https://api.deepai.org/api/text2img",
    new URLSearchParams({ text: prompt }),
    { headers: { "api-key": apiKey }, timeout: 30000 }
  );
  const url = res.data.output_url;
  return { imageUrl: url, previewUrl: url, _provider: "deepai" };
}

// HELPER FUNCTION: This safely handles API requests and automatically retries on 429 errors.
async function makeHordeRequest(
  url,
  method = "GET",
  headers,
  body = null,
  timeout = 30000
) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let delay = 2000;
  const maxDelay = 60000;
  while (true) {
    try {
      const config = { method, url, headers, timeout };
      if (body) {
        config.data = body;
      }
      const response = await axios(config);
      return response;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(
          `Stable Horde API rate limit hit. Retrying in ${delay / 1000}s...`
        );
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
        continue;
      }
      console.error(
        "Stable Horde API request failed:",
        err.response?.data?.message || err.message
      );
      throw new Error(err.response?.data?.message || err.message);
    }
  }
}

// MAIN STABLE HORDE FUNCTION: With all fixes applied.
// FINAL STABLE HORDE FUNCTION: Now with "ULTRA-CHEAP" default settings
// to guarantee it works for brand-new accounts with zero kudos.
async function stableHordeImage(prompt, params = {}) {
  const apiKey = process.env.STABLEHORDE_API_KEY || "0000000000";
  const headers = { "Content-Type": "application/json", apikey: apiKey };
  const isImg2Img =
    Array.isArray(params.inputImages) && params.inputImages.length > 0;

  const body = {
    prompt: String(prompt || ""),
    params: {
      // --- EVEN CHEAPER SETTINGS ---
      // This is the most basic request possible to ensure it's free.
      width: clampInt(params.width ?? 512, 64, 512),
      height: clampInt(params.height ?? 512, 64, 512),
      steps: clampInt(params.steps ?? 15, 1, 49), // Lowered steps to 15
      cfg_scale: params.cfg_scale ?? 7.0,
      sampler_name: params.sampler_name || "k_lms", // Changed to a cheaper sampler
      n: 1,
    },
    models: params.model ? [params.model] : ["Deliberate"], // Changed to a more efficient default model
    r2: true,
  };

  if (isImg2Img) {
    console.log("Stable Horde: Image-to-Image mode activated (short timeout).");
    const sourceImageUrl = params.inputImages[0].url;
    const b64Image = await imageToB64(sourceImageUrl);
    if (b64Image) {
      body.source_image = b64Image;
      body.params.denoising_strength = params.strength ?? 0.75;
      body.prompt = body.prompt || "modify image";
    }
  } else {
    console.log("Stable Horde: Text-to-Image mode activated (long timeout).");
  }

  const submitRes = await makeHordeRequest(
    "https://stablehorde.net/api/v2/generate/async",
    "POST",
    headers,
    body
  );
  const jobId = submitRes.data?.id;
  if (!jobId)
    throw new Error("StableHorde job submission failed to return a job ID.");
  console.log(`Job submitted successfully. Job ID: ${jobId}`);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxRetries = isImg2Img ? 30 : 90;
  const intervalMs = 3000;

  for (let i = 0; i < maxRetries; i++) {
    console.log(
      `Checking status for job ${jobId}... (Attempt ${i + 1}/${maxRetries})`
    );
    const checkRes = await makeHordeRequest(
      `https://stablehorde.net/api/v2/generate/check/${jobId}`,
      "GET",
      { apikey: apiKey }
    );
    if (checkRes.data?.done) {
      console.log(`Job ${jobId} is done! Fetching final result.`);
      const statusRes = await makeHordeRequest(
        `https://stablehorde.net/api/v2/generate/status/${jobId}`,
        "GET",
        { apikey: apiKey }
      );
      const generation = statusRes.data?.generations?.[0];
      if (generation?.img) {
        const normalized = toDisplayableImage(generation.img);
        return {
          imageUrl: normalized,
          previewUrl: normalized,
          _provider: "stablehorde",
        };
      }
    }
    if (checkRes.data?.faulted || checkRes.data?.cancelled)
      throw new Error("StableHorde job failed or was cancelled.");
    await delay(intervalMs);
  }
  const timeoutErrorMsg = isImg2Img
    ? "Image edit timed out. The free service is likely too busy for complex requests right now. Please try again later."
    : "Image generation timed out.";
  throw new Error(timeoutErrorMsg);
}

module.exports = {
  pollinationsImage,
  deepaiImage,
  stableHordeImage,
  toDisplayableImage,
};
