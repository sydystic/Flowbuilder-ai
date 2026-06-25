const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL + "/api/v1",
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: parseInt(process.env.N8N_TIMEOUT_MS || "10000", 10),
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

    // Normalize connections to n8n's standard nested structure if simplified
    const normalizedConnections = {};
    if (workflowJson.connections) {
      for (const [sourceNode, target] of Object.entries(workflowJson.connections)) {
        if (typeof target === "string") {
          // AI generated simplified connection: "NodeA": "NodeB"
          normalizedConnections[sourceNode] = {
            main: [
              [
                {
                  node: target,
                  type: "main",
                  index: 0,
                },
              ],
            ],
          };
        } else if (Array.isArray(target) && target.length > 0 && typeof target[0] === "string") {
          // AI generated simplified array: "NodeA": ["NodeB"]
          normalizedConnections[sourceNode] = {
            main: [
              target.map((nodeName) => ({
                node: nodeName,
                type: "main",
                index: 0,
              })),
            ],
          };
        } else {
          // Already in n8n's format or custom object structure
          normalizedConnections[sourceNode] = target;
        }
      }
    }

    const payload = {
      name: workflowJson.name || "Untitled Workflow",
      nodes: nodes,
      connections: normalizedConnections,
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
    const action = active ? "activate" : "deactivate";
    const res = await client.post(`/workflows/${id}/${action}`);
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
    try {
      const res = await client.post("/credentials", { name, type, data });
      return res.data;
    } catch (err) {
      console.error("n8n createCredential API error status:", err.response?.status);
      console.error("n8n createCredential API error body:", JSON.stringify(err.response?.data, null, 2));
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  async deleteCredential(id) {
    const res = await client.delete(`/credentials/${id}`);
    return res.data;
  },
};

module.exports = n8nClient;
