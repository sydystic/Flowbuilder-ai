const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");
const aiClient = require("../services/aiClient");
const historyStore = require("../services/historyStore");

// POST /generate → calls aiClient then n8nClient.createWorkflow, saves to historyStore, returns {success, workflowName, n8nId, workflow}
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log("Generating workflow for:", prompt);
    const generated = await aiClient.generateWorkflow(prompt);
    if (!generated.success) {
      return res.status(500).json({
        error: "AI generation failed",
        details: generated.error,
      });
    }

    console.log("Generated workflow:", generated.workflow.name);
    const deployed = await n8nClient.createWorkflow(generated.workflow);

    historyStore.save({
      prompt,
      workflowName: generated.workflow.name,
      n8nId: deployed.id,
    });

    res.json({
      success: true,
      workflowName: generated.workflow.name,
      n8nId: deployed.id,
      workflow: generated.workflow,
    });
   } catch (err) {
  console.error("Generate error:", err.message);
  res.status(500).json({
    error: err.message || "Unknown error",
    hint: "Check server console for full n8n error details"
  });
}
});

// GET /history → returns historyStore.getAll()
router.get("/history", (req, res) => {
  try {
    res.json(historyStore.getAll());
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET / → n8nClient.listWorkflows()
router.get("/", async (req, res) => {
  try {
    const workflows = await n8nClient.listWorkflows();
    res.json(workflows);
  } catch (err) {
    console.error("List error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST / → n8nClient.createWorkflow(workflowJson)
router.post("/", async (req, res) => {
  try {
    const workflowJson = req.body.workflowJson || req.body;
    if (!workflowJson) {
      return res.status(400).json({ error: "workflowJson is required" });
    }
    const result = await n8nClient.createWorkflow(workflowJson);
    res.json(result);
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /activate/:id -> activate or deactivate workflow in n8n
router.patch("/activate/:id", async (req, res) => {
  try {
    const { active } = req.body;
    const result = await n8nClient.activateWorkflow(req.params.id, active);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/activate -> activate or deactivate workflow in n8n
router.patch("/:id/activate", async (req, res) => {
  try {
    const { active } = req.body;
    const result = await n8nClient.activateWorkflow(req.params.id, active);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/executions → n8nClient.getExecutions(req.params.id)
router.get("/:id/executions", async (req, res) => {
  try {
    const executions = await n8nClient.getExecutions(req.params.id);
    res.json(executions);
  } catch (err) {
    console.error("Executions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id → n8nClient.deleteWorkflow(req.params.id)
router.delete("/:id", async (req, res) => {
  try {
    const result = await n8nClient.deleteWorkflow(req.params.id);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;