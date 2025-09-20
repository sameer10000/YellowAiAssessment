const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const authenticateJWT = require("../middleware/auth");

router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const agent = await Agent.create({ user: req.user._id, name });
    res.status(201).json(agent);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", authenticateJWT, async (req, res) => {
  try {
    const agents = await Agent.find({ user: req.user._id });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

