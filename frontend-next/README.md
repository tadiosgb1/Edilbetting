# EdilBet Frontend (Next.js)

The production-facing web application for EdilBet, built with **Next.js 15 App Router**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Zustand**, and **Axios**.

This README applies only to `frontend-next/`. The sibling `frontend/` and `backend/` projects are intentionally outside its scope.

## Requirements

- Node.js 20.9 or later (Node.js 22 LTS recommended)
- npm 10 or later
- Network access to the EdilBet API host: `https://10.195.49.21:3001`
- A browser/device that trusts the API server's TLS certificate

## Getting started

Run these commands from the `frontend-next/` directory:

```bash
npm install
cp .env.example .env.local
```

Set the API base URL in `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://10.195.49.21:3001
```

You can also create a local `.env` file with the same value if that is your preferred convention. **Never commit either file.** The tracked `.env.example` is the safe template; it contains configuration names and non-secret defaults only.

Start the required workspace:

```bash
npm run dev:player
```

Open [http://localhost:3000](http://localhost:3000).

### Workspace commands

| Command | Workspace | Default local URL |
| --- | --- | --- |
| `npm run dev` | Player (default) | http://localhost:3000 |
| `npm run dev:player` | Player | http://localhost:3000 |
| `npm run dev:admin` | Admin | http://localhost:3001 |
| `npm run dev:agent` | Agent | http://localhost:3002 |
| `npm run build` | Production build | — |
| `npm run start` | Serve production build | http://localhost:3000 |
| `npm run typecheck` | TypeScript validation | — |
| `npm run lint` | TypeScript validation (same script) | — |

Each development command starts the same Next.js application with a role-specific workspace configuration. The role launcher is `scripts/dev-role.mjs`.

## Backend integration

### API configuration

The frontend uses one configurable API origin:

| Setting | Value |
| --- | --- |
| Environment variable | `NEXT_PUBLIC_API_BASE_URL` |
| Development API base URL | `https://10.195.49.21:3001` |
| Login endpoint | `POST /users/login` |
| Full login URL | `https://10.195.49.21:3001/users/login` |

Keep service endpoint paths relative (for example, `/users/login`). Do not hardcode the host in individual pages or components. Changing the environment variable should be enough to point the frontend at another API environment.

### Authentication request

The login service currently sends the following JSON payload:

```json
{
  "phone": "09XXXXXXXX",
  "password": "your-password"
}
```

The authentication service accepts a response containing a user object and, when available, an `accessToken` or `token`. It supports common user identifiers and fields (`id`/`_id`, `name`/`fullName`, `phone`/`phoneNumber`, and `role`). Confirm the exact request and response contract with the backend team; adjust the service adapter in one place if the API uses different field names or an envelope.

A returned token is stored in browser local storage and attached to subsequent API requests as a Bearer token. This is a pragmatic integration step, not the strongest production session design. For a security-sensitive production deployment, prefer secure, HttpOnly, SameSite cookies issued and validated by the backend.

**Registration is not yet connected to a backend endpoint.** The registration screen does not create a fake local account; it displays a clear not-connected message. Wire it to the backend's confirmed registration contract when that endpoint and payload are available.

### Network and CORS checklist

The API host is a private-network IP address. The browser running the frontend must be on a network (or VPN) that can route to `10.195.49.21`.

If the browser cannot connect:

1. Verify that the API is running and reachable at `https://10.195.49.21:3001` from the same machine.
2. Ensure the API TLS certificate is valid and includes the IP address in its Subject Alternative Name (SAN). Do not disable TLS verification as a workaround.
3. Configure backend CORS to allow the frontend origins you actually use (for example, `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002`).
4. Allow the required methods and headers, including `Content-Type` and `Authorization`.
5. Check the browser Network and Console panels for the exact CORS, TLS, or API response error.

## Architecture and reusable API patterns

The goal is to keep UI components independent of HTTP details and backend URL configuration.

### Shared API client — `src/services/api-client.ts`

- Creates one configured Axios instance.
- Reads the base URL from `NEXT_PUBLIC_API_BASE_URL`.
- Sets shared JSON headers and a request timeout.
- Adds a Bearer token when one is available.
- Exposes `getApiErrorMessage()` so pages and hooks show consistent API errors.
- Exposes `setAccessToken()` for authentication lifecycle management.

Do not create a new Axios instance in every page or service. Add shared transport behavior here.

### Feature services — `src/services/`

Services own backend communication and response adaptation. For example, `src/services/auth.service.ts` owns the login endpoint, request payload, response parsing, and token handoff.

Pages should call a service function such as `login(credentials, role)`; they should not know the full API URL, Axios response shape, or token storage key. Add future feature modules (for example, user, wallet, sports, bets) as separate service files using the shared `apiClient`.

### Generic request hook — `src/hooks/use-api.ts`

`useApi<TData, TArgs>()` is a reusable client-side hook that accepts any typed async service function and provides:

- `execute(...args)` — runs the request and returns its result
- `data` — latest successful result
- `loading` — request-in-progress state
- `error` — normalized error message
- `reset()` — clears the hook state

Example:

```tsx
"use client";

import { useApi } from "@/hooks/use-api";
import { getProfile } from "@/services/user.service";

export function ProfilePanel() {
  const { data, loading, error, execute } = useApi(getProfile);

  // Call execute() from an event handler or effect when appropriate.
  // Render data, loading, and error in the component.
  return null;
}
```

The hook does not know which endpoint it is calling. It can be reused for any service with a compatible typed function. Keep feature-specific business logic in the service, not in this generic hook.

For simple one-off requests outside React components, `apiRequest<TResponse>()` is also exported from the same hook module.

### State management

- `src/stores/auth-store.ts` — shared client-side authentication/user state using Zustand.
- `src/components/auth/auth-page.tsx` — login UI and navigation; delegates authentication to the service.
- `src/hooks/` — reusable React hooks.
- `src/services/` — API transport and feature services.

Avoid putting endpoint URLs, Axios calls, or feature-specific response parsing in Zustand stores or presentation components.

## Main application routes

- `/auth/login` — sign in
- `/auth/register` — registration UI (backend integration pending)
- `/player` — player sportsbook workspace
- `/admin` — admin workspace
- `/agent` — agent workspace

## Validation

Run before opening a pull request or deploying:

```bash
npm run typecheck
npm run build
```

The repository's `lint` script currently runs TypeScript validation; it is not a separate ESLint rule run.

## Security and production readiness

- `NEXT_PUBLIC_*` values are embedded into browser-visible frontend code. Never put passwords, private API keys, signing secrets, or database credentials in them.
- Keep `.env`, `.env.local`, and other local environment files out of Git.
- Browser local storage is accessible to JavaScript. Use backend-managed HttpOnly cookies for production authentication where possible.
- Enforce authorization and role permissions on the backend. Frontend route guards are a user-experience feature, not a security boundary.
- Add backend-supported token refresh, logout/session revocation, rate limiting, account recovery, and audit logging before production launch.
- Confirm the API contract, TLS certificate, CORS policy, and network reachability in the deployment environment.

## Scope

This document and the integration changes described here are for `frontend-next/` only. They do not document or change the separate `frontend/` or `backend/` folders.
