# Data Model Design (Step 5)

This document defines the MongoDB collections and relationships before implementation.

## Collection Overview

1. `users`
2. `documents`
3. `document_chunks`
4. `conversations`

---

## 1) Users Collection

### Purpose

Stores authentication and account identity data.

### Fields

- `_id: ObjectId`
- `name: string` (required, trimmed, min length 2)
- `email: string` (required, unique, lowercase, indexed)
- `passwordHash: string` (required, bcrypt hash only)
- `createdAt: Date`
- `updatedAt: Date`

### Indexes

- Unique index on `email`

---

## 2) Documents Collection

### Purpose

Stores uploaded document metadata and extracted text summary information.

### Fields

- `_id: ObjectId`
- `ownerId: ObjectId` (required, ref `users`, indexed)
- `originalFilename: string` (required)
- `storedFilename: string` (required)
- `mimeType: string` (required, enum: pdf/txt/markdown mime types)
- `sizeInBytes: number` (required)
- `storagePath: string` (required)
- `title: string` (optional, derived from filename)
- `uploadDate: Date` (default now, indexed)
- `status: string` (enum: `uploaded | processing | ready | failed`, indexed)
- `pageCount: number` (optional for PDF)
- `tokenCountEstimate: number` (optional)
- `metadata: object` (optional parser metadata)
- `createdAt: Date`
- `updatedAt: Date`

### Indexes

- Compound index: `{ ownerId: 1, uploadDate: -1 }`
- Compound index: `{ ownerId: 1, status: 1 }`
- Text index for search-oriented fields: `title`, `originalFilename`

---

## 3) Document Chunks Collection

### Purpose

Stores chunked text segments for context retrieval. This prevents sending entire files to Gemini.

### Fields

- `_id: ObjectId`
- `documentId: ObjectId` (required, ref `documents`, indexed)
- `ownerId: ObjectId` (required, ref `users`, indexed)
- `chunkIndex: number` (required)
- `content: string` (required)
- `tokenCountEstimate: number` (optional)
- `charStart: number` (optional)
- `charEnd: number` (optional)
- `createdAt: Date`

### Indexes

- Compound unique index: `{ documentId: 1, chunkIndex: 1 }`
- Compound index: `{ ownerId: 1, documentId: 1 }`
- Text index on `content` (baseline keyword retrieval for initial RAG)

---

## 4) Conversations Collection

### Purpose

Stores question/answer history with source tracking.

### Fields

- `_id: ObjectId`
- `ownerId: ObjectId` (required, ref `users`, indexed)
- `documentId: ObjectId` (optional, ref `documents`, indexed)
- `question: string` (required)
- `answer: string` (required)
- `sourceChunkIds: ObjectId[]` (optional, refs `document_chunks`)
- `model: string` (required, e.g., `gemini-1.5-flash`)
- `latencyMs: number` (optional)
- `inputTokensEstimate: number` (optional)
- `outputTokensEstimate: number` (optional)
- `createdAt: Date` (indexed)
- `updatedAt: Date`

### Indexes

- Compound index: `{ ownerId: 1, createdAt: -1 }`
- Compound index: `{ ownerId: 1, documentId: 1, createdAt: -1 }`
- Text index on `question` and `answer` for conversation search

---

## Relationship Design

- One `user` → many `documents`
- One `document` → many `document_chunks`
- One `user` → many `conversations`
- One `document` → many `conversations` (optional linkage)
- One `conversation` → many relevant `document_chunks` via `sourceChunkIds`

---

## Trade-offs and Recommended Approach

## A) Conversation storage: embed vs separate collection

- Embed in `documents`:
  - Pros: quick document-centric reads
  - Cons: unbounded array growth, 16MB document limit risk
- Separate `conversations` collection:
  - Pros: scalable, searchable, clean pagination
  - Cons: one extra query for joins at read time

**Recommendation:** Separate `conversations` collection (production-safe).

## B) Chunk storage: document-level full text vs chunk collection

- Full text only in `documents`:
  - Pros: simple
  - Cons: poor retrieval precision and larger prompts
- Dedicated `document_chunks`:
  - Pros: better retrieval relevance, prompt/token optimization
  - Cons: extra write complexity during ingestion

**Recommendation:** Use dedicated `document_chunks` now.

## C) Retrieval: text index vs vector DB

- Text index only:
  - Pros: zero extra infra cost, easy to ship
  - Cons: weaker semantic matching
- Vector DB/embeddings:
  - Pros: best semantic relevance
  - Cons: added cost and complexity

**Recommendation:** Start with text index + chunk ranking, keep schema vector-ready for later upgrade.

