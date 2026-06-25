const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");
const supabase = require("../services/supabaseClient");
const requireAuth = require("../middlewares/auth");
const credentialEncryptionService = require("../services/credentialEncryptionService");

// Require authentication for all credentials routes
router.use(requireAuth);

// ── Credential type registry ───────────────────────────────────────────────
// Maps FlowBuilder service IDs to n8n credential types + field definitions
const CREDENTIAL_TYPES = {
  slackApi: {
    name: "Slack",
    icon: "chat",
    category: "Communication",
    description: "Send messages and notifications to Slack channels",
    fields: [
      { key: "accessToken", label: "Bot Token", type: "password", placeholder: "xoxb-xxxxxxxxxxxx-xxxxxxxxxxxxx", required: true }
    ]
  },
  gmailOAuth2: {
    name: "Gmail",
    icon: "mail",
    category: "Google",
    description: "Read and send emails via Gmail",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "xxxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "GOCSPX-...", required: true }
    ]
  },
  googleSheetsOAuth2Api: {
    name: "Google Sheets",
    icon: "table_chart",
    category: "Google",
    description: "Read and write data to Google Sheets",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "xxxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "GOCSPX-...", required: true }
    ]
  },
  googleCalendarOAuth2Api: {
    name: "Google Calendar",
    icon: "calendar_month",
    category: "Google",
    description: "Create and manage Google Calendar events",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "xxxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "GOCSPX-...", required: true }
    ]
  },
  googleDriveOAuth2Api: {
    name: "Google Drive",
    icon: "cloud",
    category: "Google",
    description: "Upload and manage files in Google Drive",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "xxxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "GOCSPX-...", required: true }
    ]
  },
  googleDocsOAuth2Api: {
    name: "Google Docs",
    icon: "description",
    category: "Google",
    description: "Create and edit Google Documents",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "xxxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "GOCSPX-...", required: true }
    ]
  },
  githubApi: {
    name: "GitHub",
    icon: "code",
    category: "Developer",
    description: "Trigger workflows from GitHub events and manage repos",
    fields: [
      { key: "accessToken", label: "Personal Access Token", type: "password", placeholder: "github_pat_...", required: true }
    ]
  },
  telegramApi: {
    name: "Telegram",
    icon: "near_me",
    category: "Communication",
    description: "Send messages via Telegram bots",
    fields: [
      { key: "accessToken", label: "Bot Token", type: "password", placeholder: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ", required: true }
    ]
  },
  discordApi: {
    name: "Discord",
    icon: "headset_mic",
    category: "Communication",
    description: "Post messages to Discord channels via webhooks",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://discord.com/api/webhooks/...", required: true }
    ]
  },
  notionApi: {
    name: "Notion",
    icon: "article",
    category: "Productivity",
    description: "Read and write to Notion databases and pages",
    fields: [
      { key: "apiKey", label: "Integration Token", type: "password", placeholder: "secret_...", required: true }
    ]
  },
  airtableApi: {
    name: "Airtable",
    icon: "grid_view",
    category: "Productivity",
    description: "Read and write Airtable base records",
    fields: [
      { key: "apiKey", label: "Personal Access Token", type: "password", placeholder: "pat...", required: true }
    ]
  },
  stripeApi: {
    name: "Stripe",
    icon: "credit_card",
    category: "Payments",
    description: "Handle Stripe payment events and data",
    fields: [
      { key: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_live_... or sk_test_...", required: true }
    ]
  },
  twilioApi: {
    name: "Twilio",
    icon: "sms",
    category: "Communication",
    description: "Send SMS and make calls via Twilio",
    fields: [
      { key: "accountSid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", required: true },
      { key: "authToken", label: "Auth Token", type: "password", placeholder: "your_auth_token", required: true }
    ]
  },
  sendGridApi: {
    name: "SendGrid",
    icon: "send",
    category: "Email",
    description: "Send transactional emails via SendGrid",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "SG.xxxxxxxxxxxxxxxxxx", required: true }
    ]
  },
  hubspotApi: {
    name: "HubSpot",
    icon: "hub",
    category: "CRM",
    description: "Sync contacts and deals with HubSpot CRM",
    fields: [
      { key: "accessToken", label: "Private App Token", type: "password", placeholder: "pat-na1-...", required: true }
    ]
  },
  openAiApi: {
    name: "OpenAI",
    icon: "psychology",
    category: "AI",
    description: "Use GPT models in your workflows",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true }
    ]
  },
  anthropicApi: {
    name: "Anthropic",
    icon: "smart_toy",
    category: "AI",
    description: "Use Claude models in your workflows",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-ant-...", required: true }
    ]
  },
  trelloApi: {
    name: "Trello",
    icon: "view_kanban",
    category: "Productivity",
    description: "Create and manage Trello cards and boards",
    fields: [
      { key: "apiKey", label: "API Key", type: "text", placeholder: "your_trello_api_key", required: true },
      { key: "apiToken", label: "API Token", type: "password", placeholder: "your_trello_token", required: true }
    ]
  },
  asanaApi: {
    name: "Asana",
    icon: "task_alt",
    category: "Productivity",
    description: "Create tasks and manage Asana projects",
    fields: [
      { key: "accessToken", label: "Personal Access Token", type: "password", placeholder: "your_asana_pat", required: true }
    ]
  },
  dropboxApi: {
    name: "Dropbox",
    icon: "cloud",
    category: "Storage",
    description: "Upload and manage files in Dropbox",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "your_dropbox_token", required: true }
    ]
  },
  linearApi: {
    name: "Linear",
    icon: "linear_scale",
    category: "Developer",
    description: "Create and manage Linear issues",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "lin_api_...", required: true }
    ]
  },
  httpHeaderAuth: {
    name: "Generic API Key",
    icon: "lan",
    category: "Generic",
    description: "Connect any API using a header-based key",
    fields: [
      { key: "name", label: "Header Name", type: "text", placeholder: "Authorization or X-API-KEY", required: true },
      { key: "value", label: "Header Value", type: "password", placeholder: "Bearer token_value...", required: true }
    ]
  }
};

// GET /api/credentials/types → return all supported credential types
router.get("/types", (req, res) => {
  res.json(CREDENTIAL_TYPES);
});

// GET /api/credentials/debug → return raw, normalized, and database credentials
router.get("/debug", async (req, res) => {
  try {
    const rawN8n = await n8nClient.listCredentials();
    const normalized = (rawN8n.data || rawN8n || []).map(c => ({
      id: String(c.id),
      name: c.name,
      type: c.type,
      createdAt: c.createdAt || new Date().toISOString(),
      meta: CREDENTIAL_TYPES[c.type] || {
        name: c.type,
        icon: "key",
        category: "Other",
        description: ""
      }
    }));

    const { data: dbCreds } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", req.user.id);

    res.json({
      rawN8nCredentials: rawN8n,
      normalizedCredentials: normalized,
      databaseCredentials: dbCreds || []
    });
  } catch (err) {
    res.status(500).json({ error: `Debug failed: ${err.message}` });
  }
});

// GET /api/credentials → fetch credentials, run sync with Supabase and return normalized format
router.get("/", async (req, res) => {
  try {
    const rawN8nCreds = await n8nClient.listCredentials();
    console.log("=== [DEBUG LOG] Raw n8n credential payload ===");
    console.log(JSON.stringify(rawN8nCreds, null, 2));

    // Map n8n credentials to FlowBuilder format
    const normalized = (rawN8nCreds.data || rawN8nCreds || []).map(c => ({
      id: String(c.id),
      name: c.name,
      type: c.type,
      createdAt: c.createdAt || new Date().toISOString(),
      meta: CREDENTIAL_TYPES[c.type] || {
        name: c.type,
        icon: "key",
        category: "Other",
        description: ""
      }
    }));

    console.log("=== [DEBUG LOG] Normalized credential payload ===");
    console.log(JSON.stringify(normalized, null, 2));

    // Database Sync Logic (Supabase)
    const { data: dbCreds, error: fetchError } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", req.user.id);

    if (fetchError) throw fetchError;

    const dbCredsMap = new Map();
    (dbCreds || []).forEach(c => {
      if (c.provider_user_id) {
        dbCredsMap.set(String(c.provider_user_id), c);
      }
    });

    const n8nCredsMap = new Map();
    normalized.forEach(c => {
      n8nCredsMap.set(String(c.id), c);
    });

    const syncedDbCreds = [];

    // 1. Upsert/Update local DB records from n8n
    for (const nc of normalized) {
      const existing = dbCredsMap.get(nc.id);
      if (existing) {
        if (existing.credential_name !== nc.name || existing.service_name !== nc.type) {
          const { data: updated, error: updateError } = await supabase
            .from("credentials")
            .update({
              credential_name: nc.name,
              service_name: nc.type
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (!updateError && updated) syncedDbCreds.push(updated);
        } else {
          syncedDbCreds.push(existing);
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("credentials")
          .insert({
            user_id: req.user.id,
            service_name: nc.type,
            credential_name: nc.name,
            provider_user_id: nc.id,
            is_active: true,
            encrypted_config: credentialEncryptionService.encrypt({})
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting synced credential to Supabase:", insertError.message);
        }
        if (!insertError && inserted) syncedDbCreds.push(inserted);
      }
    }

    // 2. Delete orphaned database records (present in DB but deleted in n8n)
    for (const dc of (dbCreds || [])) {
      if (dc.provider_user_id && !n8nCredsMap.has(String(dc.provider_user_id))) {
        await supabase
          .from("credentials")
          .delete()
          .eq("id", dc.id);
      }
    }

    console.log("=== [DEBUG LOG] Credentials synced/saved to Supabase ===");
    console.log(JSON.stringify(syncedDbCreds, null, 2));

    console.log("=== [DEBUG LOG] Credentials returned from GET /api/credentials ===");
    console.log(JSON.stringify(normalized, null, 2));

    res.json(normalized);
  } catch (err) {
    console.error("List credentials error:", err.message);
    res.status(500).json({ error: `Failed to fetch credentials: ${err.message}` });
  }
});

// POST /api/credentials → create credential in n8n and store encrypted in Supabase
router.post("/", async (req, res) => {
  try {
    const { name, type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: "type and data are required" });
    }
    if (!CREDENTIAL_TYPES[type]) {
      return res.status(400).json({ error: `Unknown credential type: ${type}` });
    }

    const credentialName = name || `${CREDENTIAL_TYPES[type].name} Connection`;

    // 1. Create in n8n
    const n8nResult = await n8nClient.createCredential(credentialName, type, data);

    // 2. Encrypt & Save to Supabase
    const encryptedConfig = credentialEncryptionService.encrypt(data);
    const { data: inserted, error: insertError } = await supabase
      .from("credentials")
      .insert({
        user_id: req.user.id,
        service_name: type,
        credential_name: credentialName,
        encrypted_config: encryptedConfig,
        provider_user_id: String(n8nResult.id),
        is_active: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({
      id: String(n8nResult.id),
      name: n8nResult.name,
      type: n8nResult.type,
      createdAt: n8nResult.createdAt || new Date().toISOString(),
      meta: CREDENTIAL_TYPES[type]
    });
  } catch (err) {
    console.error("Create credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/credentials/:id → delete from n8n and Supabase (checking ownership)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership & existence in Supabase
    const { data: cred, error: fetchError } = await supabase
      .from("credentials")
      .select("*")
      .eq("provider_user_id", id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Delete from n8n
    try {
      await n8nClient.deleteCredential(id);
    } catch (n8nErr) {
      console.warn(`n8n delete credential ${id} failed:`, n8nErr.message);
    }

    // Delete from Supabase
    if (cred) {
      const { error: deleteError } = await supabase
        .from("credentials")
        .delete()
        .eq("id", cred.id);
      if (deleteError) throw deleteError;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credentials/status → check which services have credentials in n8n
router.get("/status", async (req, res) => {
  try {
    const servicesStr = req.query.services || "";
    const required = servicesStr.split(",").filter(Boolean);
    const n8nCreds = await n8nClient.listCredentials();
    const allCreds = n8nCreds.data || n8nCreds || [];

    const status = {};
    required.forEach(service => {
      const name = service.toLowerCase();
      let matchedType = null;

      if (name.includes("slack")) matchedType = "slackApi";
      else if (name.includes("gmail") || name.includes("email")) matchedType = "gmailOAuth2";
      else if (name.includes("sheet")) matchedType = "googleSheetsOAuth2Api";
      else if (name.includes("calendar")) matchedType = "googleCalendarOAuth2Api";
      else if (name.includes("drive")) matchedType = "googleDriveOAuth2Api";
      else if (name.includes("doc")) matchedType = "googleDocsOAuth2Api";
      else if (name.includes("github")) matchedType = "githubApi";
      else if (name.includes("telegram")) matchedType = "telegramApi";
      else if (name.includes("discord")) matchedType = "discordApi";
      else if (name.includes("notion")) matchedType = "notionApi";
      else if (name.includes("airtable")) matchedType = "airtableApi";
      else if (name.includes("stripe")) matchedType = "stripeApi";
      else if (name.includes("twilio")) matchedType = "twilioApi";
      else if (name.includes("sendgrid")) matchedType = "sendGridApi";
      else if (name.includes("hubspot")) matchedType = "hubspotApi";
      else if (name.includes("openai")) matchedType = "openAiApi";
      else if (name.includes("anthropic") || name.includes("claude")) matchedType = "anthropicApi";
      else if (name.includes("trello")) matchedType = "trelloApi";
      else if (name.includes("asana")) matchedType = "asanaApi";
      else if (name.includes("dropbox")) matchedType = "dropboxApi";
      else if (name.includes("linear")) matchedType = "linearApi";

      // Schedule/Cron/Webhook triggers don't need credentials
      if (!matchedType) {
        status[service] = true;
        return;
      }

      status[service] = allCreds.some(c => c.type === matchedType);
    });

    res.json(status);
  } catch (err) {
    console.error("Credentials status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.CREDENTIAL_TYPES = CREDENTIAL_TYPES;