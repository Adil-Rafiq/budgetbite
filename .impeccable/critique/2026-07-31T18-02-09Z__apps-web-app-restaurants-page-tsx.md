---
target: restaurants
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
timestamp: 2026-07-31T18-02-09Z
slug: apps-web-app-restaurants-page-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)
Mode: **Operate** — the visitor completes a task: find food they can afford, then leave and go order it.
Inspection: **source only. No rendered pixels, again.** Neither agent had browser automation exposed (B verified by tool enumeration: only `WebFetch` and Google auth stubs; `+chrome` returned no matches). No live server was started, no script was injected, **no overlay exists in your browser**. Every claim below is from source, computed token arithmetic, and the compiled CSS.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Result tally and the surface's only `aria-live` are both locked inside `totalPages > 1` (`page.tsx:605-618`). Under 24 results — the common filtered case — filtering 44→3 shows no count and announces nothing. |
| 2 | Match System / Real World | 3 | Seeded names still render raw: `jalal-sons-dha-iii?eo=large_order_swimlane`. The code de-slugs for the *URL* (`[id]:49-57`) but never for display. Success toast prints an ISO date: `₨ 640 for 2026-07-31`. |
| 3 | User Control and Freedom | 3 | Filters are URL state with per-chip clear and clear-all. But a meal logged from a restaurant page can't be undone there — the undo affordance exists only on the dashboard. |
| 4 | Consistency and Standards | 2 | `BudgetFitBadge` is fed a **delivered** cost here (`[id]:105-115`) and a **bare** menu price on the dashboard (`meal-slots/index.tsx:59-66`) — one pill, two meanings. `text-dark-green` fails AA in 13 places on this surface while `green-deep` exists specifically to fix it. Three focus-ring treatments coexist. |
| 5 | Error Prevention | 2 | `AddToPlanModal` carries only the 2× fat-finger arm (`add-to-plan-modal.tsx:62-74`). `LogMealModal` *also* warns "that's ₨X more than you have left" (`log-meal-modal.tsx:41-54`). The weaker guard sits on the surface where unaffordable dishes are most reachable. ₨0 submits silently. |
| 6 | Recognition Rather Than Recall | 2 | Every badge is judged against `avgPerMeal`, which renders once in the page header and scrolls away. The sticky `AppHeader` carries *remaining* — a different number. No legend anywhere for what "Tight" means. |
| 7 | Flexibility and Efficiency | 3 | Shareable URL filters, presets *and* sliders, keyboard-reachable. But `useRestaurants` has no `placeholderData` (`hooks/use-restaurant.ts:6-10`), so every keystroke, chip and slider tick collapses the grid to six skeletons. |
| 8 | Aesthetic and Minimalist Design | 2 | The filter card exposes 13 permanent controls, including a slider that duplicates its own preset chips for the same value. Each card carries 10 data points, three of them 11px lines stacked under the price. |
| 9 | Error Recovery | 3 | `DataError` with in-place `refetch()` is genuinely good and used consistently. But `"No menu items yet."` (`[id]:402-404`) is a dead end with no action and no explanation. |
| 10 | Help and Documentation | 3 | The "Typical meal is the average dish here plus delivery" footnote and the never-orders paragraph are excellent, honest inline help — placed *below* all 24 cards, i.e. after every decision they were written to inform. |
| **Total** | | **26/40** | **Acceptable** — significant improvements needed, but the foundation is now sound |

## Design Specificity Verdict

**Category-interchangeable composition wrapped around genuinely authored money logic.**

**LLM assessment.** The *arithmetic* on this surface is unmistakably BudgetBite's. `typicalMealCost` judges a restaurant on its average dish floored by minimum order plus delivery instead of the cheapest naan; the SQL `typicalCostExpr` mirrors it exactly so the sort and the pill cannot disagree; `buildFoodpandaUrl` strips scraped tracking params; the numbered `1 · Order on Foodpanda` / `2 · Log what you spent` pair states the product's defining constraint in the interface. No generic directory would contain that.

But the *composition* is a stock restaurant-directory template: a boxed white filter panel above a 3-up card grid with prev/next pagination. Swap "Typical meal" for "Price range" and this ships as Zomato-clone #400. The budget verdict — the one thing the product exists for — is appended to the bottom of each card at 10px inside `mt-auto`, *below* the name (18px), the star rating, the distance and the delivery fee. The grid is never banded or sectioned by affordability. The honesty engineering is authored-for-this-product; the page presenting it is not.

**Deterministic scan.** `detect.mjs --json` on `apps/web/app/restaurants` and `apps/web/components`: **`[]`, exit 0, zero findings, both runs.**

**That clean result is close to meaningless, and this is the most important thing in this report.** Assessment B instrumented the detector rather than trusting it. The registry defines **59 rules**, but they are gated by engine, and on `.tsx` only the regex engine runs. `REGEX_MATCHERS` covers exactly **9 rule ids** plus one unconditional check — **10 of 59 rules were live**. The 7 page-level analyzers require a literal `<!doctype` and an extension in `{.html, .htm, .astro, .vue, .svelte}`; `.tsx` is excluded, so none ever run. The 4 `design-system-*` rules need a `DESIGN.md`, which this repo doesn't have.

B proved it with a control file containing six deliberate defects — five ghost tokens, a 16px button, a 12px input, an unfocusable link, a 1.6:1 colour pair, 9px text, and a side-tab border. **The detector reported one finding: the side tab.** Everything else passed silently.

Specifically, on this codebase the detector is structurally blind to:
- **Undefined design tokens.** `grep "@theme|globals.css|--color-"` across the whole detector returns **zero hits**. A class like `bg-pulse` compiles to nothing and renders invisibly; the detector cannot see it. This is not hypothetical here — `FoodPreferenceToggle` once shipped `border-pulse bg-pulse/[0.10] text-pulse`, which made blocking a dish render identically to not blocking it.
- **All colour contrast.** The math exists (`shared/color.mjs`), but `low-contrast` consumes *computed* element props that only the browser/static-HTML engines produce. **No contrast ratio was computed during this scan.**
- **Touch-target size** — no rule references minimum hit area at all.
- **`focus-visible` presence** — appears only as an *exclusion* term; nothing checks that an interactive element has a focus style.
- Label/aria association, heading order, text overflow, line length, leading, and every rendered-geometry rule.

Exit 0 here means "none of 10 regex patterns matched," not "the surface is clean." Treat the guard in `apps/web/scripts/check-tokens.mjs` — which does resolve tokens and does fail the build — as the real regression net; the impeccable detector is not covering this codebase.

**Where the two assessments met.** Both agents independently computed the badge ink contrasts and got the same numbers: `amber-ink` on `amber-tint` 5.50:1, `tomato-ink` on tomato/10 5.58:1, `green-deep` on green/10 4.64:1. Two isolated derivations agreeing is the strongest evidence in this report that the badge palette is genuinely correct.

**Where they diverged.** A missed the `dark-green` contrast failures entirely — it verified the *ink* tokens and stopped. B computed the full matrix and found the surface's most common link colour fails AA. Conversely, B could not have found the P0 below; no rule in any engine compares prose against an `ORDER BY`.

**Visual overlays.** None. Injection was never attempted because no browser tool exists in this session. There is nothing to look at in your browser.

## Overall Impression

The last pass fixed the *lies*. The badge now tells the truth about what a meal costs, and the sort agrees with it. That was the right thing to fix first and it moved the score from 17 to 26.

What's left is that the page still doesn't *behave* like a budget product. It computes the budget verdict correctly and then renders it as the smallest element on the card, below a scraped URL slug. It tells the user the list is "ranked for your budget" and ranks by distance. It puts the explanation of its central number below every card that number appears on. The single biggest opportunity: **stop treating affordability as a badge and start treating it as the layout.**

## What's Working

1. **The delivered-cost model is enforced end to end, and it's the right model.** `estimateMealCost` / `typicalMealCost` are mirrored in SQL, and the sort target resolves from the *same* pin-adjusted `avgBudgetPerRemainingMeal` the client badge uses. The badge and the sort order genuinely cannot contradict each other about a restaurant. The doc comment even names the ₨24-roti / ₨249-minimum / ₨199-fee case it was written to kill.

2. **`RemainingAmount` refuses to lie in either direction.** Magnitude, then an explicit "over"/"left" word, then tone — never clamped to zero, never a hyphen-width minus that skims as a positive. On a budget-adherence product this one component carries more weight than the entire filter panel, and it's correct.

3. **Every fit state carries its label as text, not hue,** and the ink values clear AA on their own tints (independently confirmed by both agents). Colour-blind and greyscale users lose nothing. The empty-state ladder (page → search → filters → radius → nothing) with `Widen to 30 km` as a recovery action is genuinely thoughtful work.

## Priority Issues

### [P0] The page claims budget ranking and delivers distance ranking

**What.** `page.tsx:232-234` renders "Places that deliver to you, **ranked for your budget**" whenever the user has a location. The default sort is `'auto'`, which resolves to `undefined` (`page.tsx:129-133`) and falls through to `orderByExpr = distanceExpr` (`restaurant.repo.ts:136`). The Sort select even admits it: "Recommended **(nearest first)**" (`page.tsx:316-318`). Budget-fit sort is opt-in, and on first load with an active plan the cheapest affordable restaurant may be on page 2. Verified directly in both files.

**Why it matters.** Product principle 1 is "budget adherence is the product." The surface asserts it in prose and contradicts it in the `ORDER BY` — the one place ordering *is* a claim about what matters. A user with ₨150/meal is shown the nearest ₨1,400 place first while being told the list is ranked for their budget. This is the same class of dishonesty `typicalMealCost` was written to eliminate, reintroduced one layer up.

**Fix.** In `page.tsx:129-133`, resolve `sort === 'auto'` to `'budget-fit'` when `hasActivePlan && avgPerMeal > 0`, else `undefined`. Drive the select label at `:316-318` off the same condition, and make the subtitle conditional on the ordering that actually applies.

**Suggested command:** `/impeccable clarify`

### [P1] `text-dark-green` fails WCAG AA — 13 times on this surface, 86 app-wide

**What.** `--color-dark-green: #5a8a1a` against white is **4.13:1**; against `canvas` **3.94:1**; against `bg-green/10` **3.86:1**. AA needs 4.5:1, and every one of these sites is 12–13px non-bold, so the large-text 3:1 exemption does not apply. It also fails as a *fill*: white on `bg-dark-green` is **4.13:1**, and that is the hover state of the primary "Order on Foodpanda" CTA.

`globals.css:116` already documents this — "White on `--color-green` is ~2.0:1 and on `--color-dark-green` ~4.1:1, both under the 4.5:1 AA floor" — and introduces `green-deep` (#4f7c17, 4.97:1) as the fix. Only the *fills* were swept. The *text* uses were not. I counted them myself: 13 on this surface, **86 `text-dark-green` and 32 `bg-dark-green` across `apps/web`**.

**Why it matters.** This is the colour of nearly every link and eyebrow in the product — "Set your location", "Your recommendations →", "← Back to restaurants", the modal eyebrow, the preset chips' active state. The fix is already defined in the token file and was applied to half the cases.

**Fix.** Swap `text-dark-green` → `text-green-deep` and `bg-dark-green` → `bg-green-deep` across `apps/web`, then extend `apps/web/scripts/check-tokens.mjs` to fail the build on `text-dark-green` so the half-sweep can't recur. This is a whole-app change, not a surface change — scope it deliberately.

**Suggested command:** `/impeccable audit`

### [P1] Two different budget-fit meanings, and the weaker overspend guard is on the riskier surface

**What.** Three related breaks:
(a) `BudgetFitBadge` is fed `estimateMealCost(...)` here (`[id]:105-115`, `page.tsx:503-516`) but a bare `option.estimatedPrice` on the dashboard (`meal-slots/index.tsx:59-66`) — and `estimatedPrice` is the AI's item-sum with no delivery fee. **The identical ₨640 dish reads "Fits budget" on the dashboard and "Tight" on the restaurant page.**
(b) `AddToPlanModal` has only the 2× fat-finger arm; `LogMealModal` additionally warns when the amount exceeds `amountRemaining`.
(c) `AddToPlanModal` captures no rating/liked/comment, so a meal logged from a restaurant page teaches the planner nothing — breaking principle 3.

**Why it matters.** The badge's whole value is that it means one thing. Two meanings makes it decoration — and this is the bug that was just fixed here, still live one surface over.

**Fix.** Extract `amountWarning` from `log-meal-modal.tsx:41-54` into `apps/web/lib/budget-plan/amount-warning.ts` and render it in `add-to-plan-modal.tsx`. Route `option.estimatedPrice` through `estimateMealCost` in `meal-slots/index.tsx:59-66`. Add the feedback block to `AddToPlanModal` when `isPastOrToday`. Consider making `classifyBudgetFit` take `{itemPrice, deliveryFee, minimumOrder}` and do the flooring itself, so passing a raw price becomes impossible rather than merely documented.

**Suggested command:** `/impeccable harden`

### [P1] Every filter interaction destroys the result list

**What.** `useRestaurants` (`hooks/use-restaurant.ts:6-10`) sets no `placeholderData`. Each new `queryKey` — every debounced keystroke, chip, slider tick, page change — enters `pending`, so `isLoading` is true and `page.tsx:459-464` replaces the entire grid with six skeletons. The `isFetching` "· loading…" hint at `:617` never renders during that window, because the whole branch at `:496` is unmounted.

**Why it matters.** The distance slider fires on every step of a 1–30 range. On mobile data the list flashes to skeletons repeatedly while the user drags, losing scroll position and whatever card they were reading. Highest-frequency interaction on the surface; most destructive one.

**Fix.** Add `placeholderData: keepPreviousData` and `staleTime: 60_000` to `useRestaurants`. The `isFetching` affordances already written at `page.tsx:610-623` then start doing their job, and the grid dims instead of vanishing.

**Suggested command:** `/impeccable optimize`

### [P1] The badge's reference number is off-screen exactly when it's needed

**What.** `avgPerMeal` renders once in the page header (`page.tsx:240-247`) and once in the detail stat strip (`[id]:274-281`). Both scroll away. The sticky `AppHeader` pill shows `amountRemaining` — a *different* number from the one `classifyBudgetFit` compares against.

**Why it matters.** Working-memory failure on the core scene: one hand, a phone, hungry, scrolling 24 cards or 365 menu items. "Tight" and "Fits budget" are unanchored adjectives once the header is gone. The user must scroll up, memorise a rupee figure, scroll back, and do the comparison themselves — the exact arithmetic the app exists to remove.

**Fix.** Add `avgPerMeal` as a second segment in the sticky budget pill (`app-header.tsx:109-137`): `Left ₨12,000 · ₨640/meal`. Make the detail stat strip `sticky top-[57px] z-30` so the target travels with the menu.

**Suggested command:** `/impeccable layout`

## Persona Red Flags

**Casey (distracted, one hand, phone at meal time)** — The distance slider sits directly above a wrapping chip row; dragging it flashes the whole grid to skeletons on every step, and `goToPage` yanks scroll to top. The card is one big `<Link>` with no direct action, so logging a meal she already decided on costs: tap card → wait → scroll → tap Add to plan → pick meal type → confirm. The fit badge she's scanning for is the 10px element at the bottom of a 10-fact card, and the per-meal target it's measured against left the screen three cards ago. `← Back to restaurants` is an ~18px-tall target at the top of a 365-item page.

**Sam (screen reader / keyboard)** — Filtering announces nothing: the only `aria-live` on the surface is locked behind `totalPages > 1`. Switching sort, clearing a chip, or narrowing distance changes the entire result set in silence; `hideOverBudget` on the detail page does the same. Nearly every link on the surface is `text-dark-green` at 4.13:1 — below AA. `DataError`'s retry uses a tomato focus ring while everything else uses `FOCUS_RING`, so the one control Sam reaches during a failure looks different from every other control. B also found **2 genuinely unlabeled inputs** in `recommend-restaurant-button.tsx:371,374` — the "Item name" and "₨ price" fields in each repeating menu row have no `id`, no `aria-label`, no `<Label>`; the placeholder is the only accessible name, and the count scales with rows. Positive: `aria-pressed` is correct throughout, the slider thumb has a real 44px hit area, and every other control on the surface is properly bound.

**Jordan (confused first-timer)** — Lands with no plan: every fit badge is suppressed, so the page is an ordinary restaurant list, while "ranked for your budget" sits above a list ranked by nothing of the kind. With a plan, the card says "Tight" with no legend explaining the three tiers, and the explanation of what "Typical meal" means sits below all 24 cards. Worst: the menu button reads "**Add to plan**", the modal title reads "**Add to plan**" — but the eyebrow says "Log a meal", the date defaults to today, and the submit button commits `Log ₨ 640` against the real budget. Jordan believes he is queueing a future meal and has instead recorded spending that re-plans his month, with no undo on this surface and no preview of what remaining becomes.

## Cognitive Load

**6 of 8 failed — critical.**

| Item | Verdict | Evidence |
|---|---|---|
| Single focus | **FAIL** | Above the grid the page runs four jobs at once: read budget standing, configure filters, recommend a restaurant, create a plan. |
| Chunking (≤4/group) | **FAIL** | Filter card = 6 groups / 13 controls; restaurant card = 10 data points; menu item card = 9 elements. |
| Grouping | PASS | Controls boxed; card zones (identity → logistics → money) separated by `mt-auto` + `pt-4`. |
| Visual hierarchy | **FAIL** | Name 18px, `typicalCost` 16px, and the fit badge — the actual verdict — 10px at the very bottom. The filter panel outweighs the results it filters. |
| One thing at a time | PASS | The modal is a single task; order and log are visually sequenced 1/2. |
| Minimal choices (≤4) | **FAIL** | See below. |
| Working memory | **FAIL** | The per-meal target every badge compares against is off-screen while scrolling. |
| Progressive disclosure | **FAIL** | All filters permanently expanded; slider *and* chips for one value; the central explanation is a permanent footnote rather than attached to the figure. |

**Decision points with >4 visible options:** 5 distance presets *plus* a 1–30 slider (six ways to set one number); the filter panel as a unit (13 controls); each card (10 discrete facts × 24 per page); the detail header action cluster (Favorite, Block, Call, Order, Log = 5 competing actions); each menu card (9 elements including 3 buttons, 24 visible); the menu overall (up to 365 items flat, no category grouping — the schema has no category field).

## Emotional Journey

**Peak** — the green "Fits budget" pill next to an exact PKR figure, and the numbered order/log pair. Those are the two moments the product earns trust: it names the real delivered price, and it admits it can't order for you.

**Valley 1 — arrival without a plan.** Every fit badge disappears (`page.tsx:509-516` requires `hasActivePlan && avgPerMeal > 0`). The user who came to answer "can I afford this?" gets no answer and no partial answer.

**Valley 2 — the log itself.** `AddToPlanModal` shows the amount and the cost basis but **never shows what remaining will be after logging**. This is the highest-anxiety second in the product — the user is handing over a number that re-plans the rest of their month — and there is no forward projection, no "you'll still have ₨X for 11 meals."

**End** — a toast reading `Meal logged · ₨ 640 for 2026-07-31`. Raw ISO date, no budget consequence, no route onward, user abandoned on a menu page. Peak-end rule: the loop's closing beat is a machine timestamp. The `1 · order / 2 · log` promise sets up a third beat — "here's where you stand now" — that never arrives.

## Minor Observations

- `add-to-plan-modal.tsx:180-188` — when `menuItem` is null (whole-order log), `costBasis` still evaluates the delivery clause, rendering a bare fragment `"+ ₨ 199 delivery"` under the restaurant name with the amount field at 0.
- `add-to-plan-modal.tsx:128-136` — `handleOpenChange(true)` is unreachable; the dialog is conditionally mounted with `open` hardcoded, so the reset branch is dead code.
- `add-to-plan-modal.tsx:271-280` — `min={0}`, no upper bound, no zero-check. ₨0 submits cleanly and silently.
- `page.tsx:519-524` — the `basis` line prints `from ₨120` (the *minimum* item price) directly under a `Typical meal ₨850` figure derived from the *average*, re-planting the cheap anchor that `typicalMealCost`'s own doc comment exists to remove.
- `[id]:453` — menu names use bare `truncate` with no `title` on 1/3-width cards; the list card correctly uses `line-clamp-2 [overflow-wrap:anywhere]`. Same in `recommendations/page.tsx:63`.
- Seeded names still display scraped query strings verbatim. A `humanize-name.ts` helper (strip from `?`/`#`, de-hyphenate, title-case) would fix display in three places.
- `useRestaurantMenu` fetches all 365 items in one response including descriptions and image URLs; "Show 24 more" is pure client-side paging over an already-downloaded payload — 15 taps to reach the end, on mobile data.
- `[id]` is a client component with no `generateMetadata`, so every restaurant shares the root tab title.
- `page.tsx:531-533` — `whileHover` is the one motion on this surface that doesn't consult `useReducedMotion`.
- `[id]:433-440` — `<img>` has no `onError`, so a dead scraped URL renders the broken-image glyph instead of the `Utensils` placeholder defined two lines below.
- `[id]:268-292` — the plan stat strip is `grid-cols-3` at every breakpoint; `₨ 120,000` will overflow its ~90px column on a 320px phone (no `min-w-0`).
- Unconditional sub-44px targets: `ui/input.tsx:11` `h-9` (36px, every text field) and `ui/select.tsx:35` `h-9` (36px, both sort selects). Everything else on the surface uses `min-h-11 sm:min-h-9`, a deliberate mobile-first pattern. Nothing is below the 24px WCAG 2.5.8 floor.
- `sage` #d4e8b0 as a control border is **1.32:1** on white — below the 3:1 non-text minimum for control boundaries. The `amber` star icon is **2.03:1**. The slider's green range on its muted track is **1.84:1**.

## Questions to Consider

1. If budget adherence is the product, why is the affordability verdict the smallest, lowest element on a card whose largest element is a scraped URL slug? What would this grid look like **banded** — "6 fit your ₨640" / "4 are tight" / "the rest" — instead of sorted?
2. The default sort silently disagrees with the sentence printed above it. How many other places in this app assert a priority in copy that the query doesn't implement — and what review step would catch a claim living 100 lines from its contradiction?
3. `BudgetFitBadge` was extracted into one canonical component precisely so the cue would mean one thing everywhere, and it now means two. Should `classifyBudgetFit` refuse to accept a raw menu price at all, so the wrong call becomes impossible rather than merely documented?
4. The loop the product is named for ends in a toast that says `for 2026-07-31`. What would it cost to show `₨ 11,360 left · 17 meals · ₨ 668 each` instead?
5. Why is there no way to log a meal from the list? The user who already knows where they ate must open a detail page, load 365 menu items, and hunt for a dish — on the surface whose principle is "reduce decision friction, plus a fast manual-entry escape hatch." Where is that escape hatch here?
