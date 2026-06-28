require("dotenv").config({ path: "../.env" });
const n8nClient = require("./services/n8nClient");

async function main() {
  try {
    console.log("Fetching workflows...");
    const res = await n8nClient.listWorkflows();
    console.log("Response data:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
