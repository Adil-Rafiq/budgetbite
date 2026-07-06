# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BudgetBite** is a meal-planning app that suggests meals from real restaurant menus near the user, within a weekly/monthly food budget, using AI to generate plans. The app does not place orders; users order on Foodpanda and log actual amounts spent so the AI can re-plan. See `apps/api/REQUIREMENTS.md` and `TECH-STACK.md` for the product spec and stack rationale.

## Repo layout

pnpm + Turborepo monorepo (`pnpm-workspace.yaml` covers `apps/*` and `packages/*`).

- `apps/api` — Express 5 + better-auth + Drizzle. Layered: `routes/ → controllers/ → services/ → @repo/database` repositories. ESM (`.js` import suffixes required even from `.ts`).
- `apps/web` — Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui + Tanstack Query + ky. Auth client is better-auth.
- `apps/scraper` — Python (Playwright + SeleniumBase) for Foodpanda. Writes restaurants/menu items via the API's admin endpoints (uses `ADMIN_API_KEY`). The API never reads files from the scraper.
- `packages/database` — Drizzle schema, migrations, and repositories (Neon Postgres). The **only** module that touches the DB. Services in `apps/api` import repositories from `@repo/database`; never the schema or `db` directly for queries.
- `packages/ai` — LLM provider abstraction. `createLLMProvider()` switches between Anthropic / OpenAI / Gemini based on `AI_PROVIDER`. Prompts live under `src/prompts/`.
- `packages/shared` — Zod schemas + inferred TS types shared between API and web (request/response contracts, validation).
- `packages/eslint-config`, `packages/typescript-config` — shared infra.

## Common commands

Run from repo root unless noted. Use pnpm (not npm/yarn).

```bash
pnpm install                  # install all workspaces
pnpm dev                      # turbo run dev across all apps (web on :3000, api on :3001)
pnpm build                    # turbo run build
pnpm lint                     # turbo run lint (eslint --max-warnings 0 in each package)
pnpm check-types              # turbo run check-types
pnpm format                   # prettier --write **/*.{ts,tsx,md}

# DB workflow (orchestrated by scripts/db-migrate.sh)
pnpm db:generate              # 1) regen better-auth schema into packages/database/src/schema/auth.ts
                              # 2) drizzle-kit generate (creates new SQL migration in packages/database/drizzle/)
pnpm db:migrate               # same as above + applies the migration
```

Per-app:

```bash
pnpm --filter web dev         # Next.js only
pnpm --filter api dev         # tsx watch src/index.ts
pnpm --filter @repo/database db:studio   # Drizzle Studio
```

### Tests

`pnpm test` runs `turbo run test` (Vitest in `@repo/shared` and `apps/api`). Test files are co-located as `src/**/*.test.ts` and are excluded from the tsc build via each package's `tsconfig.json` — keep that exclude in mind when adding tests, or they will be emitted into `dist/`. Only pure logic is covered so far (plan-budget arithmetic in `apps/api/src/lib/plan-math.ts`, numeric string↔number boundary, Haversine distance, AI-output Zod schemas); there is no DB or HTTP test harness. Keep testable arithmetic in pure modules (e.g. `plan-math.ts`) rather than inside services, whose module graphs pull in `@repo/ai` provider construction at import time.

## Architecture notes that aren't obvious from one file

### Auth is better-auth, not NextAuth

Despite what `TECH-STACK.md` says about NextAuth, the actual implementation uses **better-auth** on both sides. The API mounts `app.all('/api/auth/{*any}', toNodeHandler(auth))` (`apps/api/src/index.ts`) and the web app calls those routes via the better-auth client (`apps/web/lib/auth-client.ts`). Session is a cookie (`better-auth.session_token`); `apps/web/proxy.ts` (Next 16's middleware) gates routes by checking that cookie. The user schema is **generated** from the better-auth config — do not hand-edit `packages/database/src/schema/auth.ts`; instead change `apps/api/src/lib/auth.ts` and run `pnpm db:generate`.

### Two-tier admin auth

Admin routes (`/api/admin/*`) accept either:

1. `X-API-Key: $ADMIN_API_KEY` (used by the scraper, service-to-service), or
2. A logged-in user whose better-auth `role === 'admin'`.

This is implemented in `apps/api/src/middleware/admin.middleware.ts`. The `role` field is added to better-auth via `additionalFields` in `apps/api/src/lib/auth.ts`. See `apps/api/DESIGN.md` §"Admin / Scraper API" for the full scheme.

### Layered architecture is enforced by convention

- **Routes** validate with Zod (via `validate({ body, query, params })` middleware) and dispatch to controllers.
- **Controllers** read `req`/`res` only — no DB, no business logic. They call services and shape responses.
- **Services** contain business logic. They use repositories from `@repo/database`. They throw `AppError(statusCode, message, code)` for known failure cases — do not return error tuples.
- **Repositories** (in `packages/database`) are the only place that imports the Drizzle schema or constructs SQL.

Per `TODO.md`: do NOT use `try/catch` in AI-related code — let `AppError`s bubble to `errorMiddleware`. The error middleware (`apps/api/src/middleware/error.middleware.ts`) handles `AppError`, `ZodError`, and unknown errors (returns generic 500).

### Numeric column round-tripping

Drizzle returns `numeric`/`decimal` columns as **strings**. Services convert at the boundary: write side stringifies (`String(input.latitude)`), read side coerces to number (`Number(restaurant.latitude)`). Look at `restaurant.service.ts` for the pattern. Do not let strings leak past services.

### AI provider abstraction

Code that calls the LLM should depend on the `LLMProvider` interface from `@repo/shared`, not a specific SDK. `createLLMProvider()` in `packages/ai/src/providers/index.ts` reads `AI_PROVIDER` (`anthropic` | `openai` | `google`) and `AI_MODEL_NAME` / `AI_API_KEY`. Default in `.env.example` is `google` + `gemini-2.5-flash` (free tier, no card required — see `TECH-STACK.md` §5).

### Shared validation lives in `@repo/shared`

Zod schemas (e.g. `listRestaurantsSchema`, `uuidSchema`, `CreateRestaurantInput`) are defined once in `packages/shared/src/schemas/` and consumed by both API routes and web forms. When adding a new endpoint, add the schema there first, then import from `@repo/shared` in both apps.

### Onboarding state machine

The web onboarding flow uses XState (`apps/web/app/onboarding/_hooks/use-onboarding.ts`). New onboarding steps go in `apps/web/app/onboarding/_components/steps/` and need to be wired into the machine, not just rendered conditionally.

### Web → API routing

The web app uses `ky` (`apps/web/lib/api/client.ts`) pointing at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`). It sends credentials so the better-auth cookie reaches the API. There is no Next API route layer in front of the Express API.

## Environment

`.env.example` at the repo root lists every var. The DB url goes in two places (Drizzle migrations and the API runtime); `apps/api`, `apps/web`, `apps/scraper`, and `packages/database` each have their own `.env` / `.env.local`. `turbo.json` declares the global env so cache invalidation works correctly — when you add a new env var that affects build output, add it to `turbo.json#globalEnv`.

Key vars: `DATABASE_URL`, `DIRECT_DATABASE_URL` (for Drizzle migrations), `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`, `RESEND_API_KEY`, `ADMIN_API_KEY`, `AI_PROVIDER`, `AI_MODEL_NAME`, `AI_API_KEY`, `NEARBY_RADIUS_KM`, `MAX_RESTAURANTS`, `MAX_ITEMS_PER_RESTAURANT`, `REPLAN_CUMULATIVE_DEVIATION_RATIO_THRESHOLD`.

## Conventions

- Pushing directly to `main` is fine. The repo has a "changes via pull request" branch rule, but the owner deliberately bypasses it with admin rights — do not flag the bypass warning or suggest a PR workflow.
- ESM everywhere; in `apps/api` and `packages/database`/`packages/ai`, relative imports must end in `.js` even though the source is `.ts`.
- ESLint runs with `--max-warnings 0`; warnings fail CI/turbo.
- Do not edit auto-generated files: `packages/database/src/schema/auth.ts` (better-auth) and `packages/database/drizzle/*.sql` / `meta/*.json` (drizzle-kit).
- Do not add Next.js API routes; the API is a separate Express service.
- Prefer extending an existing service over adding a new one for a closely related operation; admin and user-facing operations on the same resource live in one service (e.g. `restaurant.service.ts` has both `list` and `createRestaurant`).
