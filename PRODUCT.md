# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** An individual in Pakistan who wants to control their weekly or monthly food spending and still eat what they choose. They face the recurring decision of "what do I order for this meal" while trying not to blow a food budget, and they order takeout/delivery often enough that it adds up.

**Situation:** They plan a budget for a period, then day by day — around meal times — decide what to eat, order it themselves (on Foodpanda), and log what they actually spent. Planning and analytics tend to happen on a larger screen; daily meal choices and spend-logging happen on a phone, on the go. Both contexts matter equally.

Single user per account. No households, shared budgets, multi-tenant, or B2B roles in scope.

## Product Purpose

BudgetBite helps a user plan and stick to a weekly or monthly food budget by suggesting meals from **real, nearby restaurant menus** that fit the budget, using AI. For each meal slot (e.g. breakfast, lunch, dinner) it presents three options to choose from. The user orders themselves and logs the **actual amount spent**; the app deducts it from the remaining budget and re-plans the rest of the period from that reality plus the user's feedback.

**Success:** the user stays within their food budget across the period, with less friction deciding what to eat, while still eating meals they picked — not meals imposed on them.

## Positioning

The distinctive mechanism is a **budget-adherence loop over real, orderable delivery menus, without the app ever ordering**:

- Suggestions are grounded in **actual nearby restaurant menus** (scraped from Foodpanda Pakistan), filtered by proximity, not generic recipes.
- The constraint is the user's **real remaining budget**, and the source of truth is the user's **logged actual spend** — not estimated menu prices, which are treated as best-effort.
- The app **deliberately does not place orders**. It plans; the user orders; the app re-plans from what actually happened.

A recipe meal-planner has no orderable prices or budget ledger; a food-delivery app has ordering but no budget discipline or re-planning loop. Neither could truthfully copy this position.

## Operating Context

- **Data source:** Foodpanda Pakistan restaurants and menus, populated by a scraper (`apps/scraper`); the API only reads this data. Restaurant rows carry their own latitude/longitude.
- **Proximity:** the user's residence lat/long is compared against each restaurant's lat/long via Haversine distance, in **kilometres**, within a configurable radius (e.g. 5 / 10 / 15 km). Only restaurants within radius are browsable and eligible for suggestions.
- **Money:** currency is **PKR**; budgets are set per **weekly or monthly** period.
- **Rhythm:** daily use is organized around meal slots and user-configured notification times. Notification _preferences_ are persisted; actual push/email delivery is not yet wired up.
- **Cross-device:** desktop for setup, planning, and analytics; mobile for daily meal choices and logging spend. The product must work fully on both — neither is the "real" version.
- **External step:** ordering happens outside the app on Foodpanda; the user then returns to record the actual amount spent.

## Capabilities and Constraints

**Confirmed capabilities**

- **Auth:** email + password (with email-OTP verification), plus Google and GitHub OAuth. Sessions via cookie.
- **Profile:** name, email, and residence latitude/longitude.
- **Restaurants & menus:** browse and filter (cuisine, delivery time, price range, proximity in km); view menus, prices, delivery fees, minimum order.
- **Budget plans:** create weekly/monthly plans with a total budget, meals per day, meal types, and notification times; view active plan and history.
- **AI meal planning:** generate a plan that respects budget, remaining budget, location, meals/day, and menu data; present **three options per slot** (name, description, price, delivery fee, restaurant).
- **Choices & tracking:** choose one option, or enter a **manual meal** (custom description + amount) when dining out; log the **actual amount spent**; submit optional feedback (like/dislike, rating, or tags) that improves future suggestions.
- **Re-planning:** remaining budget and feedback feed later suggestions for the same plan; re-planning is triggered when cumulative deviation from budget crosses a configured threshold.
- **Analytics:** spending by day/week/month, breakdown by meal type or restaurant, and plan-adherence history.
- **Admin surface:** restaurant/menu, data-quality, config, and audit-log management, gated by an `admin` role or a service API key (used by the scraper).

**Constraints / explicitly out of scope (v1)**

- No automatic ordering on Foodpanda or any platform — the app never orders.
- No in-app payments or subscriptions.
- No real-time delivery/order-status tracking.
- No multi-user households or shared budgets (one user per account).
- No native mobile app; web-first, responsive (PWA acceptable) is the target.
- Displayed prices (DB or AI estimate) are **best-effort and not guaranteed**; the logged actual spend is authoritative.

**Terminology:** budget plan, meal plan, meal slot, meal option, meal choice / order, manual meal, remaining budget, re-plan, proximity radius, feedback.

## Brand Commitments

- **Name:** "BudgetBite" (binding).
- No other brand assets — logo, palette, typography, or defined voice — were declared fixed during init. An incumbent visual world exists in `apps/web`, but it is treated as evidence, not a locked commitment; voice and personality are **undecided**.

## Evidence on Hand

- **Product & architecture docs:** `apps/api/REQUIREMENTS.md` (product spec), `TECH-STACK.md` (stack rationale), `CLAUDE.md`, `apps/api/DESIGN.md`.
- **Real data pipeline:** `apps/scraper` scrapes real Foodpanda Pakistan restaurants and menus, including coordinates for proximity.
- **Seed / demo data:** `packages/database/src/seed` produces `seed-` restaurants and a `demo@budgetbite.dev` user with a completed plan (usable for realistic screens without inventing content).
- **Absences to respect:** there are no real end users, testimonials, customers, press, ratings, or usage metrics yet. Future work must not fabricate these.

## Product Principles

1. **Budget adherence is the product.** Remaining budget and plan progress must stay legible on every surface, and suggestions must respect the real remaining money — not just the total.
2. **Ground everything in reality.** Only nearby, actually-orderable menu items are suggested; prices are shown as best-effort estimates, never guarantees.
3. **The user acts; the app learns.** The app never orders. Logged actual spend and explicit feedback are the source of truth and drive re-planning.
4. **Reduce decision friction.** Three clear options per slot, plus a fast manual-entry escape hatch. Choosing what to eat should feel quick, not like data entry.
5. **Honest money UI.** PKR amounts and totals must be exact and unambiguous across desktop and mobile — no misleading precision, no numbers that drift from what was actually spent.
