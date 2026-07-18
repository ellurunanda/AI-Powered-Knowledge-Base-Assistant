# Architecture

## System overview

This application is a modular monolith with a React frontend and an Express backend.
The design keeps the codebase simple to run locally while still using production-style separation of concerns.

## System diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           React Frontend                           │
│ Pages: Login, Signup, Dashboard, Upload, Chat, History, Search     │
│ Providers: Auth, Toast                                              │
│ HTTP Client: Axios                                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP + JWT cookie / bearer token
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Express Backend API                           │
│                                                                     │
│  Routes -> Middleware -> Controllers -> Services -> MongoDB/Gemini │
│                                                                     │
│  Cross-cutting layers:                                              │
│  - auth middleware                                                  │
│  - validation middleware                                            │
│  - request sanitization                                             │
│  - rate limiting                                                    │
│  - helmet                                                           │
│  - error handling                                                   │
└───────────────────────┬──────────────────────────┬──────────────────┘
                        │                          │
                        ▼                          ▼
             ┌───────────────────┐      ┌──────────────────────────┐
             │ MongoDB           │      │ Gemini API               │
             │ users             │      │ grounded answer          │
             │ documents         │      │ generation               │
             │ document_chunks   │      │                          │
             │ conversations     │      │                          │
             └───────────────────┘      └──────────────────────────┘
```

## Frontend responsibilities

The frontend is responsible for:

- rendering route-level pages
- storing authenticated user state
- sending API requests with credentials
- handling loading, error, and empty states
- presenting analytics, uploads, search, and chat results

## Backend responsibilities

The backend is responsible for:

- authenticating users
- validating request payloads
- storing metadata and conversations
- parsing uploaded files
- chunking extracted text
- retrieving relevant chunk context
- calling Gemini with a prompt built from retrieved context
- returning consistent success and error responses

## Request flows

### 1) Authentication flow

1. Frontend submits register or login form.
2. Backend validates payload with Zod.
3. Passwords are hashed and compared using bcrypt.
4. JWT is signed and returned.
5. Token is stored as an HttpOnly cookie.
6. Protected frontend pages use `/api/auth/me` to bootstrap session state.

### 2) Upload flow

1. User uploads PDF, TXT, or Markdown document.
2. Multer validates file size and file type.
3. Backend stores document metadata.
4. Physical file is saved to the uploads directory.
5. Document remains available for later parsing and AI retrieval.

### 3) AI question answering flow

1. User selects a document and asks a question.
2. Backend ensures the document belongs to the authenticated user.
3. Backend checks whether chunks already exist.
4. If chunks do not exist, text is extracted and chunked.
5. Backend retrieves relevant chunks from MongoDB text search.
6. Backend builds a compact prompt using only the selected chunk context.
7. Gemini generates an answer.
8. Backend saves the conversation entry with source chunk references.
9. Frontend displays the answer and updates history.

### 4) Search flow

1. Frontend sends a search query.
2. Backend searches document metadata and conversation text.
3. Matching results are returned in one response object.
4. Frontend renders grouped search sections.

### 5) Dashboard analytics flow

1. Frontend requests dashboard analytics.
2. Backend counts documents and conversations for the current user.
3. Backend calculates recent uploads and averages.
4. Frontend renders summary cards and recent activity.

## Design decisions

### Why use chunk-based retrieval?
Chunking improves relevance and reduces token cost compared to sending entire documents.

### Why use MongoDB text indexes first?
They are fast to implement and good enough for an initial RAG-style product without vector infrastructure.

### Why save conversation history?
It supports auditability, search, analytics, and better product UX.

### Why modular controllers and services?
It keeps transport logic, business logic, and infrastructure concerns separated.

## Security architecture

The API uses:

- `helmet` for headers
- `cors` allow-listing
- rate limiting
- request sanitization
- JWT verification with explicit algorithm checking
- structured error responses

## Scalability path

If this product grows, the natural next steps are:

- move file storage to cloud object storage
- add vector embeddings for semantic retrieval
- add background jobs for document ingestion
- add caching for analytics and repeated searches
- add refresh tokens and session revocation
