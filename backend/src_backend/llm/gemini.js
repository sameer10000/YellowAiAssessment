const axios = require("axios");
const Chat = require("../models/Chat");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getGeminiResponse(agent, message, userId) {
  try {
    const history = await Chat.find({ agent: agent._id, user: userId })
      .sort({ createdAt: 1 })
      .limit(10); 

    const contents = history.map((chat) => ({
      role: chat.role === "user" ? "user" : "model",
      parts: [{ text: chat.message }]
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const payload = { contents };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return reply;
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    throw new Error("Failed to get Gemini response");
  }
}

module.exports = { getGeminiResponse };
