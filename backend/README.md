# Backend Structure

```text
backend/
├── src/
│   ├── config/        # env and app config
│   ├── constants/     # app-wide constants
│   ├── middlewares/   # auth, validation, error middleware
│   ├── modules/       # domain modules (auth/docs/chat/etc.)
│   ├── services/      # integrations (Gemini, parsing)
│   ├── types/         # shared backend types
│   └── utils/         # reusable helpers
└── tests/             # unit/integration tests
```

## Why this structure

- Keeps business domains isolated (`modules`).
- Keeps third-party logic decoupled (`services`).
- Centralizes cross-cutting concerns (`middlewares`).
- Scales without becoming a single massive `controllers` folder.

## Security hardening

Current API protections include:

- `helmet` for secure HTTP headers
- strict CORS allow-list via `CORS_ORIGIN`
- global API rate limiting plus stricter auth rate limiting
- Zod request validation before controller logic
- JWT expiration and algorithm verification
- request payload sanitization against `$`, `.`, and prototype pollution keys
- environment-based secrets and runtime configuration

### Security-related environment variables

```env
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
AUTH_RATE_LIMIT_MAX_ATTEMPTS=10
JWT_EXPIRES_IN_MINUTES=60
```
