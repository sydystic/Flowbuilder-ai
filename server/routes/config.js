const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth");

// GET /api/config -> Expose backend config values securely to authorized frontend
router.get("/config", requireAuth, (req, res) => {
  const providers = [];
  if (process.env.GEMINI_API_KEY) providers.push("Gemini");
  if (process.env.GROQ_API_KEY) providers.push("Groq");
  if (process.env.OPENROUTER_API_KEY) providers.push("OpenRouter");

  res.json({
    aiProvider: providers.join(" / ") || "Default (Offline Simulation)",
    n8nUrl: process.env.N8N_BASE_URL || "http://localhost:5678",
    demoMode: process.env.DEMO_MODE === "true"
  });
});

module.exports = router;
