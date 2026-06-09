const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/workflows";

async function runTests() {
  console.log("Starting backend integration tests...\n");

  try {
    // 1. Get History
    console.log("1. Fetching history...");
    const historyRes = await axios.get(`${BASE_URL}/history`);
    console.log(`Success! History contains ${historyRes.data.length} items.`);
    console.log("History items:", historyRes.data, "\n");

    // 2. List Workflows
    console.log("2. Listing n8n workflows...");
    const listRes = await axios.get(`${BASE_URL}/`);
    console.log(`Success! n8n has ${listRes.data.length || (listRes.data.data ? listRes.data.data.length : 0)} workflows.`);
    console.log("Workflows:", listRes.data, "\n");

    // 3. Generate Workflow
    console.log("3. Generating a new workflow via Groq + n8n...");
    const generatePayload = {
      prompt: "Send an email notification every morning at 8 AM with a daily motivational quote"
    };
    console.log(`Prompt: "${generatePayload.prompt}"`);
    const genRes = await axios.post(`${BASE_URL}/generate`, generatePayload);
    console.log("Generation response status:", genRes.status);
    console.log("Success data:", {
      success: genRes.data.success,
      workflowName: genRes.data.workflowName,
      n8nId: genRes.data.n8nId
    });
    const createdId = genRes.data.n8nId;
    console.log("Generated Workflow nodes:", genRes.data.workflow?.nodes, "\n");

    if (!createdId) {
      throw new Error("Workflow generation did not return a valid n8nId.");
    }

    // 4. Verify in History again
    console.log("4. Fetching history again to verify addition...");
    const historyRes2 = await axios.get(`${BASE_URL}/history`);
    const foundInHistory = historyRes2.data.find(w => w.n8nId === createdId);
    console.log(`Workflow in history? ${!!foundInHistory ? "YES" : "NO"}`);
    if (foundInHistory) {
      console.log("Saved item:", foundInHistory);
    }
    console.log("");

    // 5. Verify in n8n list again
    console.log("5. Listing workflows again to verify n8n creation...");
    const listRes2 = await axios.get(`${BASE_URL}/`);
    // n8n returns standard list, we find our createdId
    const workflowsList = Array.isArray(listRes2.data) ? listRes2.data : (listRes2.data.data || []);
    const foundInN8n = workflowsList.find(w => w.id === createdId);
    console.log(`Workflow in n8n? ${!!foundInN8n ? "YES" : "NO"}`);
    console.log("");

    // 6. Get Executions
    console.log(`6. Fetching executions for workflow ID: ${createdId}...`);
    const execRes = await axios.get(`${BASE_URL}/${createdId}/executions`);
    console.log("Executions response:", execRes.data);
    console.log("");

    // 7. Delete Workflow
    console.log(`7. Deleting generated workflow ID: ${createdId}...`);
    const delRes = await axios.delete(`${BASE_URL}/${createdId}`);
    console.log("Delete response:", delRes.data);
    console.log("");

    // 8. Verify deletion
    console.log("8. Checking list one last time to confirm delete...");
    const listRes3 = await axios.get(`${BASE_URL}/`);
    const workflowsListFinal = Array.isArray(listRes3.data) ? listRes3.data : (listRes3.data.data || []);
    const stillExists = workflowsListFinal.some(w => w.id === createdId);
    console.log(`Workflow still in n8n? ${stillExists ? "YES" : "NO"}`);
    
    console.log("\nAll backend integration tests completed successfully!");
  } catch (error) {
    console.error("Test failed with error:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
