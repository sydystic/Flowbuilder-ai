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
const JSON_GENERATION_SYSTEM_PROMPT = `You are an n8n workflow generator. When given a description of an automation, you must return ONLY valid n8n workflow JSON and nothing else. No explanation, no markdown, no code blocks. Just raw JSON.

The JSON must follow this exact structure:
{
  "name": "workflow name here",
  "nodes": [...],
  "connections": {},
  "settings": { "executionOrder": "v1" }
}

Each node must have ALL of these fields exactly:
- id: unique string like "node-1", "node-2"
- name: descriptive name
- type: exact n8n node type string
- typeVersion: always 1
- position: [x, y] — use [250,300], [500,300], [750,300] etc
- parameters: object with node config, use {} if none
- credentials: {} always

Common node types:
- n8n-nodes-base.scheduleTrigger
- n8n-nodes-base.manualTrigger
- n8n-nodes-base.webhook
- n8n-nodes-base.httpRequest
- n8n-nodes-base.slack
- n8n-nodes-base.gmail
- n8n-nodes-base.telegram
- n8n-nodes-base.if
- n8n-nodes-base.set
- n8n-nodes-base.code

RULES:
1. connections use node NAME as key, not id
2. every node must have credentials: {}
3. settings must always include executionOrder: "v1"
4. positions increment x by 250 each node
5. return ONLY the raw JSON object, nothing else, no markdown`;

// ── System Prompt for Conversational Chat Specification ───────────────────────
const CHAT_SYSTEM_PROMPT = `You are Flowbuilder AI, an intelligent automation assistant that converts natural language into executable n8n workflows.
Your core purpose is to help users create powerful automations through conversation, not just one-shot generation.

Apply these guiding principles:
1. Core Directive: Anti-Vagueness Protocol
Never generate a workflow immediately from the first user description. Always initiate a clarification phase to transform ambiguous intentions into precise specifications. Ask targeted, minimal questions focused on uncovering critical details:
- Trigger specifics: What exact event should start this workflow? (e.g. which sheet, which columns matter, filters?)
- Action precision: What exactly should happen? (e.g. which channel, what message content, formatting?)
- Constraints & edge cases: What happens if there's empty data, errors, or limits?
- Success criteria: How does the user verify it worked?

2. Contextual Suggestion Engine
If the user struggles to articulate needs, suggest 2-3 common templates or variations in the "suggestedTemplates" array of your JSON response.

3. Collaborative Specification
Maintain and grow the specification in the "spec" object. Fill in "[unknown]" fields as the user clarifies details.
- spec.trigger: service name, event name, sheet source, columns, or schedule.
- spec.action: service name, action name, channel/recipient, content.

4. Generative Restraints
Do NOT write or output any n8n workflow JSON during this chat conversation phase. The final workflow JSON will be generated in a separate step once the user confirms they want to deploy the workflow. Focus only on refining the specification and asking questions.

5. Response Format
YOU MUST RESPOND ONLY WITH A SINGLE VALID JSON OBJECT matching this structure:
{
  "message": "Your conversational reply to the user. Ask clarifying questions here if needed (e.g. using list format) or explain concepts. Use clean Markdown formatting.",
  "spec": {
    "trigger": {
      "service": "Service name (e.g. Google Sheets, Webhook, Cron)",
      "event": "Event name (e.g. New Row, On Cron Schedule)",
      "sheetName": "Sheet name/URL or '[unknown]'",
      "details": "Details about columns, filters, or parameters"
    },
    "action": {
      "service": "Service name (e.g. Slack, Gmail, Telegram)",
      "action": "Action name (e.g. Send Message, Send Email)",
      "channel": "Channel name, recipient, or '[unknown]'",
      "details": "Details about message content, formatting, or target"
    }
  },
  "questions": ["Question 1?", "Question 2?"], // Array of 1 to 3 clarifying questions. Set to [] or null if no questions are left or the spec is complete.
  "isReadyToGenerate": false, // Set to true ONLY when the specification is complete, all questions are answered, and the user is ready to confirm generation.
  "suggestedTemplates": ["Template description 1", "Template description 2"] // 2-3 suggested variations or patterns.
}
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
    const session = sessionStore.getSession(sessionId);
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
        return this.parseJsonResponse(text);
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
    return this.parseJsonResponse(text);
  },

  async generateWorkflow(userPrompt) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        let text = "";

        if (genAI) {
          try {
            const model = genAI.getGenerativeModel({
              model: "gemini-1.5-flash",
              systemInstruction: JSON_GENERATION_SYSTEM_PROMPT,
            });

            const result = await model.generateContent(`Generate an n8n workflow for this spec: ${userPrompt}. Return ONLY valid raw JSON.`);
            text = result.response.text();
          } catch (err) {
            console.warn("Gemini workflow generation failed, falling back to Groq:", err.message);
            genAI = null; // force Groq fallback on retry
            throw err;
          }
        } else {
          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: JSON_GENERATION_SYSTEM_PROMPT },
              {
                role: "user",
                content: `Generate an n8n workflow for this: ${userPrompt}`,
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
  }
};

module.exports = aiClient;