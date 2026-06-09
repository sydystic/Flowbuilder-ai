/*const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL + "/api/v1",
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
});

const n8nClient = {
  async listWorkflows() {
    const res = await client.get("/workflows");
    return res.data;
  },

  async getWorkflow(id) {
    const res = await client.get(`/workflows/${id}`);
    return res.data;
  },

  async createWorkflow(workflowJson) {
    const payload = {
      name: workflowJson.name,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || {},
      settings: workflowJson.settings || {},
      staticData: null,
    };
    console.log("PAYLOAD:", JSON.stringify(payload, null, 2));
    const res = await client.post("/workflows", payload);
    console.log("N8N RESPONSE:", JSON.stringify(res.data, null, 2));

    const createdId = res.data.id;
    if (createdId) {
      const fetched = await n8nClient.getWorkflow(createdId);
      console.log("FETCHED WORKFLOW FROM N8N:", JSON.stringify(fetched, null, 2));
      if (!fetched.nodes || fetched.nodes.length === 0) {
        throw new Error(`Workflow created with ID ${createdId} but has 0 nodes.`);
      }
    }

    return res.data;
  },

  async activateWorkflow(id) {
    const res = await client.patch(`/workflows/${id}`, { active: true });
    return res.data;
  },

  async deleteWorkflow(id) {
    const res = await client.delete(`/workflows/${id}`);
    return res.data;
  },

  async getExecutions(workflowId) {
    const res = await client.get(
      `/executions?workflowId=${workflowId}&limit=10`
    );
    return res.data;
  },
};

module.exports = n8nClient;*/

const axios = require("axios");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL + "/api/v1",
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
});

const n8nClient = {
  async listWorkflows() {
    const res = await client.get("/workflows");
    return res.data;
  },

  async createWorkflow(workflowJson) {
  const crypto = require("crypto");
  const nodes = (workflowJson.nodes || []).map((node) => ({
    id: crypto.randomUUID(),
    name: node.name,
    type: node.type,
    typeVersion: node.typeVersion || 1,
    position: node.position || [250, 300],
    parameters: node.parameters || {},
    credentials: node.credentials || {},
  }));

  const payload = {
    name: workflowJson.name || "Untitled Workflow",
    nodes: nodes,
    connections: workflowJson.connections || {},
    settings: { executionOrder: "v1" },
    staticData: null,
  };

  console.log("Sending to n8n — node count:", payload.nodes.length);
  console.log("Full payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await client.post("/workflows", payload);
    return res.data;
  } catch (err) {
    // Log the FULL axios error including n8n's response body
    console.error("n8n API error status:", err.response?.status);
    console.error("n8n API error body:", JSON.stringify(err.response?.data, null, 2));
    console.error("n8n API error message:", err.message);
    throw new Error(err.response?.data?.message || err.message);
  }
},

  async activateWorkflow(id, active = true) {
    const res = await client.patch(`/workflows/${id}`, { active });
    return res.data;
  },

  async deleteWorkflow(id) {
    const res = await client.delete(`/workflows/${id}`);
    return res.data;
  },

  async getExecutions(workflowId) {
    const res = await client.get(`/executions?workflowId=${workflowId}&limit=10`);
    return res.data;
  },

  async listCredentials() {
    const res = await client.get("/credentials");
    return res.data;
  },

  async createCredential(name, type, data) {
    const res = await client.post("/credentials", { name, type, data });
    return res.data;
  },

  async deleteCredential(id) {
    const res = await client.delete(`/credentials/${id}`);
    return res.data;
  },
};

module.exports = n8nClient;
