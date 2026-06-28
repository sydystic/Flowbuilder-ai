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
    const malformedWorkflow = {
      name: "Malformed Connection Test",
      nodes: [
        {
          id: "node-a-uuid",
          name: "No-Op 1",
          type: "n8n-nodes-base.noOp",
          typeVersion: 1,
          position: [250, 300]
        },
        {
          id: "node-b-uuid",
          name: "No-Op 2",
          type: "n8n-nodes-base.noOp",
          typeVersion: 1,
          position: [500, 300]
        }
      ],
      connections: {
        "No-Op 1": {
          "main": [
            {
              "node": "No-Op 2",
              "type": "main",
              "index": 0
            }
          ]
        }
      },
      settings: {
        executionOrder: "v1"
      }
    };

    console.log("Creating malformed workflow directly...");
    const res = await client.post("/workflows", malformedWorkflow);
    console.log("Created response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("n8n API error status:", err.response?.status);
    console.error("n8n API error body:", JSON.stringify(err.response?.data, null, 2));
    console.error("Error:", err.message);
  }
}

main();
