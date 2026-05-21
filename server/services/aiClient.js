const Groq = require("groq-sdk");
require("dotenv").config({ path: "../.env" });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an n8n workflow generator. When given a description of an automation, you must return ONLY valid n8n workflow JSON and nothing else. No explanation, no markdown, no code blocks. Just raw JSON.

The JSON must follow this exact structure:
{
  "name": "workflow name here",
  "nodes": [...],
  "connections": {},
  "settings": {}
}

Each node must have these fields:
- id (string)
- name (string)
- type (string - must be a real n8n node type)
- typeVersion (number)
- position (array of 2 numbers like [250, 300])
- parameters (object)

Common node types you can use:
- n8n-nodes-base.scheduleTrigger (for cron/scheduled tasks)
- n8n-nodes-base.manualTrigger (for manual runs)
- n8n-nodes-base.webhook (for webhook triggers)
- n8n-nodes-base.httpRequest (for HTTP/API calls)
- n8n-nodes-base.slack (for Slack messages)
- n8n-nodes-base.gmail (for emails)
- n8n-nodes-base.telegram (for Telegram messages)
- n8n-nodes-base.if (for conditions)
- n8n-nodes-base.set (for setting variables)
- n8n-nodes-base.code (for running JavaScript)

Here is a real example of a valid workflow that sends a Slack message every day at 9am:
{
  "name": "Daily Slack Message",
  "nodes": [
    {
      "id": "1",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 24 }]
        }
      }
    },
    {
      "id": "2",
      "name": "Send Slack Message",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [500, 300],
      "parameters": {
        "channel": "#general",
        "text": "Good morning team!"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Send Slack Message", "type": "main", "index": 0 }]]
    }
  },
  "settings": {}
}

Always connect nodes properly in the connections object. The key is the source node name, and it points to the destination node.`;

const aiClient = {
  async generateWorkflow(userPrompt) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Generate an n8n workflow for this: ${userPrompt}` }
          ],
          temperature: 0.3,
        });

        const text = completion.choices[0].message.content.trim();

        // Strip markdown code blocks if model adds them
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // Validate it's real JSON
        const parsed = JSON.parse(cleaned);

        // Basic structure check
        if (!parsed.name || !parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error("Invalid workflow structure");
        }

        return { success: true, workflow: parsed };
      } catch (err) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, err.message);
        if (attempts === maxAttempts) {
          return { success: false, error: err.message };
        }
      }
    }
  },
};

module.exports = aiClient;