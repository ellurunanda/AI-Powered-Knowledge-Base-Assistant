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

