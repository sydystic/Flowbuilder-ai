const express = require("express");
const router = express.Router();
const sessionStore = require("../services/sessionStore");
const aiClient = require("../services/aiClient");
const requireAuth = require("../middlewares/auth");

// Require authentication for all chat routes
router.use(requireAuth);

// GET /api/chat/sessions -> list sessions for the authenticated user
router.get("/chat/sessions", async (req, res) => {
  try {
    const list = await sessionStore.listSessions(req.user.id);
    res.json({ success: true, sessions: list });
  } catch (err) {
    console.error("List sessions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions -> create session for the authenticated user
router.post("/chat/sessions", async (req, res) => {
  try {
    const { title } = req.body;
    const session = await sessionStore.createSession(req.user.id, title || "New Chat");
    res.json({ success: true, session });
  } catch (err) {
    console.error("Create session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chat/sessions/:id -> rename session (verifying ownership)
router.patch("/chat/sessions/:id", async (req, res) => {
  try {
    const { title } = req.body;
    const session = await sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this session" });
    }

    const updated = await sessionStore.renameSession(req.params.id, title);
    res.json({ success: true, session: updated });
  } catch (err) {
    console.error("Rename session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id -> delete session (verifying ownership)
router.delete("/chat/sessions/:id", async (req, res) => {
  try {
    const session = await sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this session" });
    }

    await sessionStore.deleteSession(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id/messages -> get session messages (verifying ownership)
router.get("/chat/sessions/:id/messages", async (req, res) => {
  try {
    const session = await sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this session" });
    }
    res.json({ success: true, messages: session.messages || [] });
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions/:id/messages -> save a message & get AI response (verifying ownership)
router.post("/chat/sessions/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionStore.getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this session" });
    }

    const { sender, text, messageType, workflow, n8nId } = req.body;

    // 1. BACKWARDS COMPATIBILITY: If sender is specified (user or ai), just persist the message exactly as sent
    if (sender) {
      const saved = await sessionStore.saveMessage(id, {
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
    const userMsg = await sessionStore.saveMessage(id, {
      sender: "user",
      text: text.trim(),
      messageType: "message"
    });

    // Run AI chat conversation which queries Gemini/Groq using the full message history
    const aiResponse = await aiClient.chatConversation(id, text.trim());

    // Save AI response message
    const aiMsg = await sessionStore.saveMessage(id, {
      sender: "ai",
      text: aiResponse.message,
      messageType: aiResponse.isReadyToGenerate ? "workflow" : (aiResponse.questions?.length > 0 ? "clarifying_question" : "message"),
      workflow: {
        spec: aiResponse.spec,
        isReadyToGenerate: aiResponse.isReadyToGenerate,
        questions: aiResponse.questions || null,
        suggestedTemplates: aiResponse.suggestedTemplates || []
      },
      modelName: aiResponse.modelName || null,
      tokensUsed: aiResponse.tokensUsed || null
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

// GET /api/chat/sessions/:id/spec -> get the current spec for the session (verifying ownership)
router.get("/chat/sessions/:id/spec", async (req, res) => {
  try {
    const session = await sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this session" });
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
    
    let n8nCreds = [];
    try {
      n8nCreds = await n8nClient.listCredentials();
    } catch (n8nErr) {
      console.warn("n8n list credentials failed:", n8nErr.message);
    }

    const { data: dbCreds } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", req.user.id);

    const allCreds = [...(n8nCreds.data || n8nCreds || []), ...(dbCreds || []).map(c => ({ type: c.service_name }))];

    const status = {};
    required.forEach(service => {
      let type = null;
      const name = service.toLowerCase();
      if (name.includes('slack')) type = 'slackApi';
      else if (name.includes('gmail') || name.includes('email')) type = 'gmailOAuth2';
      else if (name.includes('sheet')) type = 'googleSheetsOAuth2Api';
      else if (name.includes('calendar')) type = 'googleCalendarOAuth2Api';
      else if (name.includes('drive')) type = 'googleDriveOAuth2Api';
      else if (name.includes('doc')) type = 'googleDocsOAuth2Api';
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

    const result = await aiClient.clarifyPrompt(prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Clarify error:", err.message);
    res.json({ success: true, needsClarification: false });
  }
});

module.exports = router;
