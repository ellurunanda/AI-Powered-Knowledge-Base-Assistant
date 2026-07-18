# AI Powered Knowledge Base Assistant

A production-style full stack SaaS application where users can upload knowledge documents and ask AI questions grounded in their own data.

## Project goals

This project was built step by step like a real product team would build it:

- architecture first
- modular backend design
- reusable frontend structure
- validation before business logic
- secure defaults
- interview-friendly code organization

## Tech stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Mongoose
- JWT authentication
- Multer
- Zod validation

### Database and AI
- MongoDB
- Gemini API

## Core features

- user registration and login
- JWT-based protected routes
- upload PDF, TXT, and Markdown files
- parse and chunk uploaded documents
- ask AI questions against uploaded knowledge
- save conversation history
- search documents and conversations
- dashboard analytics
- global error handling and security middleware

## Monorepo layout

```text
AI-Powered Knowledge Base Assistant/
├── backend/
├── frontend/
├── ARCHITECTURE.md
├── DATA_MODEL.md
├── AI_USAGE.md
└── DEBUG_NOTES.md
```

## High-level architecture

Frontend sends authenticated HTTP requests to the backend API.
The backend validates the request, applies security middleware, queries MongoDB, and when needed sends grounded context to Gemini.
The final answer is returned to the frontend and the conversation is stored for later search and analytics.

See:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATA_MODEL.md](./DATA_MODEL.md)
- [AI_USAGE.md](./AI_USAGE.md)
- [DEBUG_NOTES.md](./DEBUG_NOTES.md)

## Local development setup

### 1) Install dependencies

Backend:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\backend"
npm install
```

Frontend:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\frontend"
npm install
```

### 2) Configure environment

Create `backend\.env` with values like:

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

## Running the app

Frontend on port `3000`:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\frontend"
npm run dev -- --host 0.0.0.0 --port 3000
```

Backend on port `5000`:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\backend"
npm run dev
```

## Validation commands

Backend:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\backend"
npm run typecheck
npm run build
npm test
```

Frontend:

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\frontend"
npm run typecheck
npm run build
npm run lint
```

## API areas

- `/api/auth` - register, login, logout, profile
- `/api/documents` - upload and list documents
- `/api/chat` - grounded question answering
- `/api/conversations` - paginated history
- `/api/analytics` - dashboard metrics
- `/api/search` - document and conversation search

## Security summary

The backend currently includes:

- `helmet` secure headers
- JWT expiration and verification
- strict CORS allow-listing
- global and auth-specific rate limiting
- Zod request validation
- unsafe payload sanitization for request data
- environment-based secrets

## Interview talking points

### Why chunk documents?
To avoid sending entire files to Gemini, reduce token usage, and improve retrieval relevance.

### Why keep conversations in a separate collection?
It scales better than embedding an unbounded array inside each document.

### Why use middleware heavily?
To centralize cross-cutting concerns like auth, validation, sanitization, and error handling.

### Why use a modular monolith instead of microservices?
The application is small enough to move fast in one deployable codebase while still keeping clear module boundaries.

## Known limitation

Gemini availability depends on:

- valid API key
- supported model name
- quota/billing availability in the Google project

See [AI_USAGE.md](./AI_USAGE.md) and [DEBUG_NOTES.md](./DEBUG_NOTES.md) for troubleshooting.
