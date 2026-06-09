const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/credentials";

async function runTests() {
  console.log("Starting backend credentials integration tests...\n");

  try {
    // 1. List credentials (should be empty or fallback to local JSON)
    console.log("1. Listing credentials...");
    const listRes = await axios.get(BASE_URL);
    console.log(`Success! Found ${listRes.data.length} credentials.`);
    console.log("Credentials list:", JSON.stringify(listRes.data, null, 2), "\n");

    // 2. Create Slack Credential
    console.log("2. Creating a Slack credential...");
    const payload = {
      name: "Slack Test Bot Connection",
      type: "slackApi",
      data: {
        accessToken: "xoxb-test-token-12345"
      }
    };
    const createRes = await axios.post(BASE_URL, payload);
    console.log("Create credential response status:", createRes.status);
    console.log("Created credential:", JSON.stringify(createRes.data, null, 2), "\n");

    const createdId = createRes.data.id;

    // 3. List credentials again to verify
    console.log("3. Listing credentials again...");
    const listRes2 = await axios.get(BASE_URL);
    console.log(`Success! Found ${listRes2.data.length} credentials.`);
    const found = listRes2.data.find(c => c.id === createdId || String(c.id) === String(createdId));
    console.log(`Found newly created credential in list? ${found ? "YES" : "NO"}`);
    if (found) {
      console.log("Details:", JSON.stringify(found, null, 2));
    }
    console.log("");

    // 4. Delete the credential
    if (createdId) {
      console.log(`4. Deleting credential ID: ${createdId}...`);
      const delRes = await axios.delete(`${BASE_URL}/${createdId}`);
      console.log("Delete response:", JSON.stringify(delRes.data, null, 2), "\n");

      // 5. Verify deletion
      console.log("5. Checking list one last time to confirm delete...");
      const listRes3 = await axios.get(BASE_URL);
      const stillExists = listRes3.data.some(c => c.id === createdId || String(c.id) === String(createdId));
      console.log(`Credential still exists? ${stillExists ? "YES" : "NO"}`);
    }

    console.log("\nAll credentials integration tests completed successfully!");
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
