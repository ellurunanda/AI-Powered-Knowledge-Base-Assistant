# AI Powered Knowledge Base Assistant

## Project overview

AI Powered Knowledge Base Assistant is a full-stack SaaS-style application where users can upload documents and ask AI questions based on their own content. The goal was to build this like a real production project: modular structure, clear boundaries, secure defaults, and interview-ready decisions.

Core capabilities:
- user signup/login with JWT
- upload PDF, TXT, and Markdown files
- ask AI questions grounded in uploaded documents
- conversation history with pagination
- document and conversation search
- dashboard analytics

## Setup instructions

This repository is a monorepo with two apps:
- `frontend` (React + Vite)
- `backend` (Node.js + Express + MongoDB)

You should run backend and frontend in separate terminals.

## Installation steps

### 1) Clone the repository

```powershell
git clone https://github.com/ellurunanda/AI-Powered-Knowledge-Base-Assistant.git
cd AI-Powered-Knowledge-Base-Assistant
```

### 2) Install backend dependencies

```powershell
cd backend
npm install
```

### 3) Install frontend dependencies

```powershell
cd ..\frontend
npm install
```

## Environment variables

Create `backend\.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN_MINUTES=60
JWT_COOKIE_NAME=accessToken
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-flash-latest
CHUNK_SIZE_CHARS=1200
CHUNK_OVERLAP_CHARS=200
MAX_CONTEXT_CHUNKS=6
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
AUTH_RATE_LIMIT_MAX_ATTEMPTS=10
```

## Running locally

### Backend (port 5000)

```powershell
cd backend
npm run dev
```

### Frontend (port 3000)

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

## Design decisions

1. **Modular monolith backend**
   - I kept auth, documents, chat, analytics, conversations, and search in separate modules.
   - This gives clean ownership without microservice overhead.

2. **Chunk-based retrieval before AI generation**
   - I store extracted text in chunks and retrieve relevant chunks for prompts.
   - This keeps prompts smaller and improves answer grounding.

3. **JWT auth + middleware layering**
   - Auth, validation, sanitization, and error handling are centralized middleware concerns.
   - Controllers stay focused on business behavior.

4. **MongoDB text search first**
   - I intentionally started with text indexing instead of vector infra to keep the MVP simple and affordable.

5. **Security-first defaults**
   - Helmet, CORS allow-listing, rate limiting, environment validation, and input sanitization are enabled by default.

## Future improvements

- add semantic search with embeddings/vector index
- add background workers for document parsing/chunking at scale
- add refresh tokens + session revocation strategy
- add role-based access control for team workspaces
- add e2e UI tests and API integration tests with seeded test database
- move uploads to cloud storage (S3/Azure Blob/GCS)
- add answer citations in UI with clickable source snippets

## Additional documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_USAGE.md](./AI_USAGE.md)
- [DEBUG_NOTES.md](./DEBUG_NOTES.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [RELEASE_ACCEPTANCE_CHECKLIST.md](./RELEASE_ACCEPTANCE_CHECKLIST.md)
