const express = require("express");
const router = express.Router();
const sessionStore = require("../services/sessionStore");
const aiClient = require("../services/aiClient");

// GET /api/chat/sessions -> list sessions
router.get("/chat/sessions", (req, res) => {
  try {
    const list = sessionStore.listSessions();
    res.json({ success: true, sessions: list });
  } catch (err) {
    console.error("List sessions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions -> create session
router.post("/chat/sessions", (req, res) => {
  try {
    const { title } = req.body;
    const session = sessionStore.createSession(title || "New Chat");
    res.json({ success: true, session });
  } catch (err) {
    console.error("Create session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chat/sessions/:id -> rename session
router.patch("/chat/sessions/:id", (req, res) => {
  try {
    const { title } = req.body;
    const session = sessionStore.renameSession(req.params.id, title);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ success: true, session });
  } catch (err) {
    console.error("Rename session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id -> delete session
router.delete("/chat/sessions/:id", (req, res) => {
  try {
    sessionStore.deleteSession(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id/messages -> get session messages
router.get("/chat/sessions/:id/messages", (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ success: true, messages: session.messages || [] });
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions/:id/messages -> save a message & get AI response
router.post("/chat/sessions/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const session = sessionStore.getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { sender, text, messageType, workflow, n8nId } = req.body;

    // 1. BACKWARDS COMPATIBILITY: If sender is specified (user or ai), just persist the message exactly as sent
    if (sender) {
      const saved = sessionStore.saveMessage(id, {
        sender,
        text,
        messageType: messageType || "message",
        workflow,
        n8nId
      });
      return res.json({ success: true, message: saved });
    }

    // 2. CONVERSATIONAL MODE: If sender is NOT specified, we treat it as an incoming user message
    // and automatically trigger the AI response.
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Save user message first
    const userMsg = sessionStore.saveMessage(id, {
      sender: "user",
      text: text.trim(),
      messageType: "message"
    });

    // Run AI chat conversation which queries Gemini/Groq using the full message history
    const aiResponse = await aiClient.chatConversation(id, text.trim());

    // Save AI response message
    const aiMsg = sessionStore.saveMessage(id, {
      sender: "ai",
      text: aiResponse.message,
      messageType: aiResponse.isReadyToGenerate ? "workflow" : (aiResponse.questions?.length > 0 ? "clarifying_question" : "message"),
      workflow: {
        spec: aiResponse.spec,
        isReadyToGenerate: aiResponse.isReadyToGenerate,
        questions: aiResponse.questions || null,
        suggestedTemplates: aiResponse.suggestedTemplates || []
      }
    });

    res.json({
      success: true,
      userMessage: userMsg,
      aiMessage: aiMsg,
      spec: aiResponse.spec
    });

  } catch (err) {
    console.error("Post message error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id/spec -> get the current spec for the session
router.get("/chat/sessions/:id/spec", (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ success: true, spec: session.spec || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credentials/status -> check connection state for required services
router.get("/credentials/status", async (req, res) => {
  try {
    const servicesStr = req.query.services || "";
    const required = servicesStr.split(",").filter(Boolean);
    const n8nClient = require("../services/n8nClient");
    const credentialStore = require("../services/credentialStore");
    
    let n8nCreds = [];
    try {
      n8nCreds = await n8nClient.listCredentials();
    } catch (n8nErr) {
      console.warn("n8n list credentials failed, falling back to local store:", n8nErr.message);
    }
    const localCreds = credentialStore.getAll();
    const allCreds = [...n8nCreds, ...localCreds];

    const status = {};
    required.forEach(service => {
      let type = null;
      const name = service.toLowerCase();
      if (name.includes('slack')) type = 'slackApi';
      else if (name.includes('gmail') || name.includes('email') || name.includes('sheet') || name.includes('google')) type = 'gmailApi';
      else if (name.includes('telegram')) type = 'telegramApi';
      else if (name.includes('github')) type = 'githubApi';
      else if (name.includes('webhook') || name.includes('http') || name.includes('api')) type = 'genericApi';
      
      // If it doesn't require a credential (like Schedule/Cron), it is automatically true
      status[service] = type ? allCreds.some(c => c.type === type) : true;
    });
    
    res.json(status);
  } catch (err) {
    console.error("Credentials status check error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clarify (backwards compatibility wrapper)
router.post("/clarify", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    // Directly use the AI's internal clarify logic or fall back
    const result = await aiClient.clarifyPrompt(prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Clarify error:", err.message);
    res.json({ success: true, needsClarification: false });
  }
});

module.exports = router;
