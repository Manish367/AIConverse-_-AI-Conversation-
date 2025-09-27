const OpenAI = require("openai");
const axios = require("axios");

const openaiMain = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------- Utility: Normalize Response ----------------
function formatResponse(text, provider) {
  return {
    choices: [{ message: { role: "assistant", content: text || "No response" } }],
    _provider: provider,
  };
}

// ---------------- Fallback Providers ----------------
const openaiFallback1 = new OpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY,
  baseURL: process.env.CHATANYWHERE_HOST || "https://api.chatanywhere.tech/v1",
});

const openaiFallback2 = new OpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY,
  baseURL: "https://api.chatanywhere.org/v1",
});

const openaiOpenRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// ---------------- Pollinations Text ----------------
async function pollinationsText(prompt) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
  const res = await axios.get(url);
  return formatResponse(res.data?.text || res.data || "No response", "pollinations");
}

// ---------------- HuggingFace Text ----------------
async function huggingFaceText(prompt) {
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/gpt2",
    { inputs: prompt },
    { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
  );
  return formatResponse(res.data[0]?.generated_text || "No response", "huggingface");
}

// ---------------- DeepAI Text ----------------
async function deepaiText(prompt) {
  const res = await axios.post(
    "https://api.deepai.org/api/text-generator",
    new URLSearchParams({ text: prompt }),
    { headers: { "api-key": process.env.DEEPAI_API_KEY } }
  );
  return formatResponse(res.data.output || "No response", "deepai");
}

// ---------------- ChatAnywhere Wrapper ----------------
async function chatAnywhere(prompt, baseURL) {
  try {
    const res = await axios.post(
      `${baseURL}/chat/completions`,
      { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] },
      { headers: { Authorization: `Bearer ${process.env.CHATANYWHERE_API_KEY}` } }
    );

    const reply =
      res.data.reply ||
      res.data.text ||
      res.data.choices?.[0]?.message?.content ||
      "No response";

    return formatResponse(
      reply,
      baseURL.includes("tech") ? "chatanywhere-tech" : "chatanywhere-org"
    );
  } catch (err) {
    console.error(`ChatAnywhere (${baseURL}) failed:`, err.message || err);

    // Retry once if temporary error
    if ([429, 503].includes(err.response?.status)) {
      console.log("Retrying ChatAnywhere after 1s delay...");
      await new Promise((r) => setTimeout(r, 1000));
      return chatAnywhere(prompt, baseURL);
    }

    throw err;
  }
}

// ---------------- Main Chat Completion with Fallbacks ----------------
async function createChatCompletion(options) {
  const prompt = options.messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  // OpenAI main
  try {
    const result = await openaiMain.chat.completions.create(options);
    result._provider = "openai";
    return result;
  } catch (err) {
    console.warn("OpenAI failed:", err.message || err);
  }

  // ChatAnywhere fallback 1
  try {
    return await chatAnywhere(prompt, openaiFallback1.baseURL);
  } catch (err) {}

  // ChatAnywhere fallback 2
  try {
    return await chatAnywhere(prompt, openaiFallback2.baseURL);
  } catch (err) {}

  // OpenRouter
  try {
    const result = await openaiOpenRouter.chat.completions.create(options);
    result._provider = "openrouter";
    return result;
  } catch (err) {}

  // Pollinations
  try {
    return await pollinationsText(prompt);
  } catch (err) {}

  // HuggingFace
  try {
    return await huggingFaceText(prompt);
  } catch (err) {}

  // DeepAI
  try {
    return await deepaiText(prompt);
  } catch (err) {}

  throw new Error("All chat providers failed.");
}

// ---------------- Vision-capable Chat with fallback ----------------
async function describeImage(imageUrl, prompt = "Describe this image") {
  try {
    const res = await openaiMain.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    res._provider = "openai-vision";
    return res;
  } catch (err) {
    console.error("OpenAI vision failed:", err.message || err);

    const fallbackIntro = `⚠ OpenAI vision failed (${err.code || err.message}). `;
    const extra = "Currently no vision-capable fallback is available. " +
              "You can try describing your image in words so I can still help.";
    return formatResponse(fallbackIntro + extra, "vision-fallback");

    const combinedPrompt = `${prompt}\n\n(Attached image: ${imageUrl})`;

    // Try fallbacks
    try {
      const fb1 = await chatAnywhere(combinedPrompt, openaiFallback1.baseURL);
      fb1.choices[0].message.content =
        fallbackIntro + fb1.choices[0].message.content;
      fb1._provider = "chatanywhere-vision-fallback";
      return fb1;
    } catch (err2) {
      console.warn("ChatAnywhere fallback failed too:", err2.message || err2);
    }

    try {
      const fb2 = await pollinationsText(combinedPrompt);
      fb2.choices[0].message.content =
        fallbackIntro + fb2.choices[0].message.content;
      fb2._provider = "pollinations-vision-fallback";
      return fb2;
    } catch (err3) {
      console.warn("Pollinations fallback failed too:", err3.message || err3);
    }

    // Last chance huggingface / deepai
    try {
      const fb3 = await huggingFaceText(combinedPrompt);
      fb3.choices[0].message.content =
        fallbackIntro + fb3.choices[0].message.content;
      fb3._provider = "huggingface-vision-fallback";
      return fb3;
    } catch (err4) {
      console.warn("HuggingFace fallback failed:", err4.message || err4);
    }

    try {
      const fb4 = await deepaiText(combinedPrompt);
      fb4.choices[0].message.content =
        fallbackIntro + fb4.choices[0].message.content;
      fb4._provider = "deepai-vision-fallback";
      return fb4;
    } catch (err5) {
      console.warn("DeepAI fallback failed:", err5.message || err5);
    }

    // All providers failed
    return formatResponse(
      fallbackIntro + "⚠ All fallbacks failed, no vision available.",
      "vision-fallback-failed"
    );
  }
}

module.exports = { createChatCompletion, describeImage };