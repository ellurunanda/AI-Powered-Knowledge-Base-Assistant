# AI Powered Knowledge Base Assistant

Production-style full stack SaaS app where users can upload documents and ask AI questions grounded in their own knowledge base.

## Monorepo Layout

```text
AI-Powered Knowledge Base Assistant/
├── frontend/   # React + Vite + Tailwind client
└── backend/    # Node.js + Express + MongoDB API
```

## Core Features

- User registration and login (JWT)
- Upload PDF, TXT, and Markdown files
- Ask AI questions over uploaded documents
- Conversation history
- Document and conversation search
- Dashboard analytics

## High-Level Architecture

Frontend (React) sends authenticated API requests to backend (Express).  
Backend validates/authenticates requests, stores data in MongoDB, and calls Gemini with relevant document context to generate answers.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed flow and diagram.
See [DATA_MODEL.md](./DATA_MODEL.md) for collection and relationship design.

## Project Structure

See:

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
