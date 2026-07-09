# TODO

## In Progress

## Up Next

- [ ] Fix budget generating suggestions for a generation
- [ ] In scraper, write the failed restaurants to a log file so that they can be added one by one or manually
- [ ] There's a mismatch between web and api better-auth setup
- [ ] After log-in the user should go to /onboarding if their profile is not set yet
- [ ] Integrate a logger

## Backlog

- [ ] "Cook at home": AI-suggested cost estimate — pre-fill the home-cooked cost with a small self-contained estimate (heuristic or a tiny LLM call) for the meal type, on top of the user-entered value shipped below
- [ ] Weekly email digest via Resend (spent X of Y, week summary)
- [ ] OpenAPI docs auto-generated from the Zod schemas in `@repo/shared` (e.g. `zod-openapi`), served as interactive docs at `/api/docs`
- [ ] Integrate [Three Js](#threejs.org) and [GSAP](#gsap.com). [GSAP](#gsap.com) has a cool [design](#planetono.space)
- [ ] Push notifications - can leverage pubsub model using pg triggers. See [video](#https://www.youtube.com/watch?v=4-Z_I4SwgJQ)
- [ ] Calories statistics / Diet Planning

## Done

- [x] "Cook at home" meal logging (user-entered cost): a first-class home-cooked meal choice per slot, distinct from restaurant orders. New `is_home_cooked` column on `meal_choice` (migration `0017_naive_dust.sql` — run `pnpm db:migrate` to apply); home-cooked rows carry no suggestion/restaurant/menu-item link (server strips them) so they never count toward suggestion-adherence or the favorite-restaurant summary. Threaded `isHomeCooked` through `recordMealChoiceSchema`, `mealChoiceResponseSchema`, `planTimelineLoggedChoiceSchema`, the order-repo projections, and the timeline builder. Web: a "Cook at home" entry in the slot dialog + a dedicated `HomeCookedForm` (optional dish name, user-entered ingredient/cooking cost, feedback), and a "🍳 Cooked at home" label on the dashboard slot cards, recent-activity list, and plan timeline. AI-suggested cost estimate deferred (see Backlog).
- [x] Favorites & never-again lists: persistent, user-managed favorites (restaurants + dishes) and block list on a new normalized `user_food_preference` table (one row per user/target, restaurant xor menu-item, favorite|blocked). `GET/POST/DELETE /api/food-preferences`. Context-builder unions blocked-restaurant ids with the AI-learned `dislikedRestaurantIds` (hard exclusion), drops blocked dishes from each menu, and flags favorites (`isFavorite`) on the nearby context; the meal-planner prompts (generate/replan/reroll) render a Favorites section + ⭐ markers and a soft-bias rule (favorites never override budget/dietary/allergen constraints). Web: reusable `FoodPreferenceToggle` (heart/ban) on the restaurant detail header + each dish card, plus a "Favorites & blocks" management card on the profile page. Migration `0016_quick_catseye.sql` (run `pnpm db:migrate` to apply)
- [x] Plan-end summary (saved/overspent, adherence to AI suggestions, favorite restaurant) via `GET /api/budget-plans/:id/summary`, shown on the plan detail page once a plan is completed/cancelled, plus a one-click "start next plan" that reuses the finished plan's type/budget/meal types/notification times. True cron-based recurring plans deferred — no worker/scheduler tier exists yet.
- [x] Learn from actual-vs-listed price gap: per-restaurant paid-vs-suggested ratio learned from logged choices (90-day window, outlier bounds, all users), applied as a shrunk-and-capped padding factor to menu prices in the AI planner context; restaurants list & detail pages show "prices updated N days ago"
- [x] Seed/demo data script (`pnpm db:seed`): fixture restaurants + menu items around the scraper's Lahore location, plus a verified demo user (`demo@budgetbite.dev`) with a completed weekly plan (succeeded generation, logged choices, closed plan context); fixtures exported from `@repo/database` for reuse in tests
- [x] Dietary preferences & allergens: user-declared tags on `user_profile` (distinct from AI-learned `dietaryNotes`), editable in a new onboarding step and a profile-page section, injected into all meal-plan prompts with allergens treated as hard constraints
- [x] AI observability: append-only `ai_call_log` table — one row per LLM call attempt (plan generate/replan, slot reroll, menu extraction, preference extraction) with provider, model, token counts, latency, attempt number, and outcome (succeeded / validation_failed / truncated / provider_error); written fire-and-forget so logging can never fail a request
- [x] Set up a test runner (Vitest): cover plan-budget arithmetic, numeric string<->number boundary, Haversine filtering, AI-response validation
- [x] Single-slot reroll: regenerate the 3 options for one meal slot (scoped to that slot's remaining budget); treat reroll as implicit "none of these" feedback, with guard rails (per-user rate limit + per-slot reroll cap per generation + rejected options replayed as hard exclusions)
- [x] Menu image upload for restaurant recommendations: upload a menu photo, AI extracts items (name + price + description) and pre-fills the editable items form, with graceful fallback to manual entry and anti-abuse guards (per-user rate limit, pending cap, image validation, hardened prompt)
- [x] Combo meals per slot: a suggestion option is now a whole order (1–N menu items from one restaurant) with per-item and combined pricing
- [x] The users can add restaurants of their choice with the approval of admin
- [x] At a time only up to certain number of approval requests for restaurants will be allowed per user
- [x] Add rate limiting
- [x] Fix user flow & error handling for plan generation when onboarding/location is incomplete or no restaurants are nearby
- [x] AI returns invalid plan often times, sometimes uuid is invalid, sometimes the max-token limit is reached etc
- [x] Auth setup (email + password)
- [x] Email OTP verification
- [x] Google OAuth
- [x] GitHub OAuth
- [x] Cleanup schemas, specifically remove `users` table
- [x] Remove JWT implementation
- [x] Insert tables relations
- [x] In scraper, add a sound effect when a captcha needs to be solved manually
- [x] We are repeating restaurant's menu items
- [x] Add `xstate` in onboarding steps in web
- [x] Convert queries that use complex joins to use `relations` instead
- [x] Update Google Auth Provider
- [x] Analytics page
- [x] Add API cold-start wakeup banner for Render free-tier delays
