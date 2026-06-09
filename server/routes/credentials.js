const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");
const credentialStore = require("../services/credentialStore");

// GET /api/credentials → list all credentials
router.get("/", async (req, res) => {
  try {
    let n8nCreds = [];
    try {
      n8nCreds = await n8nClient.listCredentials();
    } catch (n8nErr) {
      console.warn("n8n list credentials failed, falling back to local store:", n8nErr.message);
      const localCreds = credentialStore.getAll();
      return res.json(localCreds);
    }

    const localCreds = credentialStore.getAll();
    const merged = n8nCreds.map(nc => {
      const local = localCreds.find(lc => lc.id === nc.id || lc.id === String(nc.id));
      return {
        id: nc.id,
        name: local ? local.name : nc.name,
        type: nc.type,
        createdAt: local ? local.createdAt : nc.createdAt || new Date().toISOString(),
      };
    });
    res.json(merged);
  } catch (err) {
    console.error("List credentials error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credentials → create credential in n8n and store metadata locally
router.post("/", async (req, res) => {
  try {
    const { name, type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: "type and data are required" });
    }

    console.log("Creating credential in n8n:", name, type);
    const result = await n8nClient.createCredential(name || "Unnamed Credential", type, data);

    // Save metadata locally
    credentialStore.save({
      id: result.id,
      name: name || result.name,
      type: type
    });

    res.json(result);
  } catch (err) {
    console.error("Create credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/credentials/:id → delete credential from n8n and local store
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Deleting credential:", id);
    let result;
    try {
      result = await n8nClient.deleteCredential(id);
    } catch (n8nErr) {
      console.warn(`n8n delete credential ${id} failed:`, n8nErr.message);
    }

    // Delete locally
    credentialStore.delete(id);

    res.json({ success: true, result });
  } catch (err) {
    console.error("Delete credential error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
