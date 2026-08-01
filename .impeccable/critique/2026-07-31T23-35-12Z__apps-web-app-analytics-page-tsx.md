---
target: analytics
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-31T23-35-12Z
slug: apps-web-app-analytics-page-tsx
---
Method: dual-agent (A: design review · B: detector + Playwright browser evidence, overlay injection succeeded)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Active range never stated in words; the range picker silently doesn't govern panel 02. Skeletons are genuinely good and shape-matched. |
| 2 | Match System / Real World | 2 | `<h1>` reads "Understand the week." while the default range is `thisMonth()`; subhead promises "budget drift" that is never plotted; panel codes `01`–`04` are machine-speak. |
| 3 | User Control and Freedom | 2 | No previous/next period stepping — last month requires hand-typing two dates. Every chart mark is inert; no drill-down to the meals behind it. |
| 4 | Consistency and Standards | 1 | Bespoke `RangeButton` vs. the accessible pill in `plans-list.tsx:155-176`; bare `<p>` errors vs. shared `DataError`; `spentAmount` vs. the shell's pin-adjusted `budgetState`; tooltip formatters inconsistent within one file. |
| 5 | Error Prevention | 1 | Two `<input type="date">` with no `min`/`max` and no start≤end check on client **or** server. An inverted range renders as "No spending in this range." |
| 6 | Recognition Rather Than Recall | 1 | `totalSpent` and `mealCount` fetched and discarded. The budget bar is 1.32:1. Judging adherence means holding the sidebar's plan-scoped figure in your head against a range you picked. |
| 7 | Flexibility and Efficiency | 2 | Custom range works. No period stepping, no sort/filter/export on an unpaginated table, no restaurant breakdown, no `budgetPlanId` scoping, no URL state. |
| 8 | Aesthetic and Minimalist Design | 2 | Real atom-level craft (`tabular-nums`, `font-display` money, variant-matched skeletons). But the minimalism stripped the *numbers*, not the chrome — four co-equal panels, decorative codes leading, no hero. |
| 9 | Error Recovery | 0 | Panels 02/03/04 never read `.error`. A failed fetch renders "No budget plans yet." / "No meals logged in this range." Panel 01's lone error branch has no retry and no `role="alert"`. |
| 10 | Help and Documentation | 1 | Nothing explains that panel 02 ignores the range, that the active plan's bar is partial-to-date, or that cancelled plans are included. `SummaryStat`'s `hint` prop sets the precedent; unused here. |
| **Total** | | **14/40** | **Poor — major UX overhaul required** |

Both the independent design review and my own pass landed on 14 independently.

## Design Specificity Verdict

**LLM assessment: category-interchangeable.** Swap `formatPKR` for `formatUSD`, rename "meal type" to "category" and "restaurant" to "vendor", and this page ships unchanged as an expense tracker, a SaaS usage dashboard, or a fitness log. The composition is the default template: header + range chips, then a 2×2 grid of line / grouped-bar / donut / table.

The tell isn't the chart types — it's that **this codebase already contains an authored vocabulary for exactly this subject, and the page imports none of it**:

- `lib/budget-plan/spending-health.ts` — a four-band verdict with plain-language captions, written because binary red/green "made 89% reassuring, 90% an alarm, and 150% indistinguishable from 90%."
- `components/data-error.tsx` — `role="alert"`, 44px retry, house focus ring.
- `components/budget/` — `BudgetProgress`, `RemainingAmount`, `StatTile`.
- `lib/budget-plan/labels.ts` (`planTitle`), `lib/humanize-name.ts`, `lib/focus-ring.ts`.

The page imports `formatPKR` and nothing else. **The page about whether you stayed in budget contains zero budget judgement.**

Missed product character: budget adherence is never the hero; the time unit is the calendar, not the *plan* (the API supports `budgetPlanId`, the client never sends it); there's no restaurant breakdown despite `PRODUCT.md` listing it and every row carrying a restaurant; the daily line is plotted against **nothing** when the daily allowance is the entire point.

**Deterministic scan.** `detect.mjs --json apps/web/app/analytics` → `[]`, exit 0. Clean, and verifiably not suppressed: no `.impeccable/config.json`, no inline disables. On `.tsx` the detector runs regex mode only — every real finding came from the rendered DOM, not source.

**Visual overlays — injection succeeded.** Playwright (from the scraper's venv; no browser MCP tool is exposed) logged in as the demo user, reached `/analytics`, and injected the overlay: **41 anti-patterns, 81 overlay nodes**, of which **33 are analytics-owned**:

| Rule | Analytics | Shell / dev-chrome |
|---|---|---|
| `undersized-ui-text` | 28 — panel codes ×4, table headers ×3, per-row meal labels ×21 | 5 (MobileNav) |
| `nested-cards` | 5 — the tinted `Panel` header strips + sticky table header | 0 |
| `first-viewport-column-overflow` | 1 — the analytics grid | 1 (AppShell, expected) |
| `gradient-text`, `layout-transition`, `shape-assembled-illustration` ×2 | 0 | 4 — all resolve to `BODY` |

**False positives, correctly identified:** the four `BODY`-resolved findings are Next.js dev-overlay chrome (`grep bg-clip-text` returns nothing app-side); the `AppShell` overflow is a scrolling shell taller than the viewport. The 5 `nested-cards` are technically true but weak — the "inner card" is an intentional two-tone header strip. Treat as advisory. The **28 `undersized-ui-text`** findings are real and corroborated by measurement below.

**Where the two assessments converge** — independently, on: missing error states, panel 02 ignoring the range, the `DARK_GREEN` ghost-token evasion, sub-44px targets, the reduced-motion gap, and contrast. Their contrast numbers agree to within 0.01 (`SAGE` 1.31 vs 1.32; `GREEN` 2.05 both; `AMBER` 2.03 both). **Where the detector beat the review:** the Y-axis money bug — invisible in source, only findable by measuring painted tick positions against their labels.

## Overall Impression

**This page is well-built and wrong.** The craft at the atom level is real: shape-matched skeletons, `tabular-nums` money, a considered exact/compact split, a live-data color map shared between donut and table rows. Someone cared.

But it is a *display*, not an answer. It never says how much you spent, never says whether that was OK, and in three of four panels it converts a network failure into a confident false statement about your money. For a product whose first principle is "budget adherence is the product" and whose fifth is "honest money UI," the analytics surface is the one place both principles break at once.

**The single biggest opportunity:** `spendingQuery.data.totalSpent` is already in the browser's memory, unrendered. One hero band — total, meal count, resolved dates, and the verdict from `getSpendingHealth()` — closes the informational and emotional hole simultaneously, using code that already exists.

## What's Working

**1. `ChartSkeleton` is shape-matched to the chart it replaces.** `variant="line" | "bar" | "pie"` renders a dotted line, paired bars, and a donut-with-legend-chips respectively. The eye parses the panel *type* before data arrives and nothing reflows when it does. Most dashboards ship one grey rectangle for all three.

**2. The exact/approximate money split is correctly reasoned.** Compact on the axis where you *scan*, exact `formatPKR` in every tooltip and the amount column where you *read* — paired with `tabular-nums` so the column never jitters. The rule is right. (Its axis implementation is broken — see P1 — but the thinking is sound.)

**3. Meal-type color is derived from live data with a stable map.** `colorByMealTypeId` builds from `useListActiveMealTypes()`, so the same meal type is the same color in the donut *and* on every history row. Cross-panel identity linkage is the right instinct.

## Priority Issues

### [P0] Three of four panels render load failure as factual emptiness
**What.** `page.tsx:334-337`, `:394-397`, `:440-443` check `isLoading`, then jump straight to a length check. `plansQuery.error` and `historyQuery.error` are never read — `spendingQuery.error` at `:292` is the only `.error` reference in the file.

**Why it matters.** On mobile data in Pakistan — the product's stated core scene — a dropped request tells a user with 12 plans they have **zero**, and tells a user who overspent they ate **nothing**. The app fabricates a claim about the user's money, and it fabricates it in a *soothing* direction, so nobody investigates. This breaks principle 5 ("no numbers that drift from what was actually spent") and principle 2 ("ground everything in reality") in a single branch. It is also the failure mode most likely to actually occur.

**Fix.** Check `.error` before the empty check in all four panels; render the existing `<DataError message onRetry={() => query.refetch()} />`. Replace panel 01's bare `<p>` too. Also handle `useListActiveMealTypes()` failing — `mealTypes = []` currently makes every donut slice "Other" in green and every history label "Meal", silently.

**Suggested command:** `/impeccable harden`

### [P0] The page fetches the answer and throws it away
**What.** `spendingAnalyticsSchema` returns `totalSpent` and `mealCount` (`packages/shared/src/schemas/analytics.ts:21-22`). The component destructures only `spending?.daily` (`page.tsx:176`). **`totalSpent` never reaches the DOM.**

**Why it matters.** "How much did I spend this week?" is why the page exists. Answering it currently means eyeballing a line chart or mentally summing up to 90 table rows — while the number sits unused in memory. There is no total, no verdict, no health band, no reassurance at the exact moment a user is most anxious. The page cannot answer its own question.

**Fix.** A hero band above the grid: `formatPKR(spending.totalSpent)` at ~32px in `font-display`, meal count, average per meal, the resolved range in words, and the adherence verdict via `getSpendingHealth()` + `spendingHealthCaption()` from `lib/budget-plan/spending-health.ts`, tinted `tomato-ink`/`green-deep`. `PlanEndSummaryCard` already does exactly this — the app knows how to say it and declines to here.

**Suggested command:** `/impeccable layout`

### [P1] Displayed money isn't true — on the axis, and in panel 02
**What.** Two independent truth bugs:

- **The Y-axis misstates rupees.** `formatPKRCompact` (`page.tsx:102-106`) uses `Math.round(value / 1000)`. Measured against actual painted tick positions: **₨1,300 is labelled "1k"** (₨300 / 23% understated), **₨2,600 → "3k"**, **₨3,500 → "4k"**. The same axis also mixes formats — a bare `650` sits next to `1k`, and neither carries a currency mark.
- **"Budget vs actual" ignores the range control.** `useBudgetPlans({ limit: 12, offset: 0 })` (`:167`) takes no date filter, yet sits inside the same range-governed `<Stagger>` grid, 200px below the chips. Confirmed in-browser: with range = Aug 2026 and every other panel empty, panel 02 still rendered `Jul 2026` bars. Worse, `format(startDate, 'MMM yyyy')` (`:189`) renders **four weekly plans in July as four identical "Jul 2026" bars**; cancelled plans are included unfiltered; and the active plan's partial-to-date `spentAmount` is drawn identically to completed plans, so it always reads "comfortably under budget."

**Why it matters.** Weekly plans are half the product. This is the page's only budget-adherence visual and it is unreadable for weekly users, systematically optimistic for anyone mid-plan, and governed by a control that appears to govern it but doesn't.

**Fix.** Make `formatPKRCompact` keep one decimal below 10k (`1.3k`) and carry the mark. Use `planTitle(plan)` for the X label — it exists to solve this exact collision. Filter or mark cancelled plans; distinguish the in-progress bar. Either scope panel 02 to the range or move it out of the range-governed grid and label it "All plans."

**Suggested command:** `/impeccable harden`

### [P1] The surface is unusable by screen reader, keyboard, and touch
**What.** All measured in the live page, not inferred:

- All three `svg.recharts-surface`: `role=null`, `aria-label=null`, empty `<title>`/`<desc>`, no `tabindex`. `tables: 0` — the meal history is a `grid-cols-[64px_1fr_auto]` div, so the sticky header announces as three orphan strings with no cell association. **Three quarters of the page is silent; the fourth has no structure.**
- **Focus is completely invisible** on both date inputs — they carry `outline-none` (`:258`, `:265`) with no replacement (measured while focused: `outlineStyle: none`, `boxShadow: none`, `borderWidth: 0px`) — and they are the **first tab stop on the page**. They also have no `id`, `name`, `aria-label`, or `<label>`; they announce as "date edit, date edit."
- **Every control fails the touch minimum:** Week 57×28, Month 63×28, Custom 71×28, date inputs 128×**18**. `plans-list.tsx:167` uses `min-h-11` for the identical control. `RangeButton` also has no `aria-pressed` and no `role="group"` — selection is conveyed by color alone.
- **Contrast, canvas-composited against actual painted background:** legend "Budget" **1.32:1**, "Actual"/"Breakfast" **2.05:1**, "Dinner" **2.03:1**, panel codes **3.06:1**, table headers and row meal labels **3.11:1**. Recharts paints legend text in the *series* color, overriding `wrapperStyle.color` — so `globals.css`'s own rule that `--color-green` is "decorative only, never behind text" is violated in three places. The budget bar itself is **1.32:1**: on a page about budget adherence, the budget is the least visible mark on it.
- **Color is the sole encoding** in both the bar chart (two greens) and the pie (amber/red/green — the worst-case triad for deuteranopia). The 21 history rows animate with a hardcoded `motion.div` (`:456-471`) and **no `useReducedMotion` guard**, unlike the `Stagger` wrappers imported on the same line.

**Why it matters.** This is a data-heavy surface, where accessibility and efficiency are the whole job. And the correct pattern — accessible pills, `FOCUS_RING`, `DataError` — is already written and shipping two routes away.

**Suggested command:** `/impeccable audit`

### [P2] No point of view — plus a banned token and two spent semantic colors
**What.** The generic grid described in the specificity verdict, compounded by two palette problems:

- `DARK_GREEN = '#5a8a1a'` (`:52`). `globals.css:120-133` records that `--color-dark-green` was **deleted outright** for failing AA, and `check-tokens.mjs:34` lists `dark-green` in `GHOST_TOKENS` so reintroducing it fails the build. **But the guard's `utilityPattern` and `cssVarPattern` match only class names and `--color-*` vars — a raw hex literal walks straight past it.** I verified this: it is the only place in `apps/web` where `#5a8a1a` reappears outside design mockups.
- `mealTypePalette = [GREEN, TOMATO, AMBER, ...]` assigns **`TOMATO` — the over-budget alarm color — to the second meal type**, typically Lunch, including its dot on every history row; `AMBER` (the caution band) goes to the third. Two of the app's three semantic status colors are spent as arbitrary categorical identity. On a page that *should* use red for "you overspent," **red already means lunch.**

**Why it matters.** The token guard exists because a silent palette regression already shipped a real bug once. And the semantic channel the page most needs is consumed before it can use it.

**Fix.** Delete `DARK_GREEN`; build the categorical palette from readable non-semantic hues; reserve tomato/amber/green for spending health. Extend `check-tokens.mjs` to flag banned hex literals, not just class names.

**Suggested command:** `/impeccable colorize`

## Persona Red Flags

**Alex (impatient power user)** — The number he came for **does not exist on the page**; it's in his browser's memory, unrendered. To see last month he must click "Custom" and hand-type two dates, every time — no `‹ Jul  Aug ›`. History rows carry `whileHover={{ background }}` so they light up under his cursor and **do nothing** — he will click one; pie slices and bars are equally inert. He will set "Week", read panel 02's bars as weekly, and **be wrong**. His scroll wheel gets captured by the `max-h-[360px]` nested scroller the moment the cursor drifts over panel 04. No sort, filter, export, or shortcut on an unpaginated table that can hit 90 rows.

**Sam (screen reader + keyboard, needs 4.5:1)** — Panels 01–03 are unlabelled `<svg>`: three quarters of the page is silent. Panel 04 is a fake table with no header association, so amounts are read with no indication they are amounts. The **first tab stop on the page has zero visible focus** and announces as "date edit." `RangeButton` has no `aria-pressed`, so "Month" being selected is conveyed *only* by color. Seven measured text elements fail AA, four of them badly (1.32–2.05:1). 21 rows animate past his reduced-motion preference.

**Casey (distracted mobile, thumb zone, 44×44)** — Every control fails the touch minimum; the date inputs are **18px tall**. Nothing is in the thumb zone: all controls sit in the header above roughly 1,300px of stacked content, so changing range from the bottom means scrolling all the way up. A nested `overflow-auto` sits exactly where her thumb rests, so a swipe scrolls the table instead of the page — and it **clips the 6th row mid-height** with no fade or affordance. Panel 02 renders up to 24 bars across ~320px (~13px per pair) with colliding 11px labels. And `range` is `useState` only — she types a custom range, takes a call, the tab reloads, and she's back at "this month" with both dates gone.

## Minor Observations

- **On the 1st of any month this page is nearly blank** — default is `thisMonth()`, so three of four panels render bare sentences in 256px boxes. Verified live (today 2026-08-01, seed data July 2026).
- **Tooltip formatters drop the series name.** `:358` and `:418` return a 1-tuple, which Recharts discards — on a two-series grouped bar, hovering shows "₨ 12,000" with no way to tell Budget from Actual. The line chart at `:314` returns the name and gets it right. Inconsistent within one file.
- **Empty-state alignment is inconsistent** — 01/02/04 render top-left, 03 centered (its wrapper alone has `flex items-center justify-center`).
- **`restaurantName` is rendered raw** (`:486`) while `restaurants/[id]` and `add-to-plan-modal` pass it through `humanizeName()` — scraped slugs will display as `kfc-gulberg-lahore`.
- **Home-cooked meals lose their identity** — `recent-activity.tsx` shows "🍳 Cooked at home" plus the dish; analytics shows `restaurantName ?? manualDescription`, so the same logged meal reads differently on two surfaces.
- `new Date('2026-07-15')` (`:178`, `:473`) parses as UTC midnight; `recent-activity.tsx:93` deliberately forces local with a `T00:00:00` suffix. Harmless at UTC+5, off-by-one at negative offsets.
- `mealTypePalette` is positionally indexed — adding or deactivating a meal type reshuffles every color in the donut and every row dot.
- Only 5 responsive utilities in 503 lines (`sm:` ×3, `lg:` ×2). Between 768–1023px the grid is still one column at `max-w-[1180px]` — ~960px-wide single-column charts.
- `analyticsQuerySchema` doesn't enforce `startDate <= endDate`; neither does the client.
- `layout.tsx` is a bare `AppShell` passthrough with no `metadata` export — no page `<title>`.
- The `Panel` component puts the decorative code **left** and the real title **right**: scanning down, the eye reads "01 02 03 04", not "Spending / Budget / Breakdown / History."

## Questions to Consider

1. **Should the range selector be calendar periods at all, or *plans*?** The API already supports `budgetPlanId`, which snaps to a plan's real boundaries. A user's mental unit is "my July budget," not "the calendar month." If the selector read `‹ July plan · Jun 24 – Jul 23 ›`, every panel could show budget-relative truth and the sidebar's remaining figure would finally correspond to what's on screen. What is the calendar buying you that the plan doesn't?
2. **What if the page opened with one sentence instead of four charts?** "You spent ₨ 24,300 of ₨ 30,000 this month — ₨ 5,700 left, on track for the 9 days remaining." Fully derivable from data already fetched. Would anyone miss the donut?
3. **Is the daily line the wrong shape entirely?** What a budget user needs isn't spend-per-day but cumulative spend against the ideal burn-down — one line rising, one descending, the gap named. That chart *is* the "budget drift" your subhead already promises. Why plot spending against zero when you could plot it against the budget?
4. **What is the donut actually for?** "Dinner is 45% of spend" — what does the user *do* with that? "You spent ₨ 8,400 more on dinners than the plan assumed" is actionable and comes from the same rows. Is the meal-type split a real question, or just the chart you build when you have a categorical field?
5. **Why can't you click anything?** Every mark has a meal behind it. The meal history is where a user *notices* they typed ₨ 4,500 instead of ₨ 450 — and can do nothing about it. Should that be read-only on a surface whose entire premise is that logged spend is the source of truth?
6. **What does this say to someone with two meals logged?** Four charts describing two meals. Should the surface earn its panels as data accumulates rather than presenting the full apparatus on day one?
