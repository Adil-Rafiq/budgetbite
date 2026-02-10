# apps/api — Backend Design Pattern

This document recommends a design pattern for the BudgetBite API that fits the monorepo, aligns with `structure.md`, and keeps the codebase testable and maintainable.

---

## Recommended: **Layered architecture + repository pattern**

Use a **layered architecture** with clear boundaries and the **repository pattern** for data access. Your `structure.md` already follows this; here’s how to apply it consistently.

### Layers (top → bottom)

| Layer        | Responsibility              | Depends on        | In your app              |
|-------------|-----------------------------|-------------------|---------------------------|
| **Routes**  | HTTP mapping, validation    | Controllers       | `routes/*.routes.ts`     |
| **Controllers** | Request/response, status codes | Services      | `controllers/*.controller.ts` |
| **Services**    | Business logic, orchestration | Repositories, shared-types | `services/*.service.ts` |
| **Repositories**| Data access (DB)            | Schema, DB client | `packages/database`      |

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
    private budgetService: BudgetService
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
- **Controllers or services importing the DB or schema directly** — data access goes through `@budgetbite/database` repositories only.
- **Skipping the service layer** — even “simple” CRUD benefits from a service layer for validation, events, or future logic.

---

## Summary

| Pattern               | Use it for                                              |
|-----------------------|---------------------------------------------------------|
| **Layered architecture** | Routes → Controllers → Services → Repositories          |
| **Repository pattern**  | All DB access in `packages/database`, consumed by services |
| **Constructor DI**      | Inject repos (and services) into services               |
| **DTOs + validation**   | At route/controller boundary (e.g. Zod)                 |
| **Middleware**          | Auth (attach user), global error handling               |

This keeps the API consistent with your existing plan, works well with Neon + Drizzle and shared-types, and stays simple enough to extend (e.g. add a new “meal suggestion” or “budget alert” service) without refactoring the whole backend.
