const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");
const supabase = require("../services/supabaseClient");
const requireAuth = require("../middlewares/auth");
const credentialEncryptionService = require("../services/credentialEncryptionService");

// Require authentication for all credentials routes
router.use(requireAuth);

// GET /api/credentials → List all credentials for the authenticated user (secrets stripped)
router.get("/", async (req, res) => {
  try {
    const { data: dbCreds, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) throw error;

    const mapped = (dbCreds || []).map(c => {
      return {
        id: c.id, // Supabase UUID
        name: c.credential_name,
        type: c.service_name,
        createdAt: c.created_at || new Date().toISOString(),
        isActive: c.is_active,
        n8nId: c.provider_user_id // The n8n credential ID
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("List credentials error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credentials → Create credential in n8n and store encrypted in Supabase
router.post("/", async (req, res) => {
  try {
    const { name, type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: "type and data are required" });
    }

    const credentialName = name || `Credential for ${type}`;

    console.log("Creating credential in n8n:", credentialName, type);
    const n8nResult = await n8nClient.createCredential(credentialName, type, data);

    console.log("Encrypting credential secrets...");
    const encryptedConfig = credentialEncryptionService.encrypt(data);

    console.log("Saving encrypted credential to Supabase...");
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

    if (insertError) {
      throw insertError;
    }

    res.json({
      id: inserted.id,
      name: inserted.credential_name,
      type: inserted.service_name,
      createdAt: inserted.created_at,
      n8nId: inserted.provider_user_id
    });
  } catch (err) {
    console.error("Create credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/credentials/:id → Delete credential from n8n and Supabase (checking ownership)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership & existence
    const { data: cred, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!cred) {
      return res.status(404).json({ error: "Credential not found" });
    }

    if (cred.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You do not own this credential" });
    }

    // Delete from n8n (if it has n8n credential ID)
    if (cred.provider_user_id) {
      try {
        console.log("Deleting credential from n8n:", cred.provider_user_id);
        await n8nClient.deleteCredential(cred.provider_user_id);
      } catch (n8nErr) {
        console.warn(`n8n delete credential ${cred.provider_user_id} failed:`, n8nErr.message);
      }
    }

    // Delete from Supabase
    console.log("Deleting credential from Supabase:", id);
    const { error: deleteError } = await supabase
      .from("credentials")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (err) {
    console.error("Delete credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
