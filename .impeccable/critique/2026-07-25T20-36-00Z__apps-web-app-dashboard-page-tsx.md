---
target: dashboard
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-25T20-36-00Z
slug: apps-web-app-dashboard-page-tsx
---
Method: dual-agent (A: design-review sub-agent · B: detector-evidence sub-agent). Mode: Operate.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|-----------|
| 1 | Visibility of System Status | 3 | Loading/saving/toast coverage is excellent, but over-budget standing is not honest: the hero can read "₨ -1,234 left" and the pill stays "Watch spending" when the money is already gone. |
| 2 | Match System / Real World | 4 | Deeply localized — PKR ₨, real Karachi dishes, plain-language "Per meal left", "Cooked at home". Only "Ready" as a slot status is mild jargon. |
| 3 | User Control and Freedom | 3 | Reroll, change-choice, custom/home logging all exist; but there is no undo/delete of a logged meal — correcting a typo means re-running the whole log flow. |
| 4 | Consistency and Standards | 3 | Strong token system, but two independent budget computations (header clamps, dashboard doesn't), and nav labels differ across devices for identical routes. |
| 5 | Error Prevention | 2 | The one number the product is about is unguarded: `actualAmountSpent` validates only `.positive()` — no max, no confirm when a spend blows the per-meal target or remaining budget. |
| 6 | Recognition Rather Than Recall | 2 | Budget-fit is absent at the point of choice; the "Per meal left" figure sits on the page *behind* the choose dialog, so the user does the math from memory. |
| 7 | Flexibility and Efficiency | 3 | Reroll + fast manual entry serve power users, but choosing a suggested meal costs three sequential surfaces with no express "accept top pick". |
| 8 | Aesthetic and Minimalist | 3 | Clean, warm, cohesive; the "Missing a spot?" recommend card and the privacy footnote add off-mission weight to the primary decision surface. |
| 9 | Error Recovery | 3 | Friendly, specific error copy; but data-load failures only say "Please refresh" with no in-place retry. |
| 10 | Help and Documentation | 2 | Good first-run explainer, but key reassurance copy lives in `title=` tooltips — invisible on touch and to keyboard/screen-reader users, i.e. absent for the mobile audience. |
| **Total** | | **28 / 40** | **Good** |

All ten heuristics apply (Operate surface); nothing scored n/a.

## Design Specificity Verdict

**Authored-for-this-product at the frame, category-interchangeable at the exact decision point.**

The scaffolding is unmistakably BudgetBite: one PKR source of truth (`lib/currency.ts`), real Pakistani menu placeholders, the "Cook at home 🍳" affordance, three-options-per-slot, the "Per meal left" metric, the on-track / watch-spending pill, the reroll ("None of these? Get new options"), and the honest 3-step first-run explainer. No generic SaaS template ships these.

But the single most important moment — **choosing a meal against a budget** — is generic. Inside the choose dialog (`meal-slots/index.tsx:246-297`) each option is name + restaurant + price + "Choose": the same card a plain food-catalog would use. The budget is *absent from the decision*. And `classifyBudgetFit()` already exists in `@repo/shared` (`packages/shared/src/constants/budget-fit.ts`), purpose-built to badge each item green/amber/red against the per-meal budget and `amountRemaining` — its own docstring says it's shared so client and server use the same numbers — yet the dashboard's meal decision does not use it. The product knows how to fuse budget into a food choice and chose not to at the one place that most defines it.

**Deterministic scan:** the bundled detector returned **0 findings, exit 0**, across all 18 files in the dashboard render tree (entry page, layout, all `components/dashboard/*`, app shell, motion primitives). Assessment B verified the empty result was genuine by running the same CLI against a known trigger (it correctly returned a `bounce-easing` finding). One caveat: the static CLI engine only implements the `source` + `page-analyzer` rule sets — animation rules (e.g. `pulsing-dot`) fire only in the browser engine, which was unavailable. So the decorative `animate-pulse` dot in `dashboard-body.tsx:30` was not machine-checked. This is where the two assessments **converge from opposite directions**: the detector couldn't evaluate motion, and the design review independently found a real motion gap (JS/Framer animations ignore reduced-motion). Nothing the detector *could* check was dirty — the issues here are judgment-level, not lint-level.

**Visual overlays:** none. No browser automation was exposed to the evidence agent, so there is no user-visible overlay in a browser tab; the evidence is the CLI scan plus source review.

## Overall Impression

This is a well-built Operate surface with above-average discipline — thorough loading/error/empty states, a real shared money formatter, and a first-run screen that models the product loop instead of showing four empty widgets. It clears the "competent dashboard" bar comfortably.

The gap is that it's a competent *dashboard*, not yet a competent *budget-adherence instrument*. Two things hold it back, and they're the same thing viewed twice: **the budget is not present where decisions and anxiety live.** It's missing at the meal choice (no fit cue, per-meal number off-screen) and it's mishandled at the over-budget moment (negative hero, green over-spend metric, a pill that won't say "over"). The single biggest opportunity: **make the budget legible inside the decision and honest at the valley.**

## What's Working

1. **First-run collapses four empty widgets into one instruction.** `dashboard-body.tsx:17-23` short-circuits to `NoPlanState`, which says one thing and teaches the loop in three honest steps ("about two minutes"). This is the emotional peak of the surface.
2. **State coverage is thorough and consistent.** Every data section has distinct loading (skeletons that match final layout), error (tomato tiles), empty (dashed-border), and populated states in a shared visual language. Notably more disciplined than typical.
3. **Honest-money helper is real and enforced.** `formatPKR` (`lib/currency.ts`) — one mark, en-US grouping, whole rupees — is used across cards, activity, sidebar, and modal. The recent unification commit shows in the code.

## Priority Issues

**[P1] The meal decision has no budget context.** Choosing happens in `meal-slots/index.tsx:246-297` with no per-meal target and no fit badge, even though `classifyBudgetFit()` exists for exactly this and is already used on the restaurants surface. The "Per meal left" number lives in `SummaryCards`, *behind* the modal — a working-memory failure at the core action.
- *Why it matters:* Principle #1 says budget legibility must be everywhere and #4 promises "no math"; this is the one screen where the user does math from memory. It's also the central design-specificity miss.
- *Fix:* Pass `avgBudgetPerRemainingMeal` + `amountRemaining` into the dialog; render a green/amber/red fit chip per option (reuse the shared helper) and a persistent "Per meal left: ₨ X" line in the dialog header.
- *Suggested command:* /impeccable shape

**[P1] Over-budget is rendered dishonestly — and inconsistently.** `amountRemaining` is `z.coerce.number()` with no floor (`budget-state.ts:11`), so it can go negative. The header defensively clamps it (`Math.max(0, …)`, `app-header.tsx:38`) but the dashboard hero does not (`summary-cards.tsx:113`) → "₨ -1,234 left". `avgBudgetPerRemainingMeal` renders in **green** regardless of sign (`:178`), and the pill only ever says "On track" / "Watch spending" — never "Over" (`:138`). (The `% spent` label itself is uncapped and does show e.g. 112%; only the bar width caps — so the number is visible but nothing frames it as *over*.)
- *Why it matters:* Going over budget is the product's defining high-stakes moment, and the UI flinches exactly where principle #5 (honest money) matters most. A budget-anxious user gets a nonsensical negative and no path to recover.
- *Fix:* Add an explicit `over` health state: hero flips to "₨ 1,234 over budget" in tomato, per-meal metric turns tomato when negative, pill reads "Over budget", and a re-plan/adjust CTA appears. Align the header and dashboard on one budget computation.
- *Suggested command:* /impeccable harden

**[P1] On phones under 640px, the budget number is below the fold.** The header budget pill is `sm:flex lg:hidden` (`app-header.tsx:76`) — visible only 640–1023px. The sidebar budget card is `lg`-only. So on the core "log spend on the go" device, the first budget figure is in `SummaryCards`, which renders *after* three full-width meal cards (`dashboard-body.tsx:44-47`). The user opens the app to "Welcome back." + meal cards, no budget in sight.
- *Why it matters:* Directly violates principle #1 for the exact device the product says matters equally.
- *Fix:* Add an always-visible compact remaining-budget chip to the sticky header for `<sm`, or reorder `SummaryCards` above `MealSlots` on mobile only.
- *Suggested command:* /impeccable adapt

**[P2] No guardrail on the number that defines the product.** `actualAmountSpent` validates only `.positive()` (`log-meal.schema.ts:4`) — no max, no budget-aware confirm. A mistyped 50000 is accepted silently and re-plans the rest of the budget on bad data.
- *Why it matters:* Cheap error prevention is missing on the highest-consequence field; the whole re-planning loop trusts this number.
- *Fix:* When the entered amount materially exceeds remaining budget or the per-meal target, show an inline confirm ("This is ₨ X over your per-meal budget — log anyway?") before save.
- *Suggested command:* /impeccable harden

**[P2] Logging a meal costs three surfaces and bundles feedback into every entry.** Card → "View all options" dialog → "Choose" → separate log modal carrying amount + 5-star rating + like/dislike + comment. Only 2 of the 3 promised options show on the card (`index.tsx:196`), breaking the "three options" promise.
- *Why it matters:* The daily mobile loop is heavy; the required step (amount) is buried under optional feedback, and the card under-delivers on the core promise.
- *Fix:* Make card option tiles directly selectable, surface all 3 options, and collapse rating/like/comment behind an optional "Add feedback" disclosure so the amount is the only required field.
- *Suggested command:* /impeccable distill

## Persona Red Flags

**Alex (power user):** Every meal choice is three sequential clicks; no "accept top pick," no keyboard traversal between slots, no "log all planned." The 3rd suggestion is hidden behind "View all options." No inline edit of a logged amount. `RecentActivity` caps at 5 with no "view all" drill-in.

**Sam (accessibility):** JS motion ignores OS reduced-motion — `globals.css` disables CSS animations/`animate-pulse`, but the Framer-driven `CountUp` (`count-up.tsx:37`, no `useReducedMotion` check), `FadeUp`, and sidebar/header transforms are not covered, so a vestibular-sensitive user still gets the ticking hero and slide-ins. Critical reassurance copy is `title`-only (`summary-cards.tsx:127,176`) — invisible to keyboard/touch/most screen readers. Like/dislike toggles convey state by color/border and appear to lack `aria-pressed`. Very small low-contrast type (`text-[10px]`/`text-[11px]`, `text-slate/70`) risks failing WCAG AA.

**Budget-anxious Pakistani takeout user on a phone:** Opens the app on a <640px phone and can't see remaining budget without scrolling past three meal cards. When over budget, sees "₨ -X left" and a pill that says "Watch spending" (not "you're over") with no recovery guidance — the anxiety valley is amplified, not soothed. The reassuring "you're spending in line with your budget" line is trapped in a `title` tooltip that never fires on touch. Chooses meals by comparing raw prices with no "fits your budget" cue — exactly the mental math the product promises to remove.

## Minor Observations

- Nav vocabulary diverges across devices for identical routes: mobile `Home/Food/Stats/Me` (`mobile-nav.tsx:21-25`) vs sidebar `Dashboard/Restaurants/Analytics/Profile`. Pick one.
- The hero amount uses `CountUp` with a hardcoded `prefix="₨ "` (`summary-cards.tsx:113`) rather than `formatPKR`. Output matches today (CountUp applies en-US grouping + rounding), so this is *latent* — a future change to `formatPKR` (mark, paisa) wouldn't reach the hero.
- Section-header sizes differ at the same level: `MealSlots` h2 is 28px (`index.tsx:399`), `RecentActivity` h2 is 24px (`recent-activity.tsx:19`).
- The largest text on a budget product's dashboard says "Welcome back." (`dashboard-body.tsx:36`) — nothing about budget or today's decision.
- `recent-activity.tsx:82` parses `new Date(item.slotDate)` without the `T00:00:00` local guard that `meal-slots/index.tsx:75` uses — off-by-one date risk across timezones.
- "Ready" slot status (`index.tsx:124`) is ambiguous — ready to what? Consider "Choose" / "Undecided."

## Questions to Consider

1. If budget adherence is *the* product, why is the biggest budget component (the hero remaining number) on a lower tier than the meal cards — and gone entirely on small phones? Should the dashboard open on the budget, with the decision beneath it?
2. "Choose" immediately demands an *actual amount spent* — but at decision time the user hasn't ordered yet. Are two events (I'll-have-this vs. here's-what-it-cost) being conflated? Would a lightweight "plan this" state, separate from "log spend", match the real Foodpanda round-trip and cut friction?
3. What does going ₨2,000 over on day 3 of 30 look like, feel like, and offer next? Right now: a negative number and a green sub-metric. What if the over-budget state were the *most* designed screen in the app instead of the least?
4. You already compute per-option budget fit for restaurants. What stops each meal suggestion from wearing a "fits / tight / over" badge, so the choice is a glance, not a calculation — delivering the "no math" promise at the exact moment math is happening?
