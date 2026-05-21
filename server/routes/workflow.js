const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");

// GET /api/workflows — list all workflows
router.get("/", async (req, res) => {
  try {
    const workflows = await n8nClient.listWorkflows();
    res.json(workflows);
  } catch (err) {
    console.error("List error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workflows — create a workflow
router.post("/", async (req, res) => {
  try {
    const { workflowJson } = req.body;
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

// DELETE /api/workflows/:id — delete a workflow
router.delete("/:id", async (req, res) => {
  try {
    await n8nClient.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workflows/:id/executions — get run history
router.get("/:id/executions", async (req, res) => {
  try {
    const executions = await n8nClient.getExecutions(req.params.id);
    res.json(executions);
  } catch (err) {
    console.error("Executions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const aiClient = require("../services/aiClient");

// POST /api/workflows/generate — AI generates + deploys workflow
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log("Generating workflow for:", prompt);

    // Step 1: Ask Gemini to generate workflow JSON
    const generated = await aiClient.generateWorkflow(prompt);
    if (!generated.success) {
      return res.status(500).json({ error: "AI generation failed", details: generated.error });
    }

    console.log("Generated workflow:", generated.workflow.name);

    // Step 2: Push it to n8n
    const deployed = await n8nClient.createWorkflow(generated.workflow);

    res.json({
      success: true,
      message: "Workflow generated and deployed to n8n",
      workflowName: generated.workflow.name,
      n8nId: deployed.id,
      workflow: generated.workflow,
    });
  } catch (err) {
    console.error("Generate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;