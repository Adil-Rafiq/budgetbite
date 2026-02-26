# BudgetBite — Tech Stack

This document defines the technologies used for the BudgetBite project. Everything is chosen to work on **free tiers** only; no paid subscriptions. Scale is not a concern (personal project).

---

## Summary table

| Area                   | Choice                                                 | Free tier / notes                                           |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| **Backend**            | Node.js + TypeScript + Express                         | Free, open source                                           |
| **Frontend**           | Next.js (React) + TypeScript                           | Free, open source                                           |
| **Database**           | Neon (Postgres) + Drizzle                              | Neon free tier; Drizzle free                                |
| **Auth**               | NextAuth.js (frontend) + JWT/session validation in API | Free; OAuth apps free for Google/GitHub                     |
| **AI**                 | Google AI (Gemini)                                     | Free tier; **no credit card required** for API key (see §5) |
| **Validation**         | Zod                                                    | Free                                                        |
| **Push notifications** | Optional: OneSignal or FCM                             | Free tiers; or defer / email only                           |
| **Scraper**            | Python + Playwright (existing)                         | Free                                                        |
| **Hosting** (later)    | Vercel (web + API) or Vercel + Railway                 | Free tiers                                                  |

---

## 1. Backend (`apps/api`)

| Layer               | Technology                                                                                                                                          | Why                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**         | Node.js 22 LTS                                                                                                                                      | Matches monorepo; good TS support.                                                                                                                  |
| **Language**        | TypeScript                                                                                                                                          | Already in repo; shared types with frontend.                                                                                                        |
| **Framework**       | **Express**                                                                                                                                         | You're already familiar with it; huge ecosystem and docs. Same layered design (routes → controllers → services) works the same. Validation via Zod. |
| **Database client** | **Drizzle ORM**                                                                                                                                     | Already in `packages/database`; type-safe, works with Neon.                                                                                         |
| **Database**        | **Neon** (serverless Postgres)                                                                                                                      | Free tier: 0.5 GB storage, 190 compute hours/month. Sufficient for personal use.                                                                    |
| **Validation**      | **Zod**                                                                                                                                             | Validate request body/query at API edge; share schemas with frontend if needed.                                                                     |
| **Auth (API side)** | Validate **JWT** or **session** from NextAuth; no duplicate login logic in API. NextAuth runs in Next.js and issues JWT/session; API only verifies. |

**Auth flow (recommended):** NextAuth in the Next.js app handles login (email/password + Google/GitHub). It issues a JWT (or session cookie). The API receives `Authorization: Bearer <token>` and validates the token (e.g. with NextAuth’s JWT secret or a shared secret). No need for Passport or duplicate OAuth in the API — keeps one place for auth and free tier.

---

## 2. Frontend (`apps/web`)

| Layer                       | Technology                       | Why                                                                  |
| --------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| **Framework**               | **Next.js** (App Router)         | Already in structure; SSR, API routes if needed, good DX.            |
| **Language**                | TypeScript                       | Shared types with API via `@budgetbite/shared-types`.                |
| **Styling**                 | **Tailwind CSS**                 | Utility-first, fast to build UI, no cost.                            |
| **UI components**           | **shadcn/ui** (Radix-based)      | Copy-paste components, accessible, no runtime fee. Use as needed.    |
| **Auth**                    | **NextAuth.js**                  | Handles email/password + Google + GitHub OAuth, sessions, JWT. Free. |
| **Server state / fetching** | **TanStack Query (React Query)** | Caching, loading states, refetch; free.                              |
| **Forms**                   | **React Hook Form** + **Zod**    | Validation aligned with API; free.                                   |

---

## 3. Database

| Item                 | Choice                                         | Why                                                        |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **Host**             | **Neon**                                       | Serverless Postgres, free tier, works well with Drizzle.   |
| **ORM / migrations** | **Drizzle** in `packages/database`             | Schema in code, migrations via Drizzle Kit. Shared by API. |
| **Connection**       | `DATABASE_URL` in env (Neon connection string) | Standard; no extra services.                               |

---

## 4. Auth (end-to-end)

| Concern              | Technology                                               | Free tier                                           |
| -------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| **Provider**         | **NextAuth.js** in Next.js app                           | Open source.                                        |
| **Strategies**       | Credentials (email/password), Google OAuth, GitHub OAuth | Google/GitHub OAuth apps are free for standard use. |
| **Session**          | JWT (or database session)                                | NextAuth config; no extra cost.                     |
| **API**              | API middleware verifies JWT (same secret as NextAuth)    | No extra service.                                   |
| **Password hashing** | bcrypt (via NextAuth or custom Credentials provider)     | Free.                                               |

No Auth0/Clerk/etc. required — keeps everything free and simple.

---

## 5. AI (meal suggestions)

Requirements: generate meal plans and “3 options per meal slot” using budget, location, menu data, and feedback.

**Chosen: Google AI (Gemini)**

| Item            | Detail                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Service**     | Google AI Studio — Gemini API                                                                                                                                                                                            |
| **Free tier**   | Yes. Rate limits apply (e.g. 15 req/min for Gemini 2.0 Flash; see [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)).                                                                                     |
| **Credit card** | **Not required** to obtain or use an API key on the free tier. Sign in at [aistudio.google.com](https://aistudio.google.com) with a Google account → "Get API key" → create key. No billing setup needed for free usage. |
| **SDK**         | `@google/generative-ai` in the backend. Env: `GEMINI_API_KEY`.                                                                                                                                                           |

Alternatives if you switch later: **Groq** (free tier, no card) or **Ollama** (local, no key).

---

## 6. Push notifications (optional)

Requirements: store notification timings; send reminders to choose/order meals. Can be deferred.

| Option | Service                                                      | Free tier                                       |
| ------ | ------------------------------------------------------------ | ----------------------------------------------- |
| **A**  | **OneSignal**                                                | Free tier (e.g. 10k subscribers).               |
| **B**  | **Firebase Cloud Messaging (FCM)**                           | Free.                                           |
| **C**  | **Email only** (e.g. Resend free tier or Nodemailer + Gmail) | No push; simpler.                               |
| **D**  | **Defer**                                                    | Store timings in DB only; implement push later. |

**Recommendation:** Store notification preferences in the API from day one. Implement **email reminders** first (free, no app install). Add push (OneSignal or FCM) later if needed.

---

## 7. Scraper (existing)

| Item        | Technology                | Notes                                                                              |
| ----------- | ------------------------- | ---------------------------------------------------------------------------------- |
| **Runtime** | Python 3.x                | Already in `apps/scraper`.                                                         |
| **Browser** | Playwright + SeleniumBase | Already used.                                                                      |
| **Output**  | JSON / DB                 | Scraper can write to Neon via a small script or separate pipeline; API only reads. |

No change to stack; scraper stays as-is. Ensure scraped data includes **restaurant lat/long** for proximity (per REQUIREMENTS).

---

## 8. Monorepo / shared

| Package                         | Role                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| **`packages/database`**         | Drizzle schema, migrations, repositories (Neon). Used by `apps/api`.         |
| **`packages/shared-types`**     | TypeScript types (user, restaurant, meal, order, etc.). Used by API and web. |
| **`packages/utils`** (if added) | e.g. Haversine for distance (km), date/currency helpers.                     |

---

## 9. Hosting (when you deploy)

All free tiers; no scale requirements.

| App               | Suggestion                                                    | Free tier                                                 |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| **Next.js (web)** | **Vercel**                                                    | Free hobby tier.                                          |
| **API**           | **Vercel** (serverless functions) or **Railway** / **Render** | Vercel: same repo; Railway/Render: free tier with limits. |
| **Database**      | **Neon**                                                      | Already chosen; free tier.                                |
| **Scraper**       | Run **locally** or cron on your machine                       | No need to host; not for real users.                      |

---

## 10. Development

| Tool                | Choice                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Package manager** | npm (already in use)                                                                                                         |
| **Linting**         | ESLint (already)                                                                                                             |
| **Formatting**      | Prettier (already)                                                                                                           |
| **Env**             | `.env` for `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`, `GEMINI_API_KEY` or `GROQ_API_KEY`, etc. |

---

## 11. What we’re not using (to stay free)

- No **Auth0**, **Clerk**, **Supabase Auth** (NextAuth is free and sufficient).
- No **OpenAI paid** (use Gemini/Groq/Ollama).
- No **Twilio** or paid SMS (email only for reminders if needed).
- No **Redis** for now (optional later for caching; not required for personal use).
- No **Stripe** or payments in v1 (per REQUIREMENTS).

---

## 12. Next steps

1. **Set up `apps/api`** — Express, Drizzle client, Zod, JWT validation middleware, Gemini SDK.
2. **Set up `apps/web`** — Next.js, NextAuth, Tailwind, shadcn/ui (optional).
3. **Set up `packages/database`** — Schema (users, restaurants, menus, plans, orders, feedback), migrations, repositories.
4. **Env** — Create `.env.example` with `DATABASE_URL`, `NEXTAUTH_*`, OAuth credentials, `GEMINI_API_KEY`.

Once this is locked in, implementation can follow `apps/api/DESIGN.md` and `apps/api/REQUIREMENTS.md`.
