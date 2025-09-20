const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Agent = require("../models/Agent");
const authenticateJWT = require("../middleware/auth");
const { getGeminiResponse } = require("../llm/gemini");

router.get("/:agentId", authenticateJWT, async (req, res) => {
  try {
    const chats = await Chat.find({
      agent: req.params.agentId,
      user: req.user._id,
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Error fetching chats" });
  }
});

router.post("/:agentId", authenticateJWT, async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;

  try {
    await Chat.create({
      agent: agentId,
      user: req.user._id,
      role: "user",
      message,
    });
const agent = await Agent.findById(agentId);
const reply = await getGeminiResponse(agent, message, req.user._id);
    await Chat.create({
      agent: agentId,
      user: req.user._id,
      role: "agent",
      message: reply,
    });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error sending message" });
  }
});

module.exports = router;
