# Architecture

## System Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  Pages: Auth, Dashboard, Upload, Chat, History, Search     │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS (JWT)
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node + Express)             │
│  Routes → Controllers → Services → (Repo) → DB             │
│  Validation, Auth Middleware, Error Handling                │
└───────┬───────────────────────────────┬─────────────────────┘
        │                               │
        ▼                               ▼
┌─────────────────────────┐      ┌────────────────────────────┐
│ MongoDB                 │      │ Gemini API                 │
│ users/documents/chunks/ │      │ context-aware generation   │
│ conversations           │      │                            │
└───────────┬─────────────┘      └────────────────────────────┘
            │
            ▼
     JSON response to frontend
```

## Request Flows

### 1) Register / Login

1. Frontend sends credentials to auth endpoints.
2. Backend validates payload.
3. Password is hashed/verified with bcrypt.
4. JWT token is issued and returned.

### 2) Upload Document

1. Frontend uploads file with JWT.
2. Backend validates auth, type, and size.
3. File parser extracts text.
4. Metadata/text chunks are saved in MongoDB.

### 3) Ask AI

1. Frontend sends question + optional document id.
2. Backend fetches relevant chunks from DB.
3. Backend builds compact prompt and calls Gemini.
4. Answer and conversation entry are saved and returned.

### 4) Search / History / Analytics

- Search filters user documents and conversations.
- History returns paginated chat logs.
- Analytics uses MongoDB aggregation for dashboard metrics.

