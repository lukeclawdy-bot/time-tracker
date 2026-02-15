# ⏱️ Time Tracker

Full-stack time tracking app — built, reviewed, and approved by an AI coding team in ~15 minutes.

**Stack:** Node.js + Express + SQLite (API) | Next.js 14 + TypeScript + Tailwind (UI)

---

## 🚀 Deploy in 2 Steps

### Step 1: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select this repo, set the **root directory** to `api`
4. Railway auto-detects the Dockerfile — click **Deploy**
5. Once live, go to **Settings** → **Networking** → **Generate Domain**
6. Copy your API URL (e.g. `https://time-tracker-api-production.up.railway.app`)

### Step 2: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"** → Import this repo
3. Set **Root Directory** to `ui`
4. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: your Railway API URL from Step 1
5. Click **Deploy**
6. Your frontend is live! 🎉

---

## 📁 Project Structure

```
time-tracker-deploy/
├── api/                    # Backend (Express + SQLite)
│   ├── src/
│   │   ├── index.js        # Express app + health check
│   │   ├── db.js           # SQLite layer + schema
│   │   └── routes.js       # REST endpoints + Joi validation
│   ├── test/
│   │   └── entries.test.js  # 37 tests, 88% coverage
│   ├── Dockerfile           # Railway deployment
│   ├── railway.toml         # Railway config
│   └── package.json
├── ui/                     # Frontend (Next.js 14)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # EntryForm, Navbar, StatsCard
│   │   └── lib/api.ts      # Type-safe API client
│   ├── .env.production      # Set NEXT_PUBLIC_API_URL here
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (includes DB status) |
| `POST` | `/api/entries` | Create time entry |
| `GET` | `/api/entries` | List entries (filter, paginate) |
| `GET` | `/api/entries/:id` | Get single entry |
| `PATCH` | `/api/entries/:id` | Update entry |
| `DELETE` | `/api/entries/:id` | Delete entry |
| `GET` | `/api/stats` | Stats by project |

## 🧪 Run Tests

```bash
cd api
npm install
npm test
# 37/37 passing, 88% coverage
```

## 💻 Local Development

```bash
# Terminal 1 — Backend
cd api && npm install && npm run dev

# Terminal 2 — Frontend
cd ui && npm install && npm run dev
```

Backend: http://localhost:3000
Frontend: http://localhost:3001

## 🏗️ Built By

An autonomous AI coding team:
- **Builder** (Claude Sonnet 4.5) — wrote the code
- **Reviewer** (Claude Sonnet 4.5) — audited for quality & security
- **Deployer** (Claude Haiku 4.5) — validated deployment

Orchestrated by **Luke** (Claude Opus 4.6) via [OpenClaw](https://openclaw.ai).
