const supabase = require("./supabaseClient");

const sessionStore = {
  async listSessions(userId) {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at, spec")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error listing sessions from Supabase:", error.message);
        return [];
      }

      return (data || []).map(s => ({
        id: s.id,
        title: s.title,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        spec: s.spec || {}
      }));
    } catch (err) {
      console.error("Error listing sessions exception:", err.message);
      return [];
    }
  },

  async getSession(id) {
    try {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (convError || !conv) {
        return null;
      }

      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Error fetching messages for session:", msgError.message);
      }

      return {
        id: conv.id,
        ownerId: conv.owner_id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        spec: conv.spec || {},
        messages: (messages || []).map(m => ({
          id: m.id,
          sender: m.role,
          text: m.content,
          messageType: m.meta?.messageType || 'message',
          workflow: m.meta?.workflow || null,
          n8nId: m.meta?.n8nId || null,
          createdAt: m.created_at
        }))
      };
    } catch (err) {
      console.error("Error getting session exception:", err.message);
      return null;
    }
  },

  async createSession(userId, title = "New Chat") {
    const defaultSpec = {
      trigger: { service: "[unknown]", event: "[unknown]", details: "[unknown]" },
      action: { service: "[unknown]", action: "[unknown]", details: "[unknown]" },
      checklist: [
        { id: "trigger_configured", label: "Trigger app configured", checked: false },
        { id: "credentials_configured", label: "Credentials configured", checked: false },
        { id: "data_mapping", label: "Data mapping verified", checked: false },
        { id: "error_handling", label: "Error handling defined", checked: false },
        { id: "output_validated", label: "Expected output validated", checked: false }
      ]
    };

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        owner_id: userId,
        title,
        spec: defaultSpec
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session in Supabase:", error.message);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      spec: data.spec,
      messages: []
    };
  },

  async renameSession(id, title) {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error renaming session in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      spec: data.spec
    };
  },

  async deleteSession(id) {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting session in Supabase:", error.message);
      return false;
    }
    return true;
  },

  async saveMessage(sessionId, { sender, text, messageType = "message", workflow = null, n8nId = null, modelName = null, tokensUsed = null }) {
    const meta = { messageType, workflow, n8nId };

    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: sessionId,
        role: sender,
        content: text,
        meta,
        model_name: modelName,
        tokens_used: tokensUsed
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error saving message in Supabase:", msgError.message);
      throw msgError;
    }

    const convUpdates = {
      updated_at: new Date().toISOString()
    };

    if (workflow && workflow.spec) {
      convUpdates.spec = workflow.spec;
    }

    const { error: convError } = await supabase
      .from("conversations")
      .update(convUpdates)
      .eq("id", sessionId);

    if (convError) {
      console.error("Error updating conversation metadata in Supabase:", convError.message);
    }

    return {
      id: msg.id,
      sender: msg.role,
      text: msg.content,
      messageType: msg.meta?.messageType || 'message',
      workflow: msg.meta?.workflow || null,
      n8nId: msg.meta?.n8nId || null,
      createdAt: msg.created_at
    };
  },

  async updateSessionSpec(sessionId, spec) {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        spec,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating session spec in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      spec: data.spec
    };
  }
};

module.exports = sessionStore;
