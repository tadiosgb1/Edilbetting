# EdilBet multi-tenant frontend

React, TypeScript, Vite and Tailwind frontend for the EdilBet player, agent and admin experiences. The existing Vue application in `../front-end` remains intact and is the reference for established workflows.

## Requirements
- Node.js 20 LTS or newer
- npm

## Install and run
From this directory run `npm install`, then use separate terminals:

```bash
npm run dev:player
npm run dev:agent
npm run dev:admin
```

| Experience | Development URL | Production hostname |
| --- | --- | --- |
| Player | http://localhost:5173 | https://edilbet.com |
| Agent | http://localhost:5174 | https://agent.edilbet.com |
| Admin | http://localhost:5175 | https://admin.edilbet.com |

Use `npm run dev:all` to launch all three together.

## Commands
- `npm run dev:player`, `npm run dev:agent`, `npm run dev:admin` — one tenant each
- `npm run dev:all` — all tenant servers concurrently
- `npm run build` — TypeScript check and production build
- `npm run build:player`, `npm run build:agent`, `npm run build:admin` — tenant-mode builds
- `npm run preview` — preview the default build

## Configuration
Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the browser-accessible API base URL. Variables prefixed with `VITE_` are public and embedded in the browser bundle. Never store passwords, signing keys, database credentials or private tokens in frontend environment variables.

## Architecture
- `src/tenant.ts` — host/port tenant resolution
- `src/pages/PlayerSportsPage.tsx` — player sportsbook
- `src/pages/RoleDashboard.tsx` — role-aware agent/admin dashboard
- `src/components/DashboardShell.tsx` — responsive workspace navigation and layout
- `src/App.tsx` — tenant entry point

Admin navigation reflects the Vue router's current dashboard areas: users, bets, payment proofs, brands, sports and events. The agent workspace provides players, commissions, transactions and reports. Metrics and records are demo content; unfinished sections are scaffolded, not represented as connected workflows.

## Production checklist
Configure DNS/TLS and route each hostname to the frontend deployment, with SPA fallback enabled. Tenant routing by hostname or port selects presentation only; it is not authorization. Enforce authentication, role permissions, tenant isolation and audit logging on the backend for every protected API. Connect existing authentication, sports, events, bets, payments, users and brands APIs before production. Demo login controls are not suitable for real accounts.

## Mobile and accessibility
The dashboard uses responsive grids, collapsible mobile navigation, horizontally scrollable data tables and semantic control labels. Test at 320px, 375px, tablet and desktop widths before release.
