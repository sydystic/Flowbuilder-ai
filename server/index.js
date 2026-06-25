const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Validate Encryption Key at startup
require("./services/credentialEncryptionService");

const workflowRoutes = require("./routes/workflow");
const credentialRoutes = require("./routes/credentials");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const configRoutes = require("./routes/config");

const app = express();

// Secure Express headers with helmet
app.use(helmet());

// Dynamic CORS configuration based on ALLOWED_ORIGINS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not permitted`));
  },
  credentials: true
}));
app.use(express.json());

app.use("/api/workflows", workflowRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/users", userRoutes);
app.use("/api", configRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Flowbuilder AI API Server",
    status: "online",
    healthCheck: "/health"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Global async error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message
  });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
  console.log("n8n running on " + process.env.N8N_BASE_URL);
});

// Catch unhandled process exceptions & rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack || err.message);
  process.exit(1); // Let process manager restart
});