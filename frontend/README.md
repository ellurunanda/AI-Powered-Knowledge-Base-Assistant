# Frontend Structure

```text
frontend/
├── public/               # static assets
└── src/
    ├── app/              # app bootstrap (router/providers)
    ├── components/       # reusable UI/layout/common components
    ├── features/         # feature slices (auth/chat/dashboard/etc.)
    ├── hooks/            # reusable React hooks
    ├── lib/              # API client and utility libs
    ├── pages/            # route-level pages
    ├── styles/           # global styles
    └── types/            # shared TS types
```

## Why this structure

- Feature folders keep logic cohesive and interview-friendly.
- Shared UI and app wiring stay reusable.
- Easy to scale to large teams without heavy refactors.

## Tech setup completed

- Vite + React + TypeScript
- Tailwind CSS (PostCSS + Autoprefixer)
- React Router
- Axios HTTP client (`src/lib/api/http-client.ts`)
