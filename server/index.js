const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Validate Encryption Key at startup
require("./services/credentialEncryptionService");

const workflowRoutes = require("./routes/workflow");
const credentialRoutes = require("./routes/credentials");
const chatRoutes = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/workflows", workflowRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api", chatRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`n8n running on ${process.env.N8N_BASE_URL}`);
});