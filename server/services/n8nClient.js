const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL + "/api/v1",
  headers: {
    "X-N8N-API-KEY": process.env.N8N_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: parseInt(process.env.N8N_TIMEOUT_MS || "10000", 10),
});

const validateWorkflow = (wf) => {
  if (!wf || typeof wf !== "object") {
    throw new Error("Workflow must be a valid JSON object");
  }
  if (!Array.isArray(wf.nodes)) {
    throw new Error("Workflow must contain a 'nodes' array");
  }
  for (const node of wf.nodes) {
    if (!node.name) {
      throw new Error("Every node must have a 'name' property");
    }
    if (!node.type) {
      throw new Error(`Node '${node.name || "unnamed"}' must have a 'type' property`);
    }
  }
  if (wf.connections && (typeof wf.connections !== "object" || Array.isArray(wf.connections))) {
    throw new Error("'connections' must be a JSON object");
  }
  return true;
};

const normalizeConnections = (connections) => {
  const normalized = {};
  if (!connections || typeof connections !== "object" || Array.isArray(connections)) {
    return normalized;
  }

  for (const [sourceNode, target] of Object.entries(connections)) {
    if (!target) continue;

    // Case 1: Target is a simple string -> "NodeB"
    if (typeof target === "string") {
      normalized[sourceNode] = {
        main: [
          [
            {
              node: target,
              type: "main",
              index: 0,
            },
          ],
        ],
      };
      continue;
    }

    // Case 2: Target is an array
    if (Array.isArray(target)) {
      if (target.length === 0) continue;

      // Subcase 2.1: Array of strings -> ["NodeB", "NodeC"]
      if (typeof target[0] === "string") {
        normalized[sourceNode] = {
          main: [
            target.map((nodeName) => ({
              node: nodeName,
              type: "main",
              index: 0,
            })),
          ],
        };
      }
      // Subcase 2.2: Double-nested array of strings -> [["NodeB", "NodeC"]]
      else if (Array.isArray(target[0]) && typeof target[0][0] === "string") {
        normalized[sourceNode] = {
          main: target.map((innerArray) =>
            innerArray.map((nodeName) => ({
              node: nodeName,
              type: "main",
              index: 0,
            }))
          ),
        };
      }
      // Subcase 2.3: Array of objects -> [ { node: "NodeB", type: "main", index: 0 } ]
      else if (typeof target[0] === "object" && target[0] !== null && !Array.isArray(target[0])) {
        normalized[sourceNode] = {
          main: [
            target.map((conn) => ({
              node: conn.node,
              type: conn.type || "main",
              index: conn.index !== undefined ? conn.index : 0,
            })),
          ],
        };
      }
      // Subcase 2.4: Array of arrays of objects
      else if (Array.isArray(target[0]) && typeof target[0][0] === "object" && target[0][0] !== null) {
        normalized[sourceNode] = {
          main: target.map((innerArray) =>
            innerArray.map((conn) => ({
              node: conn.node,
              type: conn.type || "main",
              index: conn.index !== undefined ? conn.index : 0,
            }))
          ),
        };
      }
      continue;
    }

    // Case 3: Target is an object (e.g. { main: ... } or { customPort: ... })
    if (typeof target === "object" && target !== null) {
      const ports = {};
      for (const [portType, portConns] of Object.entries(target)) {
        if (!Array.isArray(portConns)) {
          if (typeof portConns === "object" && portConns !== null) {
            ports[portType] = [[{
              node: portConns.node,
              type: portConns.type || "main",
              index: portConns.index !== undefined ? portConns.index : 0,
            }]];
          }
          continue;
        }

        if (portConns.length === 0) {
          ports[portType] = [[]];
          continue;
        }

        // Subcase 3.1: portConns is a single-nested array of objects
        if (!Array.isArray(portConns[0])) {
          ports[portType] = [
            portConns.map((conn) => {
              if (typeof conn === "string") return { node: conn, type: "main", index: 0 };
              return {
                node: conn.node,
                type: conn.type || "main",
                index: conn.index !== undefined ? conn.index : 0,
              };
            }),
          ];
        }
        // Subcase 3.2: portConns is a double-nested array of objects/strings
        else {
          ports[portType] = portConns.map((innerArray) =>
            innerArray.map((conn) => {
              if (typeof conn === "string") return { node: conn, type: "main", index: 0 };
              return {
                node: conn.node,
                type: conn.type || "main",
                index: conn.index !== undefined ? conn.index : 0,
              };
            })
          );
        }
      }
      normalized[sourceNode] = ports;
    }
  }

  return normalized;
};

const n8nClient = {
  async listWorkflows() {
    const res = await client.get("/workflows");
    return res.data;
  },

  async createWorkflow(workflowJson) {
    const crypto = require("crypto");

    // Validate workflow before deployment
    try {
      validateWorkflow(workflowJson);
    } catch (valErr) {
      throw new Error(`Validation failed: ${valErr.message}`);
    }

    // Known-bad parameter keys that cause "Could not find property option" in n8n
    const BANNED_PARAM_KEYS = new Set([
      "select",        // old slack field (replaced by resource/operation)
      "channelId",     // old slack field (replaced by channel.__rl)
      "messageType",   // old slack field
      "toEmail",       // old gmail field (replaced by sendTo)
      "sendHeaders",   // old httpRequest field
      "headerParameters", // old httpRequest field
      "fields",        // old set node v3 field (replaced by assignments)
    ]);

    const sanitizeParams = (params) => {
      if (!params || typeof params !== "object" || Array.isArray(params)) return params;
      const cleaned = {};
      for (const [k, v] of Object.entries(params)) {
        if (!BANNED_PARAM_KEYS.has(k)) {
          cleaned[k] = typeof v === "object" && v !== null ? sanitizeParams(v) : v;
        } else {
          console.warn(`[n8n sanitize] Stripped banned parameter key: "${k}"`);
        }
      }
      return cleaned;
    };

    const nodes = (workflowJson.nodes || []).map((node) => {
      const mapped = {
        id: node.id || crypto.randomUUID(),
        name: node.name,
        type: node.type,
        typeVersion: node.typeVersion || 1,
        position: node.position || [250, 300],
        parameters: sanitizeParams(node.parameters || {}),
        credentials: node.credentials || {},
      };
      if (node.meta) mapped.meta = node.meta;
      return mapped;
    });

    const normalizedConnections = normalizeConnections(workflowJson.connections);

    const payload = {
      name: workflowJson.name || "Untitled Workflow",
      nodes: nodes,
      connections: normalizedConnections,
      settings: workflowJson.settings || { executionOrder: "v1" },
    };

    // Forward optional properties if present
    if (workflowJson.pinData) payload.pinData = workflowJson.pinData;
    if (workflowJson.meta) payload.meta = workflowJson.meta;

    console.log("Sending to n8n — node count:", payload.nodes.length);
    console.log("Full payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await client.post("/workflows", payload);
      return res.data;
    } catch (err) {
      console.error("n8n API error status:", err.response?.status);
      console.error("n8n API error body:", JSON.stringify(err.response?.data, null, 2));
      console.error("n8n API error message:", err.message);
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  async activateWorkflow(id, active = true) {
    const action = active ? "activate" : "deactivate";
    const res = await client.post(`/workflows/${id}/${action}`);
    return res.data;
  },

  async deleteWorkflow(id) {
    const res = await client.delete(`/workflows/${id}`);
    return res.data;
  },

  async getExecutions(workflowId) {
    const res = await client.get(`/executions?workflowId=${workflowId}&limit=10`);
    return res.data;
  },

  async listCredentials() {
    const res = await client.get("/credentials");
    return res.data;
  },

  async createCredential(name, type, data) {
    try {
      const res = await client.post("/credentials", { name, type, data });
      return res.data;
    } catch (err) {
      console.error("n8n createCredential API error status:", err.response?.status);
      console.error("n8n createCredential API error body:", JSON.stringify(err.response?.data, null, 2));
      throw new Error(err.response?.data?.message || err.message);
    }
  },

  async deleteCredential(id) {
    const res = await client.delete(`/credentials/${id}`);
    return res.data;
  },
};

module.exports = n8nClient;