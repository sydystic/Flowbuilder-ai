require("dotenv").config({ path: "../.env" });
const n8nClient = require("./services/n8nClient");

async function runTests() {
  console.log("=== Running Backend Verification Tests ===");

  // Test Case 1: Validation rejection of completely invalid JSON
  console.log("\n--- Test Case 1: Rejecting Invalid JSON structure ---");
  try {
    await n8nClient.createWorkflow({ name: "Bad Workflow" });
    console.error("FAIL: Accepted workflow without nodes array");
  } catch (err) {
    console.log("SUCCESS: Correctly rejected invalid workflow:", err.message);
  }

  // Test Case 2: Validation rejection of node without type/name
  console.log("\n--- Test Case 2: Rejecting node missing required properties ---");
  try {
    await n8nClient.createWorkflow({
      name: "Bad Node Workflow",
      nodes: [
        { name: "My Node" } // missing type
      ]
    });
    console.error("FAIL: Accepted node missing type");
  } catch (err) {
    console.log("SUCCESS: Correctly rejected node missing type:", err.message);
  }

  // Test Case 3: Connection normalization & successful deployment
  console.log("\n--- Test Case 3: Normalizing single-nested connections & deploying ---");
  const testWorkflow = {
    name: "Verification Workflow (Fixed)",
    nodes: [
      {
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [250, 300],
        parameters: {
          rule: {
            interval: [
              {
                field: "hours",
                hoursInterval: 12
              }
            ]
          }
        }
      },
      {
        name: "No-Op Node",
        type: "n8n-nodes-base.noOp",
        typeVersion: 1,
        position: [500, 300]
      }
    ],
    // Intentional single-nested connection array
    connections: {
      "Schedule Trigger": {
        "main": [
          {
            "node": "No-Op Node",
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

  try {
    const res = await n8nClient.createWorkflow(testWorkflow);
    console.log("SUCCESS: Workflow created and deployed successfully!");
    console.log("Assigned n8n workflow ID:", res.id);
    console.log("Normalized Connections:", JSON.stringify(res.connections, null, 2));
    
    // Check that connection is double-nested in response
    const connMain = res.connections?.["Schedule Trigger"]?.main;
    if (Array.isArray(connMain) && Array.isArray(connMain[0])) {
      console.log("VERIFIED: Connection correctly normalized to double-nested array.");
    } else {
      console.error("FAIL: Connection was not double-nested!");
    }
  } catch (err) {
    console.error("FAIL: Deployment failed with error:", err.message);
  }
}

runTests();
