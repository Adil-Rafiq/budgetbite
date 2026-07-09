# apps/api — Backend Design Pattern

This document recommends a design pattern for the BudgetBite API that fits the monorepo, aligns with `structure.md`, and keeps the codebase testable and maintainable.

---

## Recommended: **Layered architecture + repository pattern**

Use a **layered architecture** with clear boundaries and the **repository pattern** for data access. Your `structure.md` already follows this; here’s how to apply it consistently.

### Layers (top → bottom)

| Layer            | Responsibility                 | Depends on                 | In your app                   |
| ---------------- | ------------------------------ | -------------------------- | ----------------------------- |
| **Routes**       | HTTP mapping, validation       | Controllers                | `routes/*.routes.ts`          |
| **Controllers**  | Request/response, status codes | Services                   | `controllers/*.controller.ts` |
| **Services**     | Business logic, orchestration  | Repositories, shared-types | `services/*.service.ts`       |
| **Repositories** | Data access (DB)               | Schema, DB client          | `packages/database`           |

**Rule:** dependencies point **down** only. Routes → Controllers → Services → Repositories. No layer should import from a layer above it.

---

## Why this fits BudgetBite

1. **Repository pattern already in `packages/database`**  
   You have (or will have) `restaurant.repo`, `menu.repo`, `order.repo`. The API should use these repositories from the database package instead of touching the DB directly. Services depend on repositories; controllers never do.

2. **Clear separation of concerns**
   - **Routes:** path, method, query/body validation (e.g. Zod), call controller.
   - **Controllers:** parse request, call one or more services, map result to HTTP response (status + body).
   - **Services:** meal planning, budget rules, order creation, etc. No `req`/`res` here.
   - **Repositories:** CRUD and queries; used only by services.

3. **Testability**  
   You can unit-test services by passing mock repositories. Controllers can be tested with mock services. No need to hit the real DB in most tests.

4. **Framework-agnostic core**  
   Business logic lives in services and types in `@budgetbite/shared-types`. If you switch from Express to Fastify or Hono later, you only replace the route/controller layer.

5. **Aligns with existing plan**  
   Your planned `routes/`, `controllers/`, `services/`, `middleware/` map directly to this pattern.

---

## Optional but recommended additions

### 1. Dependency injection (constructor injection)

Inject repositories (and other services) into services so you can swap them in tests or for different runtimes:

```ts
// services/order.service.ts
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private budgetService: BudgetService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // use this.orderRepo, this.budgetService
  }
}
```

You can wire dependencies in a small `src/container.ts` or `src/index.ts` (e.g. instantiate repos once, then services, then controllers). No need for a heavy DI framework at the start.

### 2. DTOs and validation at the edge

- Use **shared-types** for domain types and API contracts.
- Validate request body/query in the **route** or **controller** with Zod (or similar) and map to DTOs.
- Controllers and services work with DTOs and domain types, not raw `req.body`.

### 3. Error handling middleware

- Use a single **error middleware** that catches errors from controllers/services.
- Map domain errors (e.g. “insufficient budget”, “meal not found”) to HTTP status codes and a consistent JSON shape (e.g. `{ error: string, code?: string }`).

### 4. Auth middleware

- **Auth middleware** should: verify token/session, attach `userId` (or user object) to `req`, then call `next()`.
- Controllers/services receive `userId` and never touch raw tokens. Keeps auth in one place.

---

## What to avoid

- **Putting business logic in controllers** — keep it in services so it can be reused and tested without HTTP.
- **Controllers or services importing the DB or schema directly** — data access goes through `@repo/database` repositories only.
- **Skipping the service layer** — even “simple” CRUD benefits from a service layer for validation, events, or future logic.

---

## Summary

| Pattern                  | Use it for                                                 |
| ------------------------ | ---------------------------------------------------------- |
| **Layered architecture** | Routes → Controllers → Services → Repositories             |
| **Repository pattern**   | All DB access in `packages/database`, consumed by services |
| **Constructor DI**       | Inject repos (and services) into services                  |
| **DTOs + validation**    | At route/controller boundary (e.g. Zod)                    |
| **Middleware**           | Auth (attach user), global error handling                  |

This keeps the API consistent with your existing plan, works well with Neon + Drizzle and shared-types, and stays simple enough to extend (e.g. add a new “meal suggestion” or “budget alert” service) without refactoring the whole backend.

---

## Admin / Scraper API (restaurants & menus)

For **adding/updating/deleting restaurants and menu items**, both the **scraper** (service-to-service) and a future **admin dashboard** (human user) should use the same API. This avoids duplicating schema or business logic.

### 1. Route structure: prefix `/api/admin`

Keep **read** endpoints public (or optionally authenticated) under existing paths; put **write** operations under a dedicated admin prefix so it's clear what is protected.

| Method     | Path                                                          | Purpose                                  | Used by           |
| ---------- | ------------------------------------------------------------- | ---------------------------------------- | ----------------- |
| GET        | `/api/restaurants`                                            | List (existing)                          | App, admin        |
| GET        | `/api/restaurants/:id`                                        | Get one (existing)                       | App, admin        |
| GET        | `/api/restaurants/:id/menu`                                   | Get menu (existing)                      | App, admin        |
| **POST**   | **`/api/admin/restaurants`**                                  | Create restaurant                        | Scraper, admin UI |
| **PATCH**  | **`/api/admin/restaurants/:id`**                              | Update restaurant                        | Scraper, admin UI |
| **DELETE** | **`/api/admin/restaurants/:id`**                              | Delete restaurant (cascades to menu)     | Scraper, admin UI |
| **POST**   | **`/api/admin/restaurants/:id/menu-items`**                   | Create menu item(s) (body: one or array) | Scraper, admin UI |
| **PATCH**  | **`/api/admin/restaurants/:restaurantId/menu-items/:itemId`** | Update menu item                         | Scraper, admin UI |
| **DELETE** | **`/api/admin/restaurants/:restaurantId/menu-items/:itemId`** | Delete menu item                         | Scraper, admin UI |

- **Mount:** e.g. `app.use("/api/admin", adminOrScraperMiddleware, adminRoutes)` so every admin route is protected by the same guard.

#### Scheduled jobs (`/api/cron/*`)

There is no in-process worker/scheduler tier, so recurring jobs are exposed as HTTP endpoints and driven by an **external scheduler** (Vercel/Cloudflare cron, a GitHub Actions cron, cron-job.org, …). These live under their **own `/api/cron` prefix**, separate from `/api/admin` — a cron runner is a single-purpose machine caller, so it gets a dedicated least-privilege secret (`CRON_SECRET`, sent as `X-Cron-Secret: <value>`) rather than the full-trust `ADMIN_API_KEY`. When `CRON_SECRET` is unset the endpoints return 503 (closed by default). See `cron.middleware.ts` / `cron.routes.ts`.

| Method   | Path                           | Purpose                                                              | Used by       |
| -------- | ------------------------------ | -------------------------------------------------------------------- | ------------- |
| **POST** | **`/api/cron/digests/weekly`** | Email a "spent X of Y" progress digest to every eligible active plan | External cron |

The weekly digest picks up active plans whose owner has a verified email and whose date window includes today, computes plan-to-date + trailing-7-day figures, and sends one email each; the response is `{ total, sent, skipped, failed }`. Each send is isolated, so one bad recipient never aborts the batch. It is **idempotent within a week**: each plan carries a `last_weekly_digest_sent_at` marker (stamped only after a confirmed send) and a plan sent inside the ~6-day cooldown is skipped, so a cron misfire or manual re-trigger never double-emails.

### 2. Authorization: two ways to access admin routes

Only two callers should be allowed: the **scraper** (automated) and **admin users** (dashboard).

| Caller              | How they authenticate                                                                           | How the API checks                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Scraper**         | API key in header, e.g. `X-API-Key: <ADMIN_API_KEY>` or `Authorization: Bearer <ADMIN_API_KEY>` | Env var `ADMIN_API_KEY`; if header matches, treat as trusted service and allow.      |
| **Admin dashboard** | User logs in → receives JWT (same auth as app).                                                 | JWT middleware + **role**: only users with `role === "admin"` can call admin routes. |

So: **one middleware** (e.g. `requireAdminOrService`) that:

1. If `X-API-Key` (or chosen header) equals `process.env.ADMIN_API_KEY` then `next()` (scraper).
2. Else, run normal JWT auth; load user (or attach `role` to JWT payload); if `role === "admin"` then `next()`.
3. Else respond with `403 Forbidden`.

### 3. User schema: add `role`

- Add a **`role`** field to `users` (e.g. `text`, default `'user'`, or enum `'user' | 'admin'`).
- When issuing JWTs for login, include `role` in the payload (or look it up in middleware) so the admin middleware can allow/deny without an extra DB hit every time if you prefer to embed role in the token.
- One (or a few) users are set to `admin` via seed or manual DB update; admin dashboard login uses the same `/api/auth/login` and then only admins can call `/api/admin/*`.

### 4. Implementation layout (api)

- **Middleware:** `middleware/admin.middleware.ts` — `requireAdminOrService(req, res, next)`: check API key first, then JWT + admin role.
- **Routes:** `routes/admin.routes.ts` (or `admin/restaurants.routes.ts` + `admin/menu-items.routes.ts` under one router) — mount at `/api/admin`, use the admin middleware, then define POST/PATCH/DELETE for restaurants and menu items.
- **Controllers:** e.g. `controllers/admin-restaurant.controller.ts`, `controllers/admin-menu.controller.ts` — parse body/params with Zod, call services, return JSON.
- **Services:** extend or add `restaurant.service` / `menu.service` (or admin-specific) for create/update/delete; use existing `restaurantRepository` and `menuRepository`. Repositories may need a `delete` for restaurant (and possibly menu item) if not already present.
- **Validation:** Zod schemas live in `packages/shared/src/validation.ts` (import from `@repo/shared`) and API-specific helpers can go in `lib`.

### 5. Summary

| Piece               | What to do                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Routes**          | All write operations under `/api/admin/*`, guarded by one middleware.                               |
| **Auth**            | Scraper: API key. Admin UI: same login as app, but only `role === 'admin'` can access admin routes. |
| **Schema**          | Add `role` to `users`; default `'user'`, set some to `'admin'`.                                     |
| **Middleware**      | `requireAdminOrService`: API key OR JWT with admin role.                                            |
| **Scraper / Admin** | Both call the same REST endpoints; no separate "scraper-only" or "admin-only" API.                  |

This gives you a single, consistent structure for both the scraper and the future admin dashboard, with a clear place to add more admin-only endpoints later (e.g. managing users, feature flags) under the same prefix and middleware.
