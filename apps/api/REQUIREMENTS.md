# BudgetBite — Product & API Requirements

This document defines the purpose, scope, user flows, and functional requirements for the BudgetBite application and its API. It is the single source of truth before implementation.

---

## 1. Purpose & Vision

**BudgetBite** helps users plan and stick to a **weekly or monthly food budget** by:

- Suggesting **meals from real restaurant menus** (e.g. Foodpanda and others) that are **near the user’s location** and within their budget.
- Using **AI** to generate **meal plans** and **three options per meal slot** (e.g. breakfast, lunch, dinner) so the user can choose one.
- **Tracking spending** and letting users **log actual amounts spent** so the app can adjust suggestions for the rest of the plan.
- Supporting **manual meal entry** when the user dines out or orders something not suggested.
- **Learning from feedback** so future suggestions better match the user’s taste.

The app does **not** place orders automatically; users order themselves (e.g. on Foodpanda). The API and web app focus on planning, suggestions, tracking, and analytics.

---

## 2. Users

- **Primary:** Individuals who want to control food spending and get structured meal suggestions (weekly/monthly plans).
- **Needs:** Location-based restaurant/menu data, budget limits, meal slots per day, push notification timings, and simple analytics.

No multi-tenant or B2B roles in scope for v1.

---

## 3. Core Features

### 3.1 User & profile

- **User-based access:** All data is scoped to a logged-in user.
- **Profile fields:**
  - First name, last name
  - Email (used for auth and optionally notifications)
  - **Residence location:** latitude and longitude (used to suggest only nearby restaurants/meals)
- **Auth:**
  - **Email + password** (register, login, password reset flow).
  - **OAuth:** Google and GitHub only.
  - Session/token handling so the API can identify the user on each request.

### 3.2 Restaurants & menus

- **Display** list of restaurants and their menus (name, items, prices, delivery fee, minimum order, etc.).
- **Source of data:** Foodpanda (and optionally other sources) — populated via scraper; API reads from DB.
- **Restaurant location:** Each restaurant has its **own latitude and longitude** (stored in DB). The user has their **own latitude and longitude** (residence). Proximity is determined by comparing these two points (see § 3.2.1).
- **Filtering:** e.g. by cuisine, delivery time, price range, and **proximity (distance in km)**. Filters are applied when listing restaurants and when AI suggests meals.
- **Vibe:** Functionality similar to foodpanda.pk (browse, filter, see menus/prices), but design can differ.

### 3.2.1 Proximity (distance in km)

- **Mechanism:** Suggest or filter restaurants that lie within a **configurable distance (in kilometres)** of the user.
  - **Inputs:** User’s latitude/longitude (from profile), each restaurant’s latitude/longitude (from DB).
  - **Output:** Only restaurants whose distance from the user is **≤** the chosen radius (e.g. 5 km, 10 km).
- **Distance calculation:** Use a standard formula for distance between two lat/long points (e.g. **Haversine**). Distance is always expressed and configured in **kilometres (km)**.
- **Where it applies:**
  - Listing/browsing restaurants: optional filter “within X km” (default or user preference).
  - AI meal suggestions: only consider restaurants within the user’s proximity radius so suggested meals are orderable/deliverable to them.
- **Configurable radius:** The “max distance in km” can be a user preference (e.g. 5 / 10 / 15 km) or an app-wide default; API must support passing or storing this value and filtering by it.

### 3.3 Budget & plan setup

- User selects **plan type:** weekly or monthly.
- User enters **total budget** for that period (e.g. PKR for the week/month).
- User sets **number of meals per day** (e.g. 2 or 3) and which **meal types** (e.g. breakfast, lunch, dinner).
- User configures **push notification timings** (when to be reminded to choose/order meals). Stored per user; sending is implementation detail (e.g. cron + provider).

### 3.4 AI meal planning & suggestions

- For the selected plan (weekly/monthly), **AI generates a meal plan** that respects:
  - User’s budget and remaining budget
  - User’s location (only nearby restaurants)
  - Number of meals per day and meal types
  - Menu data (items, prices, delivery charges) from the DB
- For **each meal slot**, the app presents **three meal options** (e.g. different restaurants/items) with:
  - Name, description, price, delivery fee (if any), restaurant name
- User **chooses one** of the three (or none; see “Manual meal entry” below).
- Prices shown may come from DB or AI estimates; they are **not guaranteed** (real price may differ at order time).

### 3.5 Ordering & tracking (user responsibility)

- **No automatic ordering.** User orders the chosen meal themselves (e.g. on Foodpanda).
- After ordering, user **enters the actual amount spent** for that meal so the app can:
  - Deduct from the plan’s remaining budget
  - Use the real amount for **adjustments** in later suggestions for the same plan
- **Manual meal entry:** User can skip all three suggestions and **add a custom meal** (e.g. dined out with friends):
  - Enter details: description, amount spent, optional restaurant name, date/meal slot.
  - This is treated as part of the plan and included in budget tracking and analytics.

### 3.6 Feedback for AI

- After the user **chooses one of the three suggested options**, they can **submit feedback** (e.g. liked / didn’t like / rating or tags).
- This feedback is stored and used to **improve future AI suggestions** (e.g. prefer similar cuisines or price ranges, avoid disliked items).

### 3.7 Analytics & history

- **Track:**
  - All meals (suggested + chosen, or manually entered)
  - Budget: planned vs spent per day/week/month
  - Orders and amounts over time
- **Expose** (for dashboard/reports):
  - Spending by period (day/week/month)
  - Breakdown by meal type or restaurant (if available)
  - History of meal choices and plan adherence

---

## 4. User Flows (high level)

### 4.1 Registration & onboarding

1. User lands on app and chooses **Sign up** (email/password or Google/GitHub).
2. After auth, **profile creation/update:** first name, last name, residence lat/long (and email if not from OAuth).
3. Optional: prompt to set up first budget plan (redirect to “Budget & plan setup”).

### 4.2 Budget & plan setup

1. User selects **plan type:** weekly or monthly.
2. User enters **total budget** for the period.
3. User sets **meals per day** and **meal types** (e.g. breakfast, lunch, dinner).
4. User sets **notification times** (e.g. 8:00, 13:00, 19:00).
5. System **saves plan** and (optionally) triggers first AI meal plan generation for the period.

### 4.3 Daily usage (per meal slot)

1. At (or before) notification time, user opens app and sees **today’s meal slots**.
2. For a given slot (e.g. lunch), user sees **three AI-suggested options** with price and details.
3. User either:
   - **Chooses one** → can optionally enter **actual amount spent** and **feedback** for AI; or
   - **Skips** and **adds a manual meal** (description + amount spent).
4. Remaining budget and plan progress update; next suggestions (for the same plan) take updated budget and feedback into account.

### 4.4 Plan lifecycle

1. **Plan start:** User has an active plan (weekly or monthly) with a defined budget and end date.
2. **During plan:** User receives suggestions, makes choices, logs spending and optional manual meals.
3. **Plan end:** Plan is closed; user can view summary and create a new plan (same or different type/budget).

### 4.5 Analytics & history

1. User opens **dashboard / analytics**.
2. Views spending over time, breakdown by period/meal type, history of meals and plans.
3. (Optional) Export or share is out of scope for v1 unless explicitly added later.

---

## 5. Auth (API perspective)

- **Email + password:** Register (email, password, name), login (email, password), logout. Forgot-password flow (email link or token) to be implemented.
- **OAuth (Google, GitHub):** Initiate OAuth flow from frontend; backend receives callback or token, creates/updates user, issues session/JWT.
- **Session/identity:** Every protected endpoint receives a token or session id; API resolves to **user id** and attaches to request. Profile, plans, meals, and analytics are all scoped by this user id.

---

## 6. Data & entities (API / DB)

Conceptual entities the API and DB must support:

| Entity                  | Purpose                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**                | Identity, profile (name, email, **lat/long** for residence), auth linkage                                                                                                           |
| **Restaurant**          | Name, **latitude, longitude**, external id (e.g. Foodpanda), metadata (e.g. address for display). Proximity to user is computed from user lat/long and restaurant lat/long (in km). |
| **Menu / MenuItem**     | Items per restaurant: name, price, category, delivery fee, etc.                                                                                                                     |
| **Budget plan**         | User, plan type (weekly/monthly), total budget, start/end date, meals per day, meal types, notification preferences                                                                 |
| **Meal plan**           | Generated for a budget plan: suggested meals per slot (e.g. 3 options per slot)                                                                                                     |
| **Meal choice / Order** | User’s selection for a slot: chosen option or manual entry, actual amount spent, date/slot, link to suggestion if any                                                               |
| **Feedback**            | User feedback on a chosen suggestion (rating/like/dislike, etc.) for AI learning                                                                                                    |
| **Analytics**           | Derived from orders and plans (spending per period, breakdown); can be computed on read or materialized                                                                             |

(Exact schema and table names can be defined in `packages/database` when building.)

---

## 7. API scope (what the backend must provide)

The API should expose at least:

- **Auth:** register, login, logout, OAuth callback/link, forgot-password (if applicable).
- **User:** get/update profile (including lat/long).
- **Restaurants & menus:** list restaurants (with filters, including **proximity: max distance in km** from user’s lat/long), get restaurant by id, get menu for restaurant. Optionally return distance (km) per restaurant when listing.
- **Budget plans:** create, get active, get history, update (e.g. budget or notification times).
- **Meal suggestions:** generate/refresh suggestions for a plan (AI); get suggestions for a given day/slot.
- **Meal choices / orders:** record chosen option or manual meal, record actual amount spent, optional feedback.
- **Analytics:** get spending summary (by day/week/month), get meal/order history (with filters).

Middleware: auth (resolve user), validation (body/query), error handling. See `DESIGN.md` for layered structure.

---

## 8. Non-functional & technical notes

- **Location:** User has stored **lat/long** (residence); each **restaurant** has stored **lat/long**. Proximity is computed in **kilometres** (e.g. Haversine) and used to filter/suggest restaurants within a configurable radius (e.g. 5 / 10 km). No real-time GPS required from API for v1.
- **AI:** Integration point (e.g. OpenAI or other) for generating meal plans and three-options-per-slot; prompt should use budget, location, menu data, and past feedback.
- **Notifications:** Timings and preferences stored by API; actual push delivery can be a separate job (cron + FCM/OneSignal/etc.) that uses API or DB.
- **Prices:** Stored prices and AI estimates are best-effort; “actual amount spent” is the source of truth for tracking and adjustments.
- **Scraper:** Populates restaurants and menus; API only reads. No requirement for API to trigger scrapes in v1 (can be manual or separate pipeline).

---

## 9. Out of scope (v1)

- **Automatic ordering** on Foodpanda or any platform.
- **Real-time delivery status** or order tracking on external platforms.
- **Multi-user households** or shared budgets (single user per account).
- **In-app payments** (e.g. subscriptions); can be added later.
- **Native mobile app** (web-first; responsive and PWA are in scope if desired).

---

## 10. Future enhancements (optional, not committed)

- More OAuth providers (e.g. Apple, Facebook).
- Multiple addresses per user and “current location” for suggestions.
- Dietary preferences and allergens in profile and AI prompts.
- Recurring default plans (e.g. “every Monday start a new weekly plan”).
- Export of analytics (CSV/PDF).
- Email digests (e.g. weekly summary) in addition to push.

---

## 11. Document history

- **Initial:** Product and API requirements documented here.
- **Next step:** Use this document and `DESIGN.md` to implement the API and database schema.
