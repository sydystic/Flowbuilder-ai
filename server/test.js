require("dotenv").config({ path: "../.env" });
const aiClient = require("./services/aiClient");

aiClient.generateWorkflow("send a Slack message every morning at 9am").then((r) => {
  if (r.success) {
    console.log("NODE COUNT:", r.workflow.nodes.length);
    console.log("NODES:", JSON.stringify(r.workflow.nodes, null, 2));
    console.log("CONNECTIONS:", JSON.stringify(r.workflow.connections, null, 2));
  } else {
    console.log("FAILED:", r.error);
  }
});