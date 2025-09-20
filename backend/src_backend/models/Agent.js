const mongoose = require("mongoose");

const AgentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Agent", AgentSchema);
