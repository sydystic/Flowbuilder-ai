# 🔁 Flowbuilder AI

> **Describe your automation in plain English. Get a working n8n workflow instantly.**

Flowbuilder AI is a full-stack automation platform that converts natural language into executable [n8n](https://n8n.io) workflow JSON — and deploys it directly to your n8n instance via REST API. No drag-and-drop. No manual node wiring. Just describe what you want.

---

## ✨ Demo

> _"Send a Slack message every time a new row is added to my Google Sheet"_  
> → Flowbuilder AI generates, validates, and deploys the workflow in seconds.

<!-- Add a GIF here: record your screen with Loom or ScreenToGif and drop it in /assets/demo.gif -->
<!-- ![Demo](./assets/demo.gif) -->

---

## 🚀 Features

- 🧠 **Natural Language → n8n Workflow** — powered by Google Gemini AI
- ⚡ **One-click Deploy** — pushes workflow JSON directly to n8n via REST API
- ✅ **Validation Layer** — checks workflow structure before deploying
- 📋 **Workflow Dashboard** — view, manage, and re-deploy past workflows
- 🐳 **Docker-ready** — spin up the full stack with a single command
- 🔐 **Secure config** — API keys managed via environment variables

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, HTML/CSS |
| Backend | Node.js, Express |
| AI | Google Gemini API |
| Automation | n8n (self-hosted) |
| Infrastructure | Docker, Docker Compose |

---

## 📦 Getting Started

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- Google Gemini API key
- n8n instance (local or cloud)

### 1. Clone the repo

```bash
git clone https://github.com/sydystic/Flowbuilder-ai.git
cd Flowbuilder-ai
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
GEMINI_API_KEY=your_google_gemini_api_key
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
PORT=3001
```

### 3. Start with Docker

```bash
docker-compose up --build
```

This starts:
- **n8n** on `http://localhost:5678`
- **Express API** on `http://localhost:3001`
- **React frontend** on `http://localhost:3000`

### 4. Manual setup (without Docker)

```bash
# Install dependencies
npm install

# Start backend
cd server && node index.js

# Start frontend
cd client && npm start
```

---

## 🧪 How It Works

```
User Input (natural language)
        ↓
  Gemini AI generates workflow JSON
        ↓
  Validation layer checks structure
        ↓
  REST API deploys to n8n instance
        ↓
  Workflow is live and executable ✅
```

---

## 📁 Project Structure

```
Flowbuilder-ai/
├── client/              # React frontend
├── server/              # Express backend + Gemini integration
│   ├── routes/
│   └── index.js
├── docker-compose.yml   # Full stack orchestration
├── .env.example         # Environment variable template
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Authentication & user accounts
- [ ] Workflow history & versioning
- [ ] Support for more AI providers (OpenAI, Claude)
- [ ] Template library for common automations
- [ ] One-click deploy to Railway / Render

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

**Sid** — [@sydystic](https://github.com/sydystic) · [LinkedIn](https://www.linkedin.com/in/siddhikurne/)

---

<p align="center">
  Built with ❤️ to make automation accessible to everyone
</p>
