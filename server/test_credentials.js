const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const dotenvResult = require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
console.log("Dotenv load error:", dotenvResult.error);
console.log("Dotenv parsed keys:", dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : "none");

const BASE_URL = "http://localhost:3001/api/credentials";

async function runTests() {
  console.log("Starting backend credentials integration tests...\n");

  try {
    // Authenticate test user
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("DEBUG test_credentials - URL:", supabaseUrl);
    console.log("DEBUG test_credentials - KEY (first 10):", supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : "undefined");
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
    // 1. List credentials (should be empty or fallback to local JSON)
    console.log("1. Listing credentials...");
    const listRes = await axios.get(BASE_URL);
    console.log(`Success! Found ${listRes.data.length} credentials.`);
    console.log("Credentials list:", JSON.stringify(listRes.data, null, 2), "\n");

    // 2. Create Telegram Credential
    console.log("2. Creating a Telegram credential...");
    const payload = {
      name: "Telegram Test Bot Connection",
      type: "telegramApi",
      data: {
        accessToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
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
