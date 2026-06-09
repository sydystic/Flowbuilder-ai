const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../data/sessions.json");

// Ensure directory exists
const dirPath = path.dirname(FILE_PATH);
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Initialize file if not exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({ sessions: [] }, null, 2), "utf8");
}

const sessionStore = {
  getAll() {
    try {
      if (!fs.existsSync(FILE_PATH)) {
        return [];
      }
      const data = fs.readFileSync(FILE_PATH, "utf8");
      const parsed = JSON.parse(data || '{"sessions":[]}');
      return parsed.sessions || [];
    } catch (err) {
      console.error("Error reading sessions:", err);
      return [];
    }
  },

  saveAll(sessions) {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ sessions }, null, 2), "utf8");
    } catch (err) {
      console.error("Error saving sessions:", err);
    }
  },

  listSessions() {
    const sessions = this.getAll();
    // Return sessions summary without messages list to keep list lightweight
    return sessions.map(s => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      spec: s.spec || {}
    })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  getSession(id) {
    const sessions = this.getAll();
    return sessions.find(s => s.id === id);
  },

  createSession(title = "New Chat") {
    const sessions = this.getAll();
    const newSession = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      spec: {
        trigger: { service: "[unknown]", event: "[unknown]", details: "[unknown]" },
        action: { service: "[unknown]", action: "[unknown]", details: "[unknown]" },
        checklist: [
          { id: "trigger_configured", label: "Trigger app configured", checked: false },
          { id: "credentials_configured", label: "Credentials configured", checked: false },
          { id: "data_mapping", label: "Data mapping verified", checked: false },
          { id: "error_handling", label: "Error handling defined", checked: false },
          { id: "output_validated", label: "Expected output validated", checked: false }
        ]
      }
    };
    sessions.push(newSession);
    this.saveAll(sessions);
    return newSession;
  },

  renameSession(id, title) {
    const sessions = this.getAll();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index].title = title;
      sessions[index].updatedAt = new Date().toISOString();
      this.saveAll(sessions);
      return sessions[index];
    }
    return null;
  },

  deleteSession(id) {
    const sessions = this.getAll();
    const filtered = sessions.filter(s => s.id !== id);
    this.saveAll(filtered);
    return true;
  },

  saveMessage(sessionId, { sender, text, messageType = "message", workflow = null, n8nId = null }) {
    const sessions = this.getAll();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return null;

    const message = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      sender,
      text,
      messageType,
      workflow,
      n8nId,
      createdAt: new Date().toISOString()
    };

    sessions[index].messages.push(message);
    sessions[index].updatedAt = new Date().toISOString();

    // If message contains a spec in the workflow field, update the session spec
    if (workflow && workflow.spec) {
      sessions[index].spec = workflow.spec;
    }

    this.saveAll(sessions);
    return message;
  },

  updateSessionSpec(sessionId, spec) {
    const sessions = this.getAll();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].spec = spec;
      sessions[index].updatedAt = new Date().toISOString();
      this.saveAll(sessions);
      return sessions[index];
    }
    return null;
  }
};

module.exports = sessionStore;
