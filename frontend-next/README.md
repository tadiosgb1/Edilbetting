# EdilBet Frontend — Next.js App Router

Next.js App Router, React, TypeScript, Tailwind CSS, Zustand, Axios and Lucide UI foundation.

## Run each workspace locally

From this directory, install dependencies once:

```bash
npm install
```

Start the role-specific development server you want:

| Command | Workspace | URL |
| --- | --- | --- |
| `npm run dev:player` | Player sportsbook | http://localhost:3000 |
| `npm run dev:admin` | Admin console | http://localhost:3001 |
| `npm run dev:agent` | Agent workspace | http://localhost:3002 |
| `npm run dev` | Player sportsbook (default) | http://localhost:3000 |

Each command starts the same Next.js App Router application with a role-specific environment. The root URL redirects to that workspace. The sign-in screen has no role selector; its destination is determined by the command used to start the server.

## Routes

- `/auth/login` — role-contextual sign-in screen
- `/player` — sportsbook home, fixtures and bet slip preview
- `/admin` — admin dashboard
- `/agent` — agent dashboard

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
- `scripts/dev-role.mjs` — cross-platform launcher for the three role-specific development servers

## Environment

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. Variables prefixed with `NEXT_PUBLIC_` are browser-visible. Keep private credentials server-side.

## Production requirements

Sign-in currently demonstrates the role-specific navigation flow only. Connect `authService` to the backend, use secure server-managed sessions, protect routes with server-side authorization, and enforce role permissions and tenant isolation in the backend. The sportsbook fixtures and odds are illustrative preview data until connected to verified API endpoints. Run `npm run typecheck` and `npm run build` before deployment.
