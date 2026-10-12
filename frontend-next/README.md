# EdilBet Frontend — Next.js App Router

Next.js App Router, React, TypeScript, Tailwind CSS, Zustand, Axios and Lucide UI foundation.

## Run each workspace locally

From this directory, install dependencies once:

```bash
npm install
```

| Command | Workspace | URL |
| --- | --- | --- |
| `npm run dev:player` | Player sportsbook | http://localhost:3000 |
| `npm run dev:admin` | Admin console | http://localhost:3001 |
| `npm run dev:agent` | Agent workspace | http://localhost:3002 |
| `npm run dev` | Player sportsbook (default) | http://localhost:3000 |

Each command starts the same Next.js App Router application with a role-specific environment. The app router lives in `src/app`. The root `scripts/` directory contains Node.js developer tooling (including the role-specific launcher); it intentionally remains outside `src/` because it is not browser application source code.

## Local demo credentials

| Role | Phone | Password |
| --- | --- | --- |
| Player | `0963275521` | `1234` |
| Agent | `0963275522` | `1234` |
| Admin | `0963275523` | `1234` |

Open `/auth/login` on the corresponding port. Admin and agent dashboards check the persisted browser session and redirect unauthenticated or wrong-role users to login. Login state and demo registrations are persisted in browser local storage under `edilbet-auth`; clearing that local-storage key signs out and removes local registrations.

Registration is a local browser demo assigned to the role of the running workspace. This is not production authentication.

## Routes

- `/auth/login` — phone-based sign-in
- `/auth/register` — phone-based registration
- `/player` — sportsbook home, fixtures and bet slip preview
- `/admin` — admin dashboard (requires admin session)
- `/agent` — agent dashboard (requires agent session)

## Architecture

- `src/app/(auth)` — authentication routes
- `src/app/(player)` — player sportsbook
- `src/app/(admin)` — admin routes and role guard
- `src/app/(agent)` — agent routes and role guard
- `src/components/auth` — client-side session guard
- `src/components/ui` — reusable UI primitives
- `src/components/layout` — shared dashboard layout
- `src/stores/auth-store.ts` — Zustand auth state persisted to local storage
- `src/services` — API client and backend auth service contracts
- `scripts/dev-role.mjs` — role-specific development servers

## Environment

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. Variables prefixed with `NEXT_PUBLIC_` are browser-visible. Keep private credentials server-side.

## Production requirements

The included credentials and registration flow are local-only demo behavior. Client-side guards and local storage are not security boundaries. Before production, implement backend phone/password verification, secure server-managed sessions, server-side role authorization, rate limiting, account recovery, and tenant isolation. The sportsbook fixtures and odds remain illustrative preview data until connected to verified API endpoints. Run `npm run typecheck` and `npm run build` before deployment.
