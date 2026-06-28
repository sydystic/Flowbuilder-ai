const express = require("express");
const router = express.Router();
const n8nClient = require("../services/n8nClient");
const aiClient = require("../services/aiClient");
const workflowService = require("../services/workflowService");
const requireAuth = require("../middlewares/auth");

// Require authentication for all workflow routes
router.use(requireAuth);

// GET /api/workflows → Retrieve all workflows for the authenticated user
router.get("/", async (req, res) => {
  try {
    const workflows = await workflowService.listWorkflows(req.user.id);
    res.json(workflows);
  } catch (err) {
    console.error("List workflows error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workflows/:id → Retrieve a single workflow by UUID, checking ownership
router.get("/:id", async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json(workflow);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/workflows/generate → Generate, save draft, and deploy a workflow
router.post("/generate", async (req, res) => {
  try {
    const { prompt, spec: clientSpec } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log("1. Generating/extracting spec for:", prompt);
    const spec = clientSpec || await aiClient.generateWorkflowSpec(prompt);

    console.log("2. Saving workflow as draft in Supabase...");
    let workflow = await workflowService.createWorkflow(req.user.id, {
      name: spec.name || "Generated Workflow",
      description: spec.description || prompt,
      workflowSpec: spec,
      status: "draft",
      active: false
    });

    console.log("3. Fetching credentials from n8n...");
    let credentialsMap = {};
    try {
      const credentials = await n8nClient.listCredentials();
      // Build a map keyed by credential type, assuming the API returns an array of objects with id, name, type
      // If the API returns { data: [...] } we need to adjust.
      // From the n8nClient.listCredentials, it returns res.data, which is likely the array.
      credentialsMap = credentials.reduce((map, cred) => {
        // We assume cred.type is the credential type string, e.g., "slackApi", "gmailOAuth2"
        // If there are multiple credentials of the same type, we might want to keep an array or pick the first.
        // For simplicity, we'll map type to the first credential of that type.
        // But note: the AI expects a single credential per type? Actually, the AI might need to choose among multiple.
        // However, the system prompt we are adding uses the map as is. We'll change the map to be: { type: [{ id, name }, ...] }
        // But the instruction says: use these exact IDs. We'll keep it as an array per type and let the AI handle it?
        // However, the AI prompt we are adding expects to see the map and then use the id and name.
        // We'll change the map to be: { [cred.type]: { id: cred.id, name: cred.name } } for the first one.
        // Alternatively, we can change the AI prompt to handle arrays. But to keep it simple, we'll assume one credential per type.
        // If there are multiple, we'll take the first one and log a warning.
        if (!map[cred.type]) {
          map[cred.type] = { id: cred.id, name: cred.name };
        } else {
          console.warn(`Multiple credentials of type ${cred.type} found, using the first one.`);
        }
        return map;
      }, {});
    } catch (err) {
      console.warn("Failed to fetch credentials from n8n, proceeding without credential mapping:", err.message);
      // credentialsMap remains empty
    }

    console.log("4. Generating workflow_json via AI with credentials map:", credentialsMap);
    let generated;
    try {
      generated = await aiClient.generateWorkflow(prompt, credentialsMap);
      if (!generated.success) {
        throw new Error(generated.error || "AI generation returned success=false");
      }
    } catch (aiErr) {
      console.error("AI Generation failed:", aiErr.message);
      workflow = await workflowService.updateWorkflow(workflow.id, req.user.id, {
        status: "failed",
        deploymentError: `AI Generation failed: ${aiErr.message}`
      });
      return res.json({
        success: false,
        error: `AI Generation failed: ${aiErr.message}`,
        workflowId: workflow.id,
        status: "failed"
      });
    }

    console.log("4. Updating draft with workflow_json...");
    workflow = await workflowService.updateWorkflow(workflow.id, req.user.id, {
      name: generated.workflow.name || workflow.name,
      workflowJson: generated.workflow
    });

    console.log("5. Deploying to n8n...");
    let deployed;
    try {
      deployed = await n8nClient.createWorkflow(generated.workflow);
    } catch (n8nErr) {
      console.error("n8n deployment failed:", n8nErr.message);
      workflow = await workflowService.updateWorkflow(workflow.id, req.user.id, {
        status: "failed",
        deploymentError: `n8n deployment failed: ${n8nErr.message}`
      });
      return res.json({
        success: false,
        error: `n8n deployment failed: ${n8nErr.message}`,
        workflowId: workflow.id,
        status: "failed",
        workflow: workflow
      });
    }

    console.log("6. Saving n8n ID and marking active in Supabase...");
    workflow = await workflowService.updateWorkflow(workflow.id, req.user.id, {
      n8nWorkflowId: deployed.id,
      status: "active",
      active: true,
      deploymentError: null // Clear any error
    });

    res.json({
      success: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      n8nId: deployed.id,
      workflow: workflow
    });
  } catch (err) {
    console.error("Generate route error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workflows/:id/deploy → Retry deploying a failed or draft workflow
router.post("/:id/deploy", async (req, res) => {
  try {
    const { id } = req.params;
    let workflow = await workflowService.getWorkflow(id, req.user.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (!workflow.workflowJson) {
      console.log("Workflow is missing workflow_json. Regenerating...");
      const prompt = workflow.description || workflow.name;
      const generated = await aiClient.generateWorkflow(prompt);
      if (!generated.success) {
        throw new Error(generated.error || "AI generation failed");
      }
      workflow = await workflowService.updateWorkflow(id, req.user.id, {
        name: generated.workflow.name,
        workflowJson: generated.workflow
      });
    }

    console.log("Attempting to deploy to n8n:", workflow.name);
    const deployed = await n8nClient.createWorkflow(workflow.workflowJson);

    console.log("Deployment success. Updating workflow in Supabase...");
    workflow = await workflowService.updateWorkflow(id, req.user.id, {
      n8nWorkflowId: deployed.id,
      status: "active",
      active: true,
      deploymentError: null
    });

    res.json({
      success: true,
      workflow
    });
  } catch (err) {
    console.error("Deploy retry error:", err.message);
    await workflowService.updateWorkflow(req.params.id, req.user.id, {
      status: "failed",
      deploymentError: err.message
    });
    res.status(500).json({ error: err.message });
  }
});

// Helper for activation toggles
const handleActivate = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // Verify ownership
    const workflow = await workflowService.getWorkflow(id, req.user.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (workflow.n8nWorkflowId) {
      await n8nClient.activateWorkflow(workflow.n8nWorkflowId, active);
    } else if (active) {
      return res.status(400).json({ error: "Cannot activate a workflow that has not been deployed to n8n yet" });
    }

    const updated = await workflowService.updateWorkflow(id, req.user.id, { active });
    res.json(updated);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
};

// PATCH /api/workflows/activate/:id -> activate or deactivate workflow
router.patch("/activate/:id", handleActivate);

// PATCH /api/workflows/:id/activate -> activate or deactivate workflow
router.patch("/:id/activate", handleActivate);

// GET /api/workflows/:id/executions → Fetch and sync executions history
router.get("/:id/executions", async (req, res) => {
  try {
    const runs = await workflowService.syncWorkflowRuns(req.params.id, req.user.id);
    res.json(runs);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/workflows/:id → Delete workflow from Supabase and n8n
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await workflowService.getWorkflow(id, req.user.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (workflow.n8nWorkflowId) {
      try {
        await n8nClient.deleteWorkflow(workflow.n8nWorkflowId);
      } catch (n8nErr) {
        console.warn(`n8n delete workflow ${workflow.n8nWorkflowId} failed:`, n8nErr.message);
      }
    }

    await workflowService.deleteWorkflow(id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;