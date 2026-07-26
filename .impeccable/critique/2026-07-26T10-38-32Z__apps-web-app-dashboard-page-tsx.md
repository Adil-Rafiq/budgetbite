---
target: dashboard
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-07-26T10-38-32Z
slug: apps-web-app-dashboard-page-tsx
---
⚠️ DEGRADED: single-context (sub-agent assessments failed — session limit hit mid-run; detector run inline via Bash, design review conducted in-context). Mode: Operate.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|-----------|
| 1 | Visibility of System Status | 4 | Loading/saving/reroll/toast all covered; over-budget is now honest (hero "₨ X over" + "Over budget" pill + visible caption). |
| 2 | Match System / Real World | 4 | PKR ₨, real Karachi dishes, plain "Per meal left", "Cooked at home"; "Ready" → "Undecided" removed the ambiguous status. |
| 3 | User Control and Freedom | 3 | Reroll, cancel, change-choice present; still no undo/delete of a logged meal — correcting a typo re-runs the log flow. |
| 4 | Consistency and Standards | 4 | One shared `BudgetFitBadge` across dashboard + both restaurants surfaces; nav labels unified; header/sidebar/dashboard read one `budgetState`; hero routes through `formatPKR`. |
| 5 | Error Prevention | 3 | The log form now warns when an amount blows the remaining/per-meal budget — but it's a soft warning, not a hard confirm, and the schema still only checks `.positive()`. |
| 6 | Recognition Rather Than Recall | 4 | Fit badges + per-meal target now sit at the decision (card and dialog); no more recalling an off-screen number. |
| 7 | Flexibility and Efficiency | 3 | One-tap logging, all 3 options on the card, optional feedback; still no keyboard traversal between slots or bulk "log all". |
| 8 | Aesthetic and Minimalist | 3 | Clean and cohesive; the "Missing a spot?" recommend card and privacy footnote still add mild off-mission weight to the primary surface. |
| 9 | Error Recovery | 3 | Over-budget has a re-plan CTA and save errors are specific; but data-load failures (budget, meals, activity) still say "Please refresh" with no in-place retry. |
| 10 | Help and Documentation | 3 | Reassurance is now visible copy (not a title tooltip) and the budget context is explained inline; still no searchable/contextual help system. |
| **Total** | | **34 / 40** | **Good (top of band)** |

All ten heuristics apply (Operate surface); nothing scored n/a. Up from **28/40** last run.

## Design Specificity Verdict

**Now authored-for-this-product at its core, not just the frame.** The prior run's central miss — a generic name/price/"Choose" card with the budget absent from the decision — is closed. Every option on the card and in the dialog (`meal-slots/index.tsx:234`, `:299`) wears a **Fits budget / Tight / Over budget** badge via the shared `classifyBudgetFit`, and the dialog header states the per-meal target (`:267`). The over-budget state — the product's defining moment — is now the honestly-designed part of the summary card (`summary-cards.tsx`), not the part that flinched. A generic SaaS dashboard could not wear this unchanged.

**Deterministic scan:** the bundled detector returned **0 findings (exit 0)** across the full render tree (dashboard page/layout, all `components/dashboard/*`, `budget-fit-badge`, app shell, motion primitives). Same clean result as last run; nothing the static engine covers is dirty. Caveat unchanged: the static CLI engine can't evaluate animation rules (e.g. `pulsing-dot`), so the decorative `animate-pulse` header dot isn't machine-checked — but that dot is now honored by the CSS reduced-motion block, and the JS motion it can't see (`CountUp`/`FadeUp`/`Stagger`/budget bars) now respects `prefers-reduced-motion` too.

**Visual overlays:** none — no browser automation was available in this degraded run; evidence is the inline CLI scan + source review.

## Overall Impression

The dashboard has crossed from "competent dashboard" to "competent budget-adherence instrument." The two problems that anchored the last score — budget absent at the decision, budget mishandled at the over-budget valley — are both resolved, and the fixes are consistent (one badge, one budget source) rather than bolted on. What remains is genuinely a second tier: recovery affordances (in-place retry), a flat end-of-loop moment, and power-user efficiency. No P0/P1 remain.

## What's Working

1. **Budget legibility is now everywhere it's needed** — the per-meal target and per-option fit cue are at the point of choice, and the same figure agrees across header, sidebar, and dashboard because they read one `budgetState`.
2. **The over-budget state is honest and actionable** — "₨ X over" in tomato, an "Over budget" pill, a plain-language caption, and a re-plan CTA, instead of a nonsensical negative "left".
3. **One-tap logging with optional feedback** — the daily loop is now tile → log, feedback tucked behind a disclosure, so the required amount is the only mandatory step; and it's the same `classifyBudgetFit` cue the restaurants surface uses.

## Priority Issues

**[P2] Data-load failures dead-end at "Please refresh".** `summary-cards.tsx` (SummaryCardsError), `meal-slots/index.tsx` (slotsError), and `recent-activity.tsx` all render a static "Please refresh to try again" with no in-place retry. On a flaky mobile connection — the core use scene — the user must reload the whole app.
- **Fix:** add a "Try again" button that calls the query's `refetch` (React Query already backs these).
- **Suggested command:** `/impeccable harden`

**[P2] The end of the loop is flat.** Logging a meal ends in a success toast with no reinforcement — no "2 of 3 meals logged today", no "₨ X under target today". Peak-end is weak because the end is a toast, and the meal-slots section header (`Today's meals`) doesn't reflect progress.
- **Fix:** show "X of Y logged" in the meal-slots header and a one-line positive/cautionary summary after a log (under- vs over-per-meal).
- **Suggested command:** `/impeccable delight`

**[P2] No undo/edit of a logged meal.** Correcting a mistyped amount still means "Change choice" → the full log flow. There is no meal-choice delete/patch endpoint, so this needs a small backend addition, not just UI.
- **Fix:** add an edit-amount affordance on the logged card once a PATCH endpoint exists; until then, keep "Change choice" but rename it "Edit / change".
- **Suggested command:** `/impeccable shape`

**[P3] The over-budget guardrail is a warning, not a confirm.** A determined fat-finger can still submit an obviously-wrong amount. Acceptable (eating out over budget is real), but it caps Error Prevention at 3.
- **Fix:** on submit, if the amount is >2× the per-meal target, require a single confirm click before saving.
- **Suggested command:** `/impeccable harden`

## Persona Red Flags

**Alex (power user):** still no keyboard traversal between the three slots, no "log all planned", no express beyond one tap; no inline amount edit on a logged card (must re-open the flow).

**Sam (accessibility):** materially better — JS motion now respects reduced-motion, reassurance is visible text, `aria-pressed` on the feedback toggles. Remaining: verify the tomato-on-tomato/10 fit pill and small uppercase labels hit 4.5:1 (borderline brand pairing, used app-wide); the choose dialog's 6 combined actions are a long tab sequence.

**Budget-anxious Pakistani takeout user (phone):** the reassurance and remaining budget are now above the fold (header pill on <640px) and legible; over-budget is named, not hidden; the fit badge answers "can I afford this?" at a glance. The remaining sting is recovery on a dropped connection (refresh-only errors, P2 above).

## Minor Observations

- Mobile nav labels ("Restaurants", "Analytics", "Dashboard") can ellipsize on very narrow (<340px) phones — truncation is graceful (no layout break) but the word clips; acceptable at ≥360px.
- The recommend card + "All logged meals are private" footnote remain on the primary decision surface — consider relocating to keep the dashboard about today's decision.
- End-of-period: when `mealsRemaining` is 0 but budget remains, "Per meal left" shows ₨0; fine, but a "plan complete" state could read better.

## Questions to Consider

1. What would make logging *feel* like progress — a filling ring of "3 meals today", a running "₨ under target" tally — so the end of the loop is a small win, not a toast?
2. Should a dropped-connection error offer one-tap retry inline, given the product's core scene is a phone on mobile data?
3. Is "Change choice" the right correction path, or does the product need a real edit-the-amount affordance (and the PATCH endpoint behind it)?
