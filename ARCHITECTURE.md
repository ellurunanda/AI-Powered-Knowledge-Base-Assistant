# Architecture

## Project structure

The project is organized as a monorepo:

- `frontend/` - React + Vite + Tailwind UI
- `backend/` - Express API with modular domains
- root docs - architecture, data model, AI usage, debugging notes, release checklist

Backend modules are separated by domain (`auth`, `documents`, `chat`, `conversations`, `analytics`, `search`) with dedicated routes/controllers/services.

## Database design

MongoDB collections:
- `users`
- `documents`
- `document_chunks`
- `conversations`

High-level relationships:
- one user -> many documents
- one document -> many chunks
- one user -> many conversations
- one conversation references source chunks used during retrieval

Design intent:
- keep documents and conversation history scalable
- support pagination and search
- support grounded AI answers through chunk retrieval

## Authentication approach

Authentication is JWT-based:
- register/login issue signed JWT
- token sent via HttpOnly cookie (and supported as Bearer token)
- `authMiddleware` verifies token and attaches user identity to request
- protected routes require valid authenticated user
- token expiration enforced via config

## Major engineering decisions

1. **Modular monolith over microservices**
   - simpler local development and deployment
   - still preserves clean module boundaries

2. **RAG-style retrieval using Mongo text search first**
   - lower complexity and cost for MVP
   - allows later upgrade to vector search without redesigning core models

3. **Middleware-first cross-cutting concerns**
   - auth, validation, sanitization, error mapping, security headers, rate limiting
   - improves consistency and reduces duplicated logic

4. **Chunk persistence strategy**
   - parse/chunk once, reuse many times
   - better latency and lower token cost compared to reparsing every request

5. **Explicit error contract**
   - structured backend errors with codes
   - frontend maps provider/system errors to readable user messages

## How I would improve or scale this application

Short-term improvements:
- add richer API integration tests with ephemeral test database
- add frontend component tests beyond utility tests
- add refresh token flow and session revocation list

Mid-term improvements:
- move file storage to cloud object storage
- add background job processing for parsing/chunking
- add caching for hot analytics/search endpoints

Long-term improvements:
- semantic retrieval with embeddings + vector index
- team workspaces and RBAC
- observability stack (structured logs, traces, SLO dashboards)
- multi-region deployment with failover strategy
