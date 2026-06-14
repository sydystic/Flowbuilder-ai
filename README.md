# FlowBuilder AI

**Convert plain English into deployed n8n workflows — no drag-and-drop, no manual node wiring.**

FlowBuilder AI is a full-stack automation platform powered by Google Gemini (with Groq fallback). Describe an automation in plain English. The AI clarifies the details, builds a live workflow spec, generates valid n8n JSON, and deploys it directly to your n8n instance via REST API.

## How It Works

```
User describes automation in chat
         ↓
AI asks targeted clarifying questions
(trigger service, action service, channel, conditions)
         ↓
Structured spec built live in the Inspector panel
         ↓
"Generate & Deploy" → Gemini generates n8n workflow JSON
         ↓
Workflow validated → pushed to n8n via REST API
         ↓
Workflow is live and executable ✅
```

The interesting design decision: rather than one-shot generating from vague input, FlowBuilder runs a **conversational clarification phase** that extracts a structured trigger/action spec before ever touching the n8n API. This avoids generating broken workflows from ambiguous prompts.

---

## Features

- 🧠 **Natural Language → n8n Workflow** — powered by Google Gemini 1.5 Flash
- 🔄 **Groq Fallback** — switches to `llama-3.3-70b-versatile` if Gemini is unavailable
- ⚡ **One-click Deploy** — pushes workflow JSON directly to n8n via REST API
- 📋 **Live Workflow Spec** — Inspector panel updates in real-time as you chat
- 💬 **Session History** — resumable conversations with full message persistence
- 🔐 **Encrypted Credential Storage** — AES-256-GCM, synced to n8n automatically
- 📊 **Workflow Dashboard** — view, activate/deactivate, and retry failed deployments
- 🏃 **Execution History** — incremental sync of n8n run history to the dashboard
- 🐳 **Docker-ready** — spin up the full stack (postgres + n8n + backend + frontend) with one command
- 🎭 **Demo Mode** — run fully locally without Supabase credentials

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 |
| AI | Google Gemini 1.5 Flash + Groq llama-3.3-70b fallback |
| Database | Supabase (Postgres) + local JSON session store |
| Credentials | AES-256-GCM encrypted, auto-synced to n8n |
| Automation | n8n (self-hosted via Docker) |
| Infrastructure | Docker, Docker Compose, nginx |

---

## Getting Started

### Prerequisites

- Node.js v20+
- Docker & Docker Compose
- Google Gemini API key **or** Groq API key (free tier works)
- n8n instance (Docker setup included)

### 1. Clone

```bash
git clone https://github.com/sydystic/Flowbuilder-ai.git
cd Flowbuilder-ai
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`. Minimum required for local development:

```env
GEMINI_API_KEY=your_gemini_key    # or leave blank to use Groq
GROQ_API_KEY=your_groq_key        # free at console.groq.com
N8N_API_KEY=your_n8n_api_key      # generated in n8n settings
ENCRYPTION_KEY=exactly32charstring # exactly 32 characters
DEMO_MODE=true                     # skips Supabase auth locally
```

> **Demo Mode** (`DEMO_MODE=true`) lets you run the full app without setting up Supabase. All session data is stored in local JSON files. Set to `false` and add Supabase credentials for persistent multi-user storage.

### 3. Start with Docker (recommended)

```bash
docker-compose up --build
```

This starts:
- **postgres** on internal network (n8n database)
- **n8n** on `http://localhost:5678`
- **backend** (Express API) on `http://localhost:3001`
- **frontend** (React) on `http://localhost:3000`

First run: log into n8n at `http://localhost:5678` with `N8N_USER` / `N8N_PASSWORD` from your `.env`, then generate an API key under **Settings → API** and add it to `.env` as `N8N_API_KEY`.

### 4. Manual setup (without Docker)

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Start backend
node server/index.js

# Start frontend (separate terminal)
cd client && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

---

## Project Structure

```
Flowbuilder-ai/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── screens/               # ChatScreen, Dashboard, Credentials, WorkflowDetail
│   │   ├── components/            # WorkflowBuilder, Sidebar, Header, Modals
│   │   │   ├── conversation/      # ConversationHistory, InputArea, ConversationHeader
│   │   │   ├── spec/              # WorkflowSpecPanel (live inspector)
│   │   │   ├── assistance/        # SuggestionCarousel
│   │   │   └── auth/              # CredentialBanner
│   │   └── App.jsx
│   └── Dockerfile.frontend
├── server/
│   ├── routes/
│   │   ├── chat.js                # Session + message endpoints
│   │   ├── workflow.js            # Generate, deploy, manage workflows
│   │   └── credentials.js        # Credential CRUD (n8n + Supabase)
│   ├── services/
│   │   ├── aiClient.js            # Gemini + Groq AI integration
│   │   ├── n8nClient.js           # n8n REST API client
│   │   ├── sessionStore.js        # JSON-based session persistence
│   │   ├── workflowService.js     # Supabase workflow CRUD
│   │   ├── credentialEncryptionService.js  # AES-256-GCM
│   │   └── supabaseClient.js
│   ├── middlewares/
│   │   └── auth.js                # JWT auth + demo mode bypass
│   └── data/                      # Local JSON session + history store
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── .env.example
└── README.md
```

---

## Credential Management

Credentials added in the FlowBuilder UI are:

1. **Created in n8n** via the n8n REST API (so workflows can use them immediately)
2. **Encrypted** using AES-256-GCM with your `ENCRYPTION_KEY`
3. **Stored in Supabase** (or skipped in demo mode)

This means you never need to manually configure credentials inside n8n — add them once in FlowBuilder and they're available to all generated workflows.

---

## Roadmap

- [ ] Fix clarifying question loop — auto-proceed when spec is complete
- [ ] Workflow template library (common patterns pre-built)
- [ ] Support more credential types (Notion, Airtable, Postgres)
- [ ] Workflow versioning and diff view
- [ ] One-click deploy to Railway / Render
- [ ] OpenAI / Claude as additional AI providers
- [ ] Supabase Auth UI (login/signup in the frontend)

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
git commit -m 'Add your feature'
git push origin feature/your-feature
# Open a Pull Request
```

---

## Author

**Sid** — [@sydystic](https://github.com/sydystic)

---

## License

MIT
