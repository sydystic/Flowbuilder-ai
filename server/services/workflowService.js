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
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapWorkflowDbToClient);
  },

  async getWorkflow(id, userId) {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (userId && data.owner_id !== userId) {
      const err = new Error("Forbidden: You do not own this workflow");
      err.status = 403;
      throw err;
    }

    return mapWorkflowDbToClient(data);
  },

  async createWorkflow(userId, workflowData) {
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        owner_id: userId,
        name: workflowData.name || "Untitled Workflow",
        description: workflowData.description || "",
        workflow_spec: workflowData.workflowSpec || null,
        workflow_json: workflowData.workflowJson || { nodes: [], connections: {}, settings: {} },
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