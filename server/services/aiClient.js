const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const sessionStore = require("./sessionStore");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

// Initialize clients
let genAI = null;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (geminiKey) {
  console.log("Gemini AI integration active.");
  genAI = new GoogleGenerativeAI(geminiKey);
} else {
  console.log("No Gemini API key found. Flowbuilder AI will use Groq SDK fallback.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── System Prompt for Workflow JSON Generation ─────────────────────────────────
const JSON_GENERATION_SYSTEM_PROMPT = `You are an n8n workflow generator. Return ONLY valid n8n workflow JSON. No explanation, no markdown, no code blocks. Raw JSON only.

TOP-LEVEL STRUCTURE (required):
{
  "name": "Workflow Name",
  "nodes": [ ...node objects... ],
  "connections": {
    "Source Node Name": {
      "main": [ [ { "node": "Target Node Name", "type": "main", "index": 0 } ] ]
    }
  },
  "settings": { "executionOrder": "v1" }
}

EVERY NODE must have:
{
  "id": "node-1",
  "name": "Descriptive Name",
  "type": "n8n-nodes-base.NODETYPE",
  "typeVersion": NUMBER,
  "position": [250, 300],
  "parameters": { ... },
  "credentials": {}
}
Position: start at [250,300], increment x by 250 per node.

VERIFIED NODE SCHEMAS — use parameters exactly as shown, do not invent fields:

1. SCHEDULE TRIGGER — "n8n-nodes-base.scheduleTrigger" typeVersion: 1.2
   Every hour: "parameters": { "rule": { "interval": [{ "field": "hours", "hoursInterval": 1 }] } }
   Daily at 9am: "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "0 9 * * *" }] } }
   Every N minutes: "parameters": { "rule": { "interval": [{ "field": "minutes", "minutesInterval": 30 }] } }

2. WEBHOOK — "n8n-nodes-base.webhook" typeVersion: 2
   "parameters": { "path": "my-webhook", "httpMethod": "POST", "responseMode": "onReceived", "options": {} }

3. HTTP REQUEST — "n8n-nodes-base.httpRequest" typeVersion: 4.2
   "parameters": { "method": "GET", "url": "https://api.example.com/endpoint", "authentication": "none", "options": {} }

4. SET (Edit Fields) — "n8n-nodes-base.set" typeVersion: 3.4
   "parameters": {
     "mode": "manual",
     "assignments": {
       "assignments": [
         { "id": "field-1", "name": "myField", "value": "={{ $json.someField }}", "type": "string" }
       ]
     },
     "options": {}
   }

5. CODE — "n8n-nodes-base.code" typeVersion: 2
   "parameters": { "jsCode": "return items;" }

6. IF — "n8n-nodes-base.if" typeVersion: 2
   "parameters": {
     "conditions": {
       "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict" },
       "conditions": [
         { "id": "cond-1", "leftValue": "={{ $json.status }}", "rightValue": "active", "operator": { "type": "string", "operation": "equals" } }
       ],
       "combinator": "and"
     }
   }

7. SLACK — "n8n-nodes-base.slack" typeVersion: 2.2
   "parameters": {
     "resource": "message",
     "operation": "post",
     "channel": { "__rl": true, "value": "#general", "mode": "name" },
     "text": "Your message here"
   }

8. GMAIL — "n8n-nodes-base.gmail" typeVersion: 2.1
   "parameters": { "sendTo": "recipient@example.com", "subject": "Email Subject", "emailType": "text", "message": "Email body here" }

9. GOOGLE SHEETS TRIGGER — "n8n-nodes-base.googleSheetsTrigger" typeVersion: 1
   "parameters": {
     "documentId": { "__rl": true, "value": "YOUR_SHEET_ID", "mode": "id" },
     "sheetName": { "__rl": true, "value": "gid=0", "mode": "id" },
     "event": "rowAdded",
     "options": {}
   }

10. GOOGLE SHEETS READ — "n8n-nodes-base.googleSheets" typeVersion: 4.5
    "parameters": {
      "resource": "sheet",
      "operation": "read",
      "documentId": { "__rl": true, "value": "YOUR_SHEET_ID", "mode": "id" },
      "sheetName": { "__rl": true, "value": "gid=0", "mode": "id" },
      "filtersUI": {},
      "options": {}
    }

11. GOOGLE SHEETS APPEND — "n8n-nodes-base.googleSheets" typeVersion: 4.5
    "parameters": {
      "resource": "sheet",
      "operation": "appendOrUpdate",
      "documentId": { "__rl": true, "value": "YOUR_SHEET_ID", "mode": "id" },
      "sheetName": { "__rl": true, "value": "gid=0", "mode": "id" },
      "columns": { "mappingMode": "autoMapInputData", "matchingColumns": [] },
      "options": {}
    }

12. TELEGRAM — "n8n-nodes-base.telegram" typeVersion: 1.2
    "parameters": { "resource": "message", "operation": "sendMessage", "chatId": "YOUR_CHAT_ID", "text": "Your message here", "additionalFields": {} }

13. DISCORD — "n8n-nodes-base.discord" typeVersion: 2
    "parameters": { "resource": "message", "operation": "send", "webhookId": { "__rl": true, "value": "WEBHOOK_ID", "mode": "id" }, "content": "Your message here" }

CRITICAL RULES:
1. connections keys = node NAME (not id). Structure MUST be: { "NodeName": { "main": [[{ "node": "NextNodeName", "type": "main", "index": 0 }]] } }
2. Every node must have "credentials": {}
3. DO NOT invent parameter names not shown above. Only use exact parameter names from the schemas.
4. Use typeVersion numbers exactly as shown (3.4 for set, 2.2 for slack, 2.1 for gmail, 4.2 for httpRequest, 1.2 for scheduleTrigger).
5. Return ONLY the raw JSON object. No markdown, no explanation, no code fences.`;

// ── System Prompt for Conversational Chat Specification ───────────────────────
const CHAT_SYSTEM_PROMPT = `You are Flowbuilder AI, an expert n8n automation builder. Your job is to understand what the user wants to automate and move them toward a deployed workflow as fast as possible.

## Guiding Principles

**Action-First**: If the user's intent is clear enough to build a sensible workflow, do NOT ask questions — set isReadyToGenerate to true immediately and fill in reasonable defaults for any missing detail. Only ask questions when critical information is genuinely missing AND a wrong assumption would make the workflow useless (e.g. you don't know the trigger service at all).

**One Question Max Per Turn**: Never ask more than one clarifying question at a time. Pick the single most important unknown. If you know the trigger and action, you have enough — generate.

**Reasonable Defaults**: Fill in smart defaults rather than asking. If the user says "notify me on Slack when a Google Sheet row is added", assume: monitor all sheets unless told otherwise, send to #general or DM them, include all columns in the message. State the assumption in your reply, don't ask permission.

**Spec Completeness Threshold**: A spec is ready to generate when you know:
- What triggers the workflow (service + event type)
- What action to take (service + operation)
Everything else can be a smart default.

## When to Ask vs. When to Generate
- "send me a Slack message every morning" → GENERATE immediately (trigger: schedule 9am, action: Slack DM)
- "automate my workflow" → Ask ONE question: "What would you like to automate? For example: get a Slack alert when a new row is added to a Google Sheet."
- "notify me when a form is submitted" → GENERATE with webhook trigger + email/Slack notification, state assumptions

## Spec Updates
Maintain the spec object as you learn details. Fill in [unknown] fields as you learn them. Once both trigger and action are known, set isReadyToGenerate: true.

## Response Format
YOU MUST RESPOND ONLY WITH A SINGLE VALID JSON OBJECT:
{
  "message": "Your conversational reply. If generating, confirm what you're building and any assumptions. Use clean Markdown: **bold**, *italic*, \`code\`, bullet lists with -.",
  "spec": {
    "trigger": {
      "service": "Service name or '[unknown]'",
      "event": "Event name or '[unknown]'",
      "sheetName": "Sheet/source or '[unknown]'",
      "details": "Relevant filter/cron/parameter details"
    },
    "action": {
      "service": "Service name or '[unknown]'",
      "action": "Action name or '[unknown]'",
      "channel": "Channel/recipient or '[unknown]'",
      "details": "Message content, format, target details"
    }
  },
  "questions": [],
  "isReadyToGenerate": false,
  "suggestedTemplates": []
}

Set isReadyToGenerate: true as soon as both trigger service and action service are known. Do not wait for the user to confirm — just announce what you're building and set the flag.
`;

const aiClient = {
  // Utility to parse JSON robustly from AI outputs
  parseJsonResponse(text) {
    try {
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("Direct JSON parsing failed, attempting regex extraction:", err.message);
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch (err2) {
        console.error("JSON regex extraction failed:", err2.message);
      }

      // Safety fallback response
      return {
        message: text,
        spec: {
          trigger: { service: "[unknown]", event: "[unknown]", sheetName: "[unknown]", details: "Error parsing specification" },
          action: { service: "[unknown]", action: "[unknown]", channel: "[unknown]", details: "" }
        },
        questions: [],
        isReadyToGenerate: false,
        suggestedTemplates: []
      };
    }
  },

  async chatConversation(sessionId, userMessage) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messages = session.messages || [];

    // Map messages history to AI client format
    if (genAI) {
      // Use Gemini AI
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: CHAT_SYSTEM_PROMPT,
        });

        const chatHistory = [];
        // Map history to model parts
        for (const msg of messages) {
          if (msg.sender === "user") {
            chatHistory.push({ role: "user", parts: [{ text: msg.text }] });
          } else {
            // Ensure we only pass the message text to model history
            chatHistory.push({ role: "model", parts: [{ text: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text) }] });
          }
        }

        // Remove the last message from history as it's the one we are sending
        if (chatHistory.length > 0 && messages[messages.length - 1].sender === "user") {
          chatHistory.pop();
        }

        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const result = await chat.sendMessage(userMessage);
        const text = result.response.text();
        const parsed = this.parseJsonResponse(text);
        parsed.modelName = "gemini-1.5-flash";
        parsed.tokensUsed = result.response.usageMetadata?.totalTokenCount || null;
        return parsed;
      } catch (err) {
        console.warn("Gemini chat completion failed, falling back to Groq:", err.message);
      }
    }

    // Use Groq fallback
    const chatHistory = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        ...chatHistory
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content.trim();
    const parsed = this.parseJsonResponse(text);
    parsed.modelName = "llama-3.3-70b-versatile";
    parsed.tokensUsed = completion.usage?.total_tokens || null;
    return parsed;
  },

  async generateWorkflow(userPrompt, credentialsMap = {}) {
    let attempts = 0;
    const maxAttempts = 3;
    let useGemini = !!genAI;

    while (attempts < maxAttempts) {
      try {
        let text = "";

        if (useGemini) {
          try {
            const model = genAI.getGenerativeModel({
              model: "gemini-1.5-flash",
              systemInstruction: JSON_GENERATION_SYSTEM_PROMPT,
            });

            const credentialsInfo = credentialsMap && Object.keys(credentialsMap).length > 0
              ? `\n\nAvailable credentials already configured in n8n (use these exact IDs in the credentials field of nodes that need them):
${JSON.stringify(credentialsMap, null, 2)}

For each node that requires authentication, populate its credentials field like:
"credentials": { "slackApi": { "id": "ACTUAL_ID", "name": "ACTUAL_NAME" } }`
              : "";

            const result = await model.generateContent(`Generate an n8n workflow for this spec: ${userPrompt}. Return ONLY valid raw JSON.${credentialsInfo}`);
            text = result.response.text();
          } catch (err) {
            console.warn("Gemini workflow generation failed, falling back to Groq:", err.message);
            useGemini = false; // force Groq fallback on retry for this request
            throw err;
          }
        } else {
          const credentialsInfo = credentialsMap && Object.keys(credentialsMap).length > 0
            ? `\n\nAvailable credentials already configured in n8n (use these exact IDs in the credentials field of nodes that need them):
${JSON.stringify(credentialsMap, null, 2)}

For each node that requires authentication, populate its credentials field like:
"credentials": { "slackApi": { "id": "ACTUAL_ID", "name": "ACTUAL_NAME" } }`
            : "";

          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: JSON_GENERATION_SYSTEM_PROMPT },
              {
                role: "user",
                content: `Generate an n8n workflow for this: ${userPrompt}${credentialsInfo}`,
              },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          });
          text = completion.choices[0].message.content.trim();
        }

        // Clean & parse JSON
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleaned);

        if (!parsed.name || !parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error("Invalid workflow structure — missing name or nodes");
        }

        if (parsed.nodes.length === 0) {
          throw new Error("Workflow has zero nodes");
        }

        console.log(`Generated ${parsed.nodes.length} nodes for: ${parsed.name}`);
        return { success: true, workflow: parsed };

      } catch (err) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, err.message);
        if (attempts === maxAttempts) {
          return { success: false, error: err.message };
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  },

  async clarifyPrompt(prompt) {
    // Thin wrapper for backwards compatibility
    const systemPrompt = `Analyze the prompt and decide if you need more information. 
    Return: {"needsClarification": true, "questions": ["q1", "q2"]} OR {"needsClarification": false, "reason": "clear"}`;

    try {
      let text = "";
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
      } else {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        });
        text = completion.choices[0].message.content;
      }
      return this.parseJsonResponse(text);
    } catch (err) {
      return { needsClarification: false };
    }
  },

  async generateWorkflowSpec(prompt) {
    const systemInstruction = `Analyze the prompt and generate a workflow spec.
    Return ONLY a JSON object:
    {
      "name": "descriptive name",
      "description": "short description",
      "trigger": { "service": "Trigger Service", "event": "Trigger Event", "details": "Trigger Details" },
      "action": { "service": "Action Service", "action": "Action Name", "details": "Action Details" }
    }`;

    try {
      let text = "";
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemInstruction,
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
      } else {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        });
        text = completion.choices[0].message.content;
      }
      return this.parseJsonResponse(text);
    } catch (err) {
      console.warn("Failed to generate workflow spec via AI:", err.message);
      // Fallback spec
      return {
        name: "Generated Workflow",
        description: prompt,
        trigger: { service: "Trigger", event: "Event", details: "Active" },
        action: { service: "Action", action: "Execute", details: "Complete" }
      };
    }
  }
};

module.exports = aiClient;