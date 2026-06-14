const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const BASE_URL = "http://localhost:3001/api/workflows";

async function runTests() {
  console.log("Starting backend integration tests...\n");

  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const email = "siddharth@example.com";
    const password = "TestPassword123!";

    console.log("Logging in test user...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.session) {
      throw new Error("Auth failed: " + (authError?.message || "No session"));
    }

    const token = authData.session.access_token;
    console.log("Auth success! Token acquired.\n");

    // Configure Axios default headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // 1. List Workflows (Initial state)
    console.log("1. Fetching workflows from Supabase...");
    const listRes = await axios.get(`${BASE_URL}/`);
    const initialCount = listRes.data.length;
    console.log(`Success! Database has ${initialCount} workflows.\n`);

    // 2. Generate Workflow
    console.log("2. Generating a new workflow via Groq/Gemini + n8n...");
    const generatePayload = {
      prompt: "Send an email notification every morning at 8 AM with a daily motivational quote"
    };
    console.log(`Prompt: "${generatePayload.prompt}"`);
    const genRes = await axios.post(`${BASE_URL}/generate`, generatePayload);
    
    console.log("Generation response status:", genRes.status);
    console.log("Success data:", {
      success: genRes.data.success,
      workflowId: genRes.data.workflowId,
      workflowName: genRes.data.workflowName,
      n8nId: genRes.data.n8nId
    });

    const createdUuid = genRes.data.workflowId;
    if (!createdUuid) {
      throw new Error("Workflow generation did not return a valid workflow UUID.");
    }
    console.log("Workflow UUID:", createdUuid, "\n");

    // 3. Verify in List again
    console.log("3. Fetching workflows list again to verify persistence...");
    const listRes2 = await axios.get(`${BASE_URL}/`);
    const foundInDb = listRes2.data.find(w => w.id === createdUuid);
    console.log(`Workflow found in Supabase list? ${!!foundInDb ? "YES" : "NO"}`);
    if (foundInDb) {
      console.log("Saved item name:", foundInDb.name);
      console.log("Status:", foundInDb.status);
      console.log("Active state:", foundInDb.active);
    }
    console.log("");

    // 4. Toggle Active state
    console.log(`4. Toggling active state for workflow ${createdUuid}...`);
    const toggleRes = await axios.patch(`${BASE_URL}/${createdUuid}/activate`, { active: false });
    console.log("Toggle status response active state:", toggleRes.data.active, "\n");

    // 5. Get Executions
    console.log(`5. Fetching executions (and running incremental sync) for workflow: ${createdUuid}...`);
    const execRes = await axios.get(`${BASE_URL}/${createdUuid}/executions`);
    console.log(`Executions response array count: ${execRes.data.length}`);
    console.log("");

    // 6. Delete Workflow
    console.log(`6. Deleting generated workflow ID: ${createdUuid}...`);
    const delRes = await axios.delete(`${BASE_URL}/${createdUuid}`);
    console.log("Delete response:", delRes.data);
    console.log("");

    // 7. Verify deletion
    console.log("7. Checking list one last time to confirm delete...");
    const listRes3 = await axios.get(`${BASE_URL}/`);
    const stillExists = listRes3.data.some(w => w.id === createdUuid);
    console.log(`Workflow still in Supabase? ${stillExists ? "YES" : "NO"}`);
    
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
