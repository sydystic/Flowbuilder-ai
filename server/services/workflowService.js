const supabase = require("./supabaseClient");
const n8nClient = require("./n8nClient");

/**
 * Maps database workflow snake_case properties to frontend camelCase properties
 */
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
    // Extract nodes and connections for the UI
    nodes: wf.workflow_json?.nodes || [],
    connections: wf.workflow_json?.connections || {}
  };
}

/**
 * Maps database run to frontend format
 */
function mapRunDbToClient(run) {
  if (!run) return null;
  return {
    id: run.execution_id,
    dbId: run.id,
    workflowId: run.workflow_id,
    status: run.status,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    logs: run.logs
  };
}

const workflowService = {
  /**
   * Retrieves all workflows for a specific user
   */
  async listWorkflows(userId) {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapWorkflowDbToClient);
  },

  /**
   * Retrieves a single workflow by ID, ensuring ownership
   */
  async getWorkflow(id, userId) {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Verify ownership
    if (data.owner_id !== userId) {
      const err = new Error("Forbidden: You do not own this workflow");
      err.status = 403;
      throw err;
    }

    return mapWorkflowDbToClient(data);
  },

  /**
   * Creates a new workflow under the authenticated user
   */
  async createWorkflow(userId, workflowData) {
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
        deployment_error: workflowData.deploymentError || null
      })
      .select()
      .single();

    if (error) throw error;
    return mapWorkflowDbToClient(data);
  },

  /**
   * Updates a workflow by ID, ensuring ownership
   */
  async updateWorkflow(id, userId, updates) {
    // 1. Verify ownership first
    await this.getWorkflow(id, userId);

    // 2. Map camelCase updates back to snake_case if necessary
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

  /**
   * Deletes a workflow by ID, ensuring ownership
   */
  async deleteWorkflow(id, userId) {
    // 1. Verify ownership
    await this.getWorkflow(id, userId);

    // 2. Delete
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Performs an incremental sync of n8n runs to the Supabase workflow_runs table
   */
  async syncWorkflowRuns(workflowUuid, userId) {
    // 1. Get workflow to verify ownership and extract n8n ID
    const workflow = await this.getWorkflow(workflowUuid, userId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.n8nWorkflowId) {
      // It's a draft or has no executions yet
      const { data, error } = await supabase
        .from("workflow_runs")
        .select("*")
        .eq("workflow_id", workflowUuid)
        .order("started_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapRunDbToClient);
    }

    // 2. Query the latest run timestamp in Supabase
    const { data: latestRuns, error: runsQueryError } = await supabase
      .from("workflow_runs")
      .select("started_at")
      .eq("workflow_id", workflowUuid)
      .order("started_at", { ascending: false })
      .limit(1);

    if (runsQueryError) throw runsQueryError;
    const latestTimestamp = latestRuns && latestRuns.length > 0 ? latestRuns[0].started_at : null;

    // 3. Request executions from n8n
    let executions = [];
    try {
      executions = await n8nClient.getExecutions(workflow.n8nWorkflowId);
    } catch (err) {
      console.warn(`Failed to retrieve executions from n8n for workflow ${workflow.n8nWorkflowId}:`, err.message);
    }

    // 4. Incremental Sync: Filter n8n executions newer than latestTimestamp
    const newExecutions = latestTimestamp 
      ? executions.filter(exec => new Date(exec.startedAt) > new Date(latestTimestamp))
      : executions;

    // 5. Upsert new runs to Supabase
    if (newExecutions.length > 0) {
      const runsToInsert = newExecutions.map(exec => {
        // Map status (n8n: success, failed, running, crashed, etc. -> success, failed, running)
        let status = "running";
        const n8nStatus = (exec.status || "").toLowerCase();
        if (n8nStatus === "success") {
          status = "success";
        } else if (n8nStatus === "failed" || n8nStatus === "crashed" || n8nStatus === "error") {
          status = "failed";
        }

        return {
          workflow_id: workflowUuid,
          execution_id: String(exec.id),
          status: status,
          started_at: exec.startedAt || new Date().toISOString(),
          completed_at: exec.stoppedAt || null,
          logs: exec // Store the full execution object in logs
        };
      });

      // Insert/Upsert into Supabase
      const { error: upsertError } = await supabase
        .from("workflow_runs")
        .upsert(runsToInsert, { onConflict: "workflow_id,execution_id" });

      if (upsertError) {
        console.error("Error upserting workflow runs to Supabase:", upsertError.message);
      }
    }

    // 6. Fetch and return all runs for this workflow
    const { data: allRuns, error: fetchRunsError } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("workflow_id", workflowUuid)
      .order("started_at", { ascending: false });

    if (fetchRunsError) throw fetchRunsError;
    return (allRuns || []).map(mapRunDbToClient);
  }
};

module.exports = workflowService;
