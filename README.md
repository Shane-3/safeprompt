# SafePrompt

> AI prompt security scanner — detect PII, secrets, and business-sensitive content before it reaches your AI tools.

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS v4 + Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| AI Rewriter | Google Gemini API (gemini-1.5-flash) |
| Auth | JWT with bcrypt |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Google Gemini API key (optional — fallback rewriter works without it)

### 1. Clone & install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Database setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

### Docker (alternative)

```bash
docker compose up --build
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | admin123 |
| User | user@demo.com | demo123 |

## Default Policies

| Policy | blockSecrets | warnOnPII | strictHealthTerms | Custom Keywords |
|---|---|---|---|---|
| Startup Default | ✅ | ✅ | ❌ | — |
| Health Strict | ✅ | ✅ | ✅ | patient, diagnosis, treatment, medication, medical record |
| Enterprise Confidential | ✅ | ✅ | ❌ | confidential, proprietary, trade secret, internal only, restricted |
