const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const workflowRoutes = require("./routes/workflow");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/workflows", workflowRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`n8n running on ${process.env.N8N_BASE_URL}`);
});