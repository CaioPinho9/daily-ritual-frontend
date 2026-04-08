# AGENTS.md — daily-ritual-frontend

## Scope
This repository contains the **frontend application** for Daily Ritual.
All UI, state management, routing, and browser behavior live here.

## Stack
- React + TypeScript
- Vite
- React Router

## Auth behavior (must match backend)
- Access token stored **in memory** (do not store in localStorage by default)
- Refresh token is **HttpOnly cookie** named `refresh_token` (frontend cannot read it)
- API client must send cookies:
  - `credentials: "include"`

### Refresh strategy
- On API 401:
  - call `POST /auth/refresh`
  - retry original request **once**
  - if refresh fails → redirect to `/login` and clear in-memory auth state

## UI conventions
- Keep UI functional and simple unless otherwise requested.
- Show backend validation errors using `details` when provided.
- Avoid heavy UI frameworks unless asked; prefer lightweight components.

## Project structure (suggested)
- `src/api/` API client + intercept/retry logic
- `src/auth/` auth pages + guards
- `src/routes/` route definitions
- `src/pages/` feature pages (dashboard, plans, sessions, notifications, profile)
- `src/components/` shared UI components

## Testing (optional unless requested)
- Prefer a small number of meaningful tests (auth flow, protected route)
- Avoid brittle tests.

## Work hygiene
- Keep diffs minimal and scoped.
- Do not modify backend code from this repo.
- No deployment/IaC work unless explicitly requested.

## Commits
- Use prefixes: `feat:`, `fix:`, `refactor:`, `misc:`
- Reference GitHub issue numbers when applicable.
