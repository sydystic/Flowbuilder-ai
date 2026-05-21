const axios = require("axios");
require("dotenv").config({ path: "../.env" });

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
    const res = await client.post("/workflows", workflowJson);
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

module.exports = n8nClient;