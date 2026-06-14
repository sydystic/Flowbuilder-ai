const supabase = require("./supabaseClient");
const n8nClient = require("./n8nClient");

function mapWorkflowDbToClient(wf) {
  if (!wf) return null;
  return {
    id: wf.id,
    ownerId: wf.owner_id,
    name: wf.name,
    description: wf.description,
    workflowSpec: wf.workflow_spec,
    workflowJson: wf.workflow_json,
    status: wf.status,
    n8nWorkflowId: wf.n8n_workflow_id,
    active: wf.is_active,
    deploymentError: wf.deployment_error,
    createdAt: wf.created_at,
    updatedAt: wf.updated_at,
    nodes: wf.workflow_json?.nodes || [],
    connections: wf.workflow_json?.connections || {},
  };
}

function mapRunDbToClient(run) {
  if (!run) return null;
  return {
    id: run.execution_id,
    dbId: run.id,
    workflowId: run.workflow_id,
    status: run.status,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    logs: run.logs,
  };
}

const workflowService = {
  async listWorkflows(userId) {
    // If no Supabase / demo mode — fall back to n8n directly
    if (!process.env.SUPABASE_URL || process.env.DEMO_MODE === "true") {
      return this.listWorkflowsFromN8n();
    }

    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapWorkflowDbToClient);
    } catch (err) {
      console.warn("Supabase listWorkflows failed, falling back to n8n:", err.message);
      return this.listWorkflowsFromN8n();
    }
  },

  // Fetch workflows directly from n8n (fallback / demo mode)
  async listWorkflowsFromN8n() {
    try {
      const workflows = await n8nClient.listWorkflows();
      // workflows is already an array from our fixed n8nClient
      return (Array.isArray(workflows) ? workflows : []).map((wf) => ({
        id: String(wf.id),
        name: wf.name || "Untitled",
        description: "",
        status: wf.active ? "active" : "inactive",
        n8nWorkflowId: String(wf.id),
        active: !!wf.active,
        deploymentError: null,
        createdAt: wf.createdAt || new Date().toISOString(),
        updatedAt: wf.updatedAt || new Date().toISOString(),
        nodes: wf.nodes || [],
        connections: wf.connections || {},
        workflowJson: wf,
      }));
    } catch (err) {
      console.error("n8n listWorkflows failed:", err.message);
      return [];
    }
  },

  async getWorkflow(id, userId) {
    if (!process.env.SUPABASE_URL || process.env.DEMO_MODE === "true") {
      return this.getWorkflowFromN8n(id);
    }

    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return this.getWorkflowFromN8n(id);

      if (userId && data.owner_id !== userId) {
        const err = new Error("Forbidden: You do not own this workflow");
        err.status = 403;
        throw err;
      }

      return mapWorkflowDbToClient(data);
    } catch (err) {
      if (err.status === 403) throw err;
      console.warn("Supabase getWorkflow failed, falling back to n8n:", err.message);
      return this.getWorkflowFromN8n(id);
    }
  },

  async getWorkflowFromN8n(id) {
    try {
      const wf = await n8nClient.getWorkflow(id);
      if (!wf) return null;
      return {
        id: String(wf.id),
        name: wf.name || "Untitled",
        description: "",
        status: wf.active ? "active" : "inactive",
        n8nWorkflowId: String(wf.id),
        active: !!wf.active,
        deploymentError: null,
        createdAt: wf.createdAt || new Date().toISOString(),
        updatedAt: wf.updatedAt || new Date().toISOString(),
        nodes: wf.nodes || [],
        connections: wf.connections || {},
        workflowJson: wf,
      };
    } catch (err) {
      console.error("n8n getWorkflow failed:", err.message);
      return null;
    }
  },

  async createWorkflow(userId, workflowData) {
    if (!process.env.SUPABASE_URL || process.env.DEMO_MODE === "true") {
      // In demo mode just return a local object — real deploy happens separately
      return {
        id: `local-${Date.now()}`,
        name: workflowData.name || "Untitled Workflow",
        description: workflowData.description || "",
        workflowSpec: workflowData.workflowSpec || null,
        workflowJson: workflowData.workflowJson || null,
        status: workflowData.status || "draft",
        active: false,
        deploymentError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [],
        connections: {},
      };
    }

    const { data, error } = await supabase
      .from("workflows")
      .insert({
        owner_id: userId,
        name: workflowData.name || "Untitled Workflow",
        description: workflowData.description || "",
        workflow_spec: workflowData.workflowSpec || null,
        workflow_json: workflowData.workflowJson || null,
        status: workflowData.status || "draft",
        is_active: !!workflowData.active,
        deployment_error: workflowData.deploymentError || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapWorkflowDbToClient(data);
  },

  async updateWorkflow(id, userId, updates) {
    if (!process.env.SUPABASE_URL || process.env.DEMO_MODE === "true") {
      return { id, ...updates };
    }

    // Verify ownership
    await this.getWorkflow(id, userId);

    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.workflowSpec !== undefined) dbUpdates.workflow_spec = updates.workflowSpec;
    if (updates.workflowJson !== undefined) dbUpdates.workflow_json = updates.workflowJson;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.n8nWorkflowId !== undefined) dbUpdates.n8n_workflow_id = updates.n8nWorkflowId;
    if (updates.active !== undefined) dbUpdates.is_active = updates.active;
    if (updates.deploymentError !== undefined) dbUpdates.deployment_error = updates.deploymentError;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("workflows")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapWorkflowDbToClient(data);
  },

  async deleteWorkflow(id, userId) {
    if (!process.env.SUPABASE_URL || process.env.DEMO_MODE === "true") {
      return true;
    }
    await this.getWorkflow(id, userId);
    const { error } = await supabase.from("workflows").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async syncWorkflowRuns(workflowUuid, userId) {
    const workflow = await this.getWorkflow(workflowUuid, userId);
    if (!workflow) throw new Error("Workflow not found");

    const n8nId = workflow.n8nWorkflowId;
    if (!n8nId) return [];

    try {
      const executions = await n8nClient.getExecutions(n8nId);
      return (Array.isArray(executions) ? executions : []).map((exec) => ({
        id: String(exec.id),
        workflowId: workflowUuid,
        status: mapN8nStatus(exec.status),
        startedAt: exec.startedAt || exec.started_at || new Date().toISOString(),
        completedAt: exec.stoppedAt || exec.stopped_at || null,
        logs: exec,
      }));
    } catch (err) {
      console.warn("Failed to fetch executions from n8n:", err.message);
      return [];
    }
  },
};

function mapN8nStatus(status = "") {
  const s = status.toLowerCase();
  if (s === "success") return "success";
  if (s === "failed" || s === "crashed" || s === "error") return "failed";
  return "running";
}

module.exports = workflowService;