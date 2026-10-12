# EdilBet

Repository containing the established Vue 3 application, betting odds service and a React/TypeScript multi-tenant frontend preview.

## Applications
- `front-end/` — existing Vue 3 + Vite application and established workflows
- `betting-odds-server/` — betting odds backend service
- `frontend-next/` — React + TypeScript + Vite frontend for player, agent and admin experiences

See [frontend-next/README.md](frontend-next/README.md) for setup, scripts, tenant configuration and production requirements.

From `frontend-next/`, run `npm install` and then `npm run dev:player` (5173), `npm run dev:agent` (5174), or `npm run dev:admin` (5175). Use `npm run dev:all` to start all three.

Do not commit real credentials or production environment files. Tenant selection by host/port only chooses the UI; backend authorization and tenant data isolation must be implemented and tested separately.

**Status:** The React player interface and agent/admin dashboard shell are UI previews. Metrics and records are sample values, and authentication/betting/payment integrations must be connected and validated before release. The Vue application remains preserved as the current reference implementation.
