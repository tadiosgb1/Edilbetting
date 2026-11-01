# EdilBet

Repository containing the established Vue application, betting odds service and a Next.js App Router frontend foundation.

- `front-end/` — existing Vue application (preserved)
- `betting-odds-server/` — betting odds service
- `frontend-next/` — Next.js App Router UI for player, admin and agent experiences

See [frontend-next/README.md](frontend-next/README.md) for setup. The frontend includes route groups, reusable UI primitives, shared admin/agent layout, hooks, Zustand state and API services. Authentication and dashboard data remain preview implementations until connected to and protected by the backend. UI route selection is not authorization. Never commit secrets.
