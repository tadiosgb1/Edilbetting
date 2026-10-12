# EdilBet Frontend — Next.js App Router

Next.js App Router, React, TypeScript, Tailwind CSS, Zustand, Axios and Lucide UI foundation.

## Run locally
```bash
cd frontend-next
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000. Routes: `/auth/login`, `/player`, `/admin`, `/agent`.

## Architecture
- `app/(auth)` — authentication routes
- `app/(player)` — player sportsbook
- `app/(admin)` — admin routes and role layout
- `app/(agent)` — agent routes and role layout
- `src/components/ui` — reusable Button, Input, Card and Badge primitives
- `src/components/layout` — shared admin/agent header, sidebar and dashboard shell
- `src/components/dashboard` — reusable overview modules
- `src/hooks` — reusable client hooks
- `src/stores` — Zustand state
- `src/services` — Axios API client and authentication service
- `src/lib` — shared utilities

## Environment
Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. Variables prefixed with `NEXT_PUBLIC_` are browser-visible. Keep private credentials server-side.

## Production requirements
The login currently demonstrates role selection and navigation only. Connect `authService` to the backend, use secure server-managed sessions, protect routes with server-side authorization, and enforce role permissions and tenant isolation in the backend. Dashboard records and odds are illustrative, not live data. Install dependencies and run the build/typecheck before deployment.
