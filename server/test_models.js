const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const models = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "qwen/qwen3-coder:free",
  "google/gemma-4-31b-it:free",
  "deepseek/deepseek-v4-flash:free",
  "openai/gpt-oss-20b:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "nvidia/nemotron-3-nano-30b-a3b:free"
];

const SYSTEM_PROMPT = `You are an n8n workflow generator. When given a description of an automation, you must return ONLY valid n8n workflow JSON and nothing else. No explanation, no markdown, no code blocks. Just raw JSON.
The JSON must follow this exact structure:
{
  "name": "Daily Slack Message",
  "nodes": [],
  "connections": {},
  "settings": {}
}`;

async function testModel(model) {
  console.log(`Testing model: ${model}...`);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "n8n AI Builder Test",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Generate an n8n workflow for: Send a Slack message daily at 9am. Return ONLY raw JSON.` }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(`❌ Model ${model} failed with HTTP status ${response.status}:`, JSON.stringify(data));
      return false;
    }
    
    console.log(`✅ Model ${model} returned success!`);
    console.log("Raw response content:", JSON.stringify(data.choices?.[0]?.message?.content));
    return true;
  } catch (err) {
    console.log(`❌ Model ${model} failed with error:`, err.message);
    return false;
  }
}

async function run() {
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      console.log(`\nFound working model: ${model}\n`);
      break;
    }
    // Sleep a bit between attempts to avoid hitting overall router limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

run();
