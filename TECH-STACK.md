# BudgetBite — Tech Stack

This document records the technologies actually used in the BudgetBite repo and the reasoning behind them. Everything is chosen to work on **free tiers** only; scale is not a concern (personal project).

This file is descriptive, not aspirational — if it disagrees with the code, the code wins. See `CLAUDE.md` for the agent-facing summary and `README.md` for setup.

---

## Summary table

| Area                   | Choice                                                                                | Free tier / notes                                                       |
| ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Backend**            | Node.js 22 + TypeScript + Express 5                                                   | Free, open source                                                       |
| **Frontend**           | Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui                           | Free, open source                                                       |
| **Database**           | Neon (serverless Postgres) + Drizzle ORM                                              | Neon free tier; Drizzle free                                            |
| **Auth**               | **better-auth** on both API (mounted via `toNodeHandler`) and web (better-auth client) | Free; Google + GitHub OAuth apps free                                   |
| **AI**                 | Provider-agnostic abstraction (`packages/ai`) — Google Gemini, Anthropic, or OpenAI    | Gemini free tier — **no credit card required** (see §5)                  |
| **Validation**         | Zod, schemas shared via `@repo/shared`                                                | Free                                                                    |
| **Email**              | Resend                                                                                | Free tier; used for verification OTPs and transactional mail            |
| **Push notifications** | Deferred (see §6)                                                                     | Notification timings are persisted; delivery is not wired up yet        |
| **Scraper**            | Python + Playwright + SeleniumBase                                                    | Free; writes to the API's admin endpoints                                |
| **Package manager**    | pnpm 10.30 + Turborepo                                                                 | Free, fast for monorepos                                                |
| **Hosting** (later)    | Vercel (web) + Vercel/Railway/Render (API) + Neon (DB)                                | Free tiers                                                              |

---

## 1. Backend (`apps/api`)

| Layer               | Technology                                                          | Why                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**         | Node.js 22 LTS                                                      | Matches monorepo; good TS + ESM support.                                                                                                             |
| **Language**        | TypeScript (ESM, `.js` import suffixes required from `.ts` sources) | Type safety; shared types with frontend via `@repo/shared`.                                                                                          |
| **Framework**       | **Express 5**                                                       | Familiar, huge ecosystem. Layered design: `routes/ → controllers/ → services/ → @repo/database` repositories. Validation via Zod at the route edge. |
| **Database client** | **Drizzle ORM** (in `packages/database`)                            | Type-safe; works with Neon. The only module that imports the schema or constructs SQL.                                                               |
| **Database**        | **Neon** (serverless Postgres)                                      | Free tier (0.5 GB storage, ~190 compute hours/month). Plenty for personal use.                                                                       |
| **Validation**      | **Zod** (schemas in `@repo/shared`)                                 | Validate request body/query at the API edge; same schemas drive web forms.                                                                           |
| **Auth (API side)** | **better-auth** mounted directly                                    | `app.all('/api/auth/{*any}', toNodeHandler(auth))` in `apps/api/src/index.ts`. Session is verified per request via `auth.api.getSession(...)`.    |
| **Email**           | **Resend** + `EMAIL_FROM`                                            | Used by better-auth's `emailOTP` plugin for verification, and for other transactional mail.                                                          |

**Auth flow (actual):** better-auth runs **inside the Express API**, backed by the Drizzle adapter against Neon. It handles email/password (with email verification via OTP), Google OAuth, and GitHub OAuth. The web app talks to those routes via the better-auth client and a session cookie (`better-auth.session_token`). The API authenticates requests by calling `auth.api.getSession({ headers })`. There is no separate JWT layer.

---

## 2. Frontend (`apps/web`)

| Layer                       | Technology                                              | Why                                                                                            |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Framework**               | **Next.js 16** (App Router)                             | SSR, file-based routing. Next 16 middleware lives in `proxy.ts` and gates routes by session.   |
| **Language**                | TypeScript                                              | Shared types and Zod schemas via `@repo/shared`.                                               |
| **UI runtime**              | **React 19**                                            | Latest stable; Server Components used selectively.                                             |
| **Styling**                 | **Tailwind CSS 4** (via `@tailwindcss/postcss`)         | Utility-first.                                                                                 |
| **UI components**           | **shadcn/ui** (Radix primitives, copy-in-tree)          | Accessible, owned in-repo, no runtime cost.                                                    |
| **Animation**               | `motion` (Framer Motion successor)                      | Used for landing and onboarding.                                                               |
| **Auth client**             | **better-auth** client (`apps/web/lib/auth-client.ts`)  | Pairs with the better-auth server in `apps/api`. Sends credentials so the cookie reaches the API. |
| **Server state / fetching** | **TanStack Query**                                      | Caching, loading states, refetch.                                                              |
| **HTTP client**             | **ky** (`apps/web/lib/api/client.ts`)                   | Thin wrapper; `credentials: 'include'`, `prefixUrl = NEXT_PUBLIC_API_URL`.                     |
| **Forms**                   | **React Hook Form** + Zod (via `@hookform/resolvers`)   | Same Zod schemas as the API.                                                                   |
| **Flows / wizards**         | **XState 5** + `@xstate/react`                          | Onboarding (`app/onboarding/_machines/...`) and budget-plan creation (`app/plans/_machines/...`). |
| **Charts**                  | `recharts`                                              | Analytics dashboard.                                                                           |
| **Misc UI**                 | `lucide-react`, `sonner`, `cmdk`, `vaul`, `embla-carousel-react`, `react-day-picker` | Standard shadcn-adjacent libraries.                                                  |

---

## 3. Database

| Item                 | Choice                                                                       | Why                                                       |
| -------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Host**             | **Neon**                                                                     | Serverless Postgres, free tier.                           |
| **Driver**           | `pg`                                                                         | Used by Drizzle's `node-postgres` adapter.                |
| **ORM / migrations** | **Drizzle** in `packages/database`                                           | Schema in TypeScript, migrations via `drizzle-kit`.       |
| **Connection**       | `DATABASE_URL` (pooled) + `DIRECT_DATABASE_URL` (direct, used for migrations) | Two URLs because Neon pooled connections can't run DDL.   |
| **Migrations flow**  | `pnpm db:generate` / `pnpm db:migrate` (orchestrated by `scripts/db-migrate.sh`) | (1) regenerate the better-auth schema, (2) `drizzle-kit generate`, (3) optionally `drizzle-kit migrate`. |

`packages/database/src/schema/auth.ts` is **generated** from the better-auth config — do not hand-edit it. Change `apps/api/src/lib/auth.ts` and run `pnpm db:generate`.

---

## 4. Auth (end-to-end)

| Concern              | Technology                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Provider**         | **better-auth** (single library spans API and web)                                          |
| **Strategies**       | Email + password with email verification (OTP), Google OAuth, GitHub OAuth                  |
| **Session**          | Cookie (`better-auth.session_token`); server verifies via `auth.api.getSession(...)`         |
| **Web middleware**   | `apps/web/proxy.ts` (Next 16 middleware) — redirects unauthenticated users to `/login` and authenticated users away from auth pages |
| **Email delivery**   | Resend (used by better-auth `emailOTP` plugin for verification codes)                       |
| **Password hashing** | Handled by better-auth internally                                                           |
| **Roles**            | `role: 'user' \| 'admin'` added via better-auth `additionalFields` in `apps/api/src/lib/auth.ts`. The DB column is owned by better-auth's generated schema. |
| **Admin/service auth** | Two-tier: `requireAdminOrService` middleware accepts either `X-API-Key: $ADMIN_API_KEY` (used by the scraper, service-to-service) or a logged-in user whose `role === 'admin'`. |

No Auth0/Clerk. NextAuth is **not** used anywhere; earlier drafts of this document referenced it, but the actual implementation has always been better-auth.

---

## 5. AI (meal suggestions)

Requirements: generate meal plans and N options per meal slot using budget, location, menu data, and feedback.

The codebase is **provider-agnostic**: code calls the `LLMProvider` interface (from `@repo/shared`); the concrete provider is chosen at runtime by `createLLMProvider()` in `packages/ai/src/providers/index.ts` based on `AI_PROVIDER`.

| Provider         | Env value (`AI_PROVIDER`) | SDK                   | Notes                                                              |
| ---------------- | ------------------------- | --------------------- | ------------------------------------------------------------------ |
| **Google Gemini**| `google`                  | `@google/genai`       | Default in `.env.example` (`gemini-2.5-flash`). Free tier, no card required. |
| **Anthropic**    | `anthropic`               | `@anthropic-ai/sdk`   | Code-level fallback if `AI_PROVIDER` is unset.                     |
| **OpenAI**       | `openai`                  | `openai`              | Supported; requires an OpenAI API key.                              |

**Configuration:**

| Var                              | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `AI_PROVIDER`                    | `google` / `anthropic` / `openai`                        |
| `AI_MODEL_NAME`                  | e.g. `gemini-2.5-flash`, `claude-sonnet-4-5`, `gpt-4o-mini` |
| `AI_API_KEY`                     | Single key the active provider uses                      |
| `AI_GENERATION_TEMPERATURE`      | Generation temperature (default `0.3` in `.env.example`) |
| `AI_GENERATION_MAX_TOKENS`       | Max tokens (default `8192`)                              |
| `AI_GENERATION_MAX_RETRIES`      | Retry attempts on invalid output (default `2`)           |

Gemini's free tier has rate limits (~15 req/min on Flash; see [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)). Switch provider by changing `AI_PROVIDER` / `AI_API_KEY` — no code changes needed.

Prompts live under `packages/ai/src/prompts/`.

---

## 6. Notifications

Per `REQUIREMENTS.md`, the app stores notification preferences (timings, meal slots) from day one so the user can configure when to be reminded. Delivery is **not yet wired up** — the timings are persisted but no cron/push worker consumes them. When this gets built, options are:

| Option | Service                          | Free tier                                       |
| ------ | -------------------------------- | ----------------------------------------------- |
| A      | **Email** via Resend (already configured) | Simplest — reuse existing setup.            |
| B      | **OneSignal**                    | Free tier (~10k subscribers).                  |
| C      | **Firebase Cloud Messaging**     | Free.                                           |

Recommendation: start with email (Resend is already in the stack), add push later if needed.

---

## 7. Scraper (`apps/scraper`)

| Item        | Technology                | Notes                                                                                                                                      |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Runtime** | Python 3                  |                                                                                                                                            |
| **Browser** | Playwright + SeleniumBase | Used to scrape Foodpanda restaurants and menus.                                                                                            |
| **Output**  | API admin endpoints       | Scraper posts to `/api/admin/*` with `X-API-Key: $ADMIN_API_KEY`. The API never reads files from the scraper. See `apps/api/DESIGN.md` §"Admin / Scraper API". |

Scraped restaurant rows include `latitude`/`longitude` so the API can do proximity filtering (Haversine, in km) against the user's residence coordinates.

---

## 8. Monorepo / shared packages

| Package                       | Role                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **`packages/database`**       | Drizzle schema, migrations, and **repositories** (Neon). The only module that touches the DB.              |
| **`packages/shared`**         | Zod schemas + inferred TS types shared by API and web (request/response contracts, validation, AI types). |
| **`packages/ai`**             | LLM provider abstraction (`createLLMProvider`) + prompts. Exports `./providers` and `./prompts`.            |
| **`packages/eslint-config`**  | Shared ESLint config (`--max-warnings 0`).                                                                  |
| **`packages/typescript-config`** | Shared `tsconfig` bases.                                                                                |

Proximity math (Haversine, km) lives **in the database repository / API service layer** (`packages/database/src/repositories/restaurant.repo.ts` and `apps/api/src/services/restaurant.service.ts`), not in a separate utils package.

---

## 9. Hosting (when deployed)

Forward-looking; nothing is deployed for users yet.

| App               | Suggestion                                                  | Free tier                                                |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| **Next.js (web)** | **Vercel**                                                  | Free hobby tier.                                         |
| **API**           | **Railway** / **Render** / **Fly.io** (long-running Express) | Vercel serverless functions don't fit a stateful Express server with mounted better-auth handler — use a host that runs Node processes. |
| **Database**      | **Neon**                                                    | Already chosen.                                          |
| **Scraper**       | Local or scheduled VM/cron                                  | Not user-facing; no need to host.                        |

---

## 10. Development

| Tool                | Choice                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Package manager** | **pnpm 10.30** (declared via `packageManager` in root `package.json`)                                                            |
| **Task runner**     | **Turborepo** (`turbo.json` declares tasks: `build`, `lint`, `check-types`, `dev`)                                               |
| **Linting**         | ESLint, `--max-warnings 0`                                                                                                       |
| **Formatting**      | Prettier                                                                                                                         |
| **TS runner (dev)** | `tsx` (API and DB package use `tsx watch` / `tsx node_modules/drizzle-kit/...`)                                                  |
| **Env loading**     | `dotenv` in the API; Next.js handles its own. `turbo.json#globalEnv` lists every var so caching invalidates correctly.            |

Key env vars (canonical list in repo-root `.env.example`):

`DATABASE_URL`, `DIRECT_DATABASE_URL`, `API_PORT`, `API_URL`, `WEB_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `ADMIN_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `AI_PROVIDER`, `AI_MODEL_NAME`, `AI_API_KEY`, `AI_GENERATION_*`, `NEARBY_RADIUS_KM`, `MAX_RESTAURANTS`, `MAX_ITEMS_PER_RESTAURANT`, `REPLAN_CUMULATIVE_DEVIATION_RATIO_THRESHOLD`, `AUTO_GENERATE_ON_CREATE`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_URL`.

---

## 11. What we're not using (and why)

- **NextAuth / Auth0 / Clerk / Supabase Auth** — better-auth gives us OAuth + email/password + sessions + role customization in a single library that runs in the Express API.
- **A separate JWT layer** — better-auth manages sessions via cookie; the API verifies per-request via `auth.api.getSession`.
- **Twilio / paid SMS** — email (Resend) is enough for verification and reminders.
- **Redis / caching layer** — not needed at personal-use scale.
- **Stripe / payments** — out of scope per `REQUIREMENTS.md` v1.
- **A separate utils package** for distance math — Haversine is inline where it's used (the restaurant repo and service).

---

## 12. Status

The stack described here is implemented and live in the repo. Setup steps: `README.md`. Architecture detail and conventions: `CLAUDE.md`. Product spec: `apps/api/REQUIREMENTS.md`. API design: `apps/api/DESIGN.md`.
