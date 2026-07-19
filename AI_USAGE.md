# AI Usage

This document is intentionally honest about where AI helped, where it was wrong, and what was manually corrected.

## Which AI tools I used

I used:
- GitHub Copilot Chat / Copilot CLI assistant during development
- Gemini API in the application runtime for document question answering

## How I used AI during development

I used AI as a coding partner, not as an autopilot. The workflow was:
1. draft module structure and route/service flow
2. generate an initial implementation skeleton
3. manually review generated code
4. run typecheck/build/test/smoke checks
5. patch issues and refactor for readability

I mainly used AI to accelerate repetitive tasks (boilerplate, DTO mapping, repetitive error handling) and to speed up iteration.

## Example prompts I used

Examples of development prompts I used:
- "Implement auth module with register/login/me using JWT and bcrypt"
- "Add upload API with Multer validation for PDF/TXT/MD"
- "Add global error handling for Zod, JWT, Multer, and Mongo errors"
- "Write frontend dashboard page with loading/error/empty states"
- "Fix API validation error for GET query parsing"

## What code was AI-generated

AI-assisted generation was used for:
- initial controller/service scaffolding
- route wiring patterns
- frontend page skeletons
- documentation first drafts
- some test file starting templates

## What I modified manually

I manually adjusted and finalized:
- request validation behavior for GET routes
- unsafe payload sanitization behavior
- chat retrieval query logic and fallback behavior
- frontend state handling for stale data/reset cases
- model and error handling around Gemini API failures
- release verification and documentation quality

## Where AI gave incorrect suggestions

1. **Gemini model assumptions**
   - AI suggested model names that were not available for the current project/account.
   - I replaced with currently supported model aliases and validated against live API responses.

2. **Validation middleware mutation**
   - One generated refactor reassigned `req.query`, which is getter-only in this runtime.
   - This caused runtime 500s on GET endpoints.
   - I fixed by mutating query object values instead of reassigning.

3. **Frontend/editor diagnostics confusion**
   - Build passed, but editor showed JSX parse errors due to TS config setting (`erasableSyntaxOnly`).
   - I corrected tsconfig to remove that setting for this project.

## How I verified correctness

I did not trust generated code blindly. I verified by:
- backend: `npm run typecheck`, `npm run build`, `npm test`
- frontend: `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`
- runtime smoke tests covering auth, upload, analytics, search, chat, history
- manual validation of edge cases (invalid input, no token, bad payloads, provider failures)

## Final note

AI sped up implementation, but correctness came from manual review, test execution, and repeated debugging.
