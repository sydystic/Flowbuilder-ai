# FlowBuilder AI

> Convert plain English into deployed n8n workflows — no drag-and-drop, no manual node wiring.

FlowBuilder AI is an AI-powered workflow automation platform that transforms natural language into production-ready n8n workflows. It guides users through a conversational workflow-building experience, generates valid n8n JSON, validates it, and deploys it directly to an n8n instance.

---

## 🎥 Demo

[https://github.com/user-attachments/assets/your-demo-video](https://github.com/user-attachments/assets/04273a54-d617-4a04-98a6-6c940bccc524)

---

## ✨ Features

### 🤖 AI Workflow Generation

- Natural language → n8n workflow
- Google Gemini 1.5 Flash
- Groq fallback (`llama-3.3-70b-versatile`)
- Conversational clarification
- Live workflow specification

### ⚡ Workflow Management

- One-click deployment to n8n
- Edit & Redeploy
- Duplicate workflows
- Export workflow JSON
- View execution history
- Retry failed deployments

### 🔐 Security

- Email & Google Authentication
- AES-256-GCM encrypted credentials
- Automatic credential sync with n8n
- Rate limiting
- Input validation
- Secure JWT authentication

### 📊 Dashboard

- Workflow analytics
- Execution monitoring
- Session history
- Conversation persistence
- Recent workflows

---

## 🏗 Architecture

```
User Prompt
      │
      ▼
AI Clarification
      │
      ▼
Workflow Specification
      │
      ▼
Gemini / Groq
      │
      ▼
n8n Workflow JSON
      │
      ▼
Validation
      │
      ▼
n8n REST API
      │
      ▼
Live Workflow
```

---

## 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | Supabase (Postgres) |
| AI | Gemini 1.5 Flash + Groq |
| Automation | n8n |
| Auth | Supabase Auth |
| Security | AES-256-GCM |
| Infrastructure | Docker, Docker Compose |

---

# 🚀 Quick Start

## Prerequisites

Install:

- Node.js 20+
- Docker Desktop
- Docker Compose

You'll also need:

- Gemini API key or Groq API key
- n8n API Key
- Gmail OAuth (or another supported credential)
- Supabase project (optional in Demo Mode)

---

## Clone

```bash
git clone https://github.com/sydystic/Flowbuilder-ai.git
cd Flowbuilder-ai
```

---

## Configure Environment

```bash
cp .env.example .env
```

Example

```env
GEMINI_API_KEY=

GROQ_API_KEY=

N8N_API_KEY=

ENCRYPTION_KEY=

DEMO_MODE=true
```

---

## Start Docker

```bash
docker compose up --build
```

This starts:

- n8n
- PostgreSQL
- Backend
- Frontend

---

# Local Development

### Backend

```bash
cd server
npm install
node index.js
```

Backend:

```
http://localhost:3001
```

---

### Frontend

Open another terminal.

```bash
cd client
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GEMINI_API_KEY | Optional | Gemini AI |
| GROQ_API_KEY | Optional | Groq fallback |
| N8N_API_KEY | Yes | n8n deployment |
| ENCRYPTION_KEY | Yes | Credential encryption |
| SUPABASE_URL | Optional | Supabase |
| SUPABASE_ANON_KEY | Optional | Auth |

---


## Project Structure

```text
client/
server/
docker-compose.yml
README.md
```

---

## Roadmap

- [ ] Workflow Templates
- [ ] Visual Workflow Editor
- [ ] Workflow Version History
- [ ] Multi-user collaboration
- [ ] OpenAI / Claude providers
- [ ] Railway deployment

---

## Contributing

```bash
git checkout -b feature/my-feature

git commit -m "feat: new feature"

git push origin feature/my-feature
```

Open a Pull Request.

---

## License

MIT

---

## Author

**Siddhi Kurne**

GitHub:
https://github.com/sydystic

LinkedIn:
https://www.linkedin.com/in/siddhikurne/
