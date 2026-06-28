require("dotenv").config({ path: "../.env" });
const axios = require("axios");

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL + "/api/v1",
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
});

async function main() {
  try {
    const dummyWorkflow = {
      name: "Test API Workflow (direct)",
      nodes: [
        {
          id: "12345678-abcd-1234-abcd-1234567890ab",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.2,
          position: [250, 300],
          parameters: {
            rule: {
              interval: [
                {
                  field: "hours",
                  hoursInterval: 1
                }
              ]
            }
          },
          credentials: {}
        }
      ],
      connections: {},
      settings: {
        executionOrder: "v1"
      }
    };

    console.log("Creating workflow directly...");
    const res = await client.post("/workflows", dummyWorkflow);
    console.log("Created response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("n8n API error status:", err.response?.status);
    console.error("n8n API error body:", JSON.stringify(err.response?.data, null, 2));
    console.error("Error:", err.message);
  }
}

main();
