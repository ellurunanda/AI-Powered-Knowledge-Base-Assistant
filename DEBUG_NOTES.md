# Debug Notes

This file documents real issues encountered during implementation and how they were resolved.

## Issue 1: Backend failed to start due to missing environment variables

### Problem
Backend crashed during startup with configuration validation errors.

### Root cause
Required environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`) were missing from `backend\.env`.

### Investigation
- checked startup stack trace
- traced error to environment schema validation in config loader
- confirmed `.env` was missing required keys

### Solution
Created and populated `backend\.env` with required values. Startup succeeded after restart.

---

## Issue 2: Dashboard and other GET APIs returned 500

### Problem
`/api/analytics/dashboard` and similar GET endpoints failed with server errors.

### Root cause
Validation middleware attempted to reassign `req.query` directly, but in this Express runtime `req.query` is getter-only.

### Investigation
- reproduced failures from dashboard page
- inspected backend logs and error message
- isolated failure to validation middleware after refactor

### Solution
Changed middleware logic to mutate query object values in place instead of reassigning `req.query`.

---

## Issue 3: Mongoose duplicate index warning on user email

### Problem
Backend emitted warning about duplicate schema index on `email`.

### Root cause
Email index was declared in two places in the user schema.

### Investigation
- inspected warning details from runtime logs
- reviewed auth model index definitions
- confirmed duplicate index declaration

### Solution
Removed redundant index declaration and kept one unique index.

---

## Issue 4: Gemini integration failures (invalid key / model not found / quota exceeded)

### Problem
Chat endpoint sometimes returned provider errors: invalid API key, unsupported model, or quota exceeded.

### Root cause
External provider configuration and quota state, not application business logic.

### Investigation
- captured raw Gemini error responses
- validated model availability via models endpoint
- checked key/project mapping and quota response details

### Solution
- updated `.env` to use supported model alias
- documented provider troubleshooting steps
- improved frontend error messaging for clearer user feedback

---

## Issue 5: VS Code showed JSX errors while project still built

### Problem
Editor reported many false TypeScript errors in `.tsx` files (for example `PageShell` treated like a type).

### Root cause
`erasableSyntaxOnly` was enabled in frontend tsconfig, causing JSX parsing incompatibility in this setup.

### Investigation
- compared CLI build success vs editor diagnostics
- extracted raw Problems panel entries
- traced repeated syntax errors to tsconfig behavior

### Solution
Removed `erasableSyntaxOnly` from frontend tsconfig files and reloaded editor/TS server.
