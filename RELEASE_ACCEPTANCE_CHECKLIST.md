# Release Acceptance Checklist

Use this checklist before marking a release as ready.

## 1) Functional requirements

- [x] User can register
- [x] User can login/logout
- [x] User can upload PDF, TXT, and Markdown files
- [x] User can ask AI questions for uploaded documents
- [x] User can view conversation history
- [x] User can search documents and conversations
- [x] User can view dashboard analytics

## 2) Architecture and code quality

- [x] Backend follows modular routes/controllers/services structure
- [x] Frontend follows page-based and shared component structure
- [x] Validation is applied before controller logic
- [x] Shared error handling exists on backend and frontend
- [x] Documentation includes README, ARCHITECTURE, AI_USAGE, and DEBUG_NOTES

## 3) Security requirements

- [x] Helmet enabled
- [x] CORS allow-listing enabled
- [x] Rate limiting enabled (global + auth)
- [x] JWT expiration and verification enforced
- [x] Environment variable validation enforced
- [x] Request sanitization enabled

## 4) Test requirements

### Backend

- [x] API smoke-style tests exist for health, unsafe payload rejection, and unknown routes
- [x] `npm test` runs and passes

### Frontend

- [x] Unit tests exist for API error mapping behavior
- [x] `npm test` runs and passes

## 5) Release-style verification commands

Run and confirm all pass:

### Backend

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\backend"
npm run typecheck
npm run build
npm test
```

### Frontend

```powershell
cd "C:\Users\crazy\OneDrive\Desktop\AIAgent\AI-Powered Knowledge Base Assistant\frontend"
npm run typecheck
npm run build
npm run lint
npm test
```

## 6) Final readiness decision

- [x] All release checks pass
- [x] No blocking defects found in core flows
- [x] Project status: **READY**
