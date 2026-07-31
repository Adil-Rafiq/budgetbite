---
target: restaurants
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-26T21-21-02Z
slug: apps-web-app-restaurants-page-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)
Mode: **Operate** — the visitor completes a task (find food that fits what's left, then go order it elsewhere).
Inspection: **source + live API, no rendered pixels.** No browser automation was exposed to either agent. `/restaurants` returns `307 → /login` unauthenticated, so neither agent saw the page render. Assessment A compensated by querying the live API on `:3001` for the real seeded dataset (44 restaurants, one 365-item menu); Assessment B read the compiled CSS the dev server is actually serving. **No overlay was injected and none is visible in your browser.**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `isFetching` only surfaces inside the pagination block (`page.tsx:514,526`), which renders only when `totalPages > 1` — filter refetches swap results silently. Menu header shows unfiltered `menuStats.count` (`[id]:269`): filtering 365→3 still reads "365 items". |
| 2 | Match System / Real World | 2 | "From ₨ 24" is a plain roti. "Best for budget" sorts on avg price while the badge judges on min. "within budget" filter keeps items labelled **"Tight"** (`[id]:323`). ~12 of 44 live names are raw URL slugs with query strings. |
| 3 | User Control and Freedom | 2 | "← Back to restaurants" (`[id]:143`) hard-links the bare route, discarding every filter. `router.replace` on paging (`page.tsx:104`) leaves no history, so Back exits the surface. Chips + "Clear all" are the redeeming half. |
| 4 | Consistency and Standards | 1 | `DataError`, `RemainingAmount`, `StatTile`, `tabular-nums`, `focus-visible`, `--color-amber` — six house patterns, all absent here. Verified: `focus-visible` 0 hits on this surface vs 6 in dashboard; `tabular-nums` 0 here vs 32 repo-wide. `formatCount` (`page.tsx:55`) vs `toLocaleString()` (`[id]:172`) render the same field two ways. |
| 5 | Error Prevention | 2 | `AddToPlanModal` calls the same `recordChoice` mutation as `LogMealModal` but ships none of its over-budget arm-then-confirm guard (`log-meal-modal.tsx:224-256`). It prefills the menu price as "actual amount spent" (`add-to-plan-modal.tsx:66`), nudging users to log the estimate rather than the real total. |
| 6 | Recognition Rather Than Recall | 2 | Budget context evaporates exactly when it matters: `avgPerMeal > 0` gates both the header block (`:217`) and every fit badge (`:424`), and `avgBudgetPerRemainingMeal` is `0` when `mealsRemaining === 0` (`plan-math.ts:111`). Last day of a period = a plain restaurant directory. |
| 7 | Flexibility and Efficiency | 2 | URL-backed state is a real accelerator. Undercut by no `/`-to-search, no saved filters, slider+presets duplicating one value, and 365 menu items with no category jump (`[id]:362`). |
| 8 | Aesthetic and Minimalist Design | 2 | Filter chrome (~450px stacked on mobile) outranks results. "Nearby · Restaurants" above `<h1>Restaurants</h1>` (`:206-211`) plus sidebar item plus breadcrumb = four "Restaurants" in one viewport. The `code` badge is decoration in the card's primacy slot. |
| 9 | Error Recovery | 1 | Four errors, four dead ends — `page.tsx:408`, `[id]:152`, `[id]:337`, `recommendations:194` — all bare `<p>` with no retry, while `data-error.tsx` (retry-in-place, adopted in 7 other files) sits unused. The no-location note (`:322`) says "Set your location in profile" and **is not a link**. |
| 10 | Help and Documentation | 1 | Nothing defines "Fits budget" / "Tight". Nothing says what "From" measures. Nothing says prices are best-effort estimates. Nothing says fees and minimums are excluded. Nothing anywhere says "we don't order — order on Foodpanda, then come back and log it." |
| **Total** | | **17/40** | **Poor — major UX overhaul required** |

All ten heuristics apply (Operate surface); none scored n/a.

## Design Specificity Verdict

**LLM assessment.** Strip the ₨ symbol and the word "budget" and this is a stock listing page. Search + sort-select + two sliders + preset chips in a bordered card, then a 3-column grid, then prev/next. That skeleton serves hotels, used cars, or gyms unchanged. The card's information order — index badge, star top-right, truncated name, meta row, price bottom-left — is the default e-commerce card. Nothing about the *shape* of this page says "a person with ₨900 left is deciding where dinner comes from."

What is authored is thin but real: `BudgetFitBadge` reusing `classifyBudgetFit` from `@repo/shared` so client badge and server sort share thresholds; `pricesUpdatedAgoLabel` freshness; the "no menu yet" honest null; `formatPKR` as one money renderer; URL-backed filter state. About five details.

**And the flagship authored detail is broken in a way that inverts the product's premise.** The card classifies fit from `r.minItemPrice` (`page.tsx:424-430`) — the cheapest item in the entire menu. In live data, `Asli Karachi Paratha Roll` has `minItemPrice: 24` / `avgItemPrice: 1076`; the ₨24 item is "Sada Roti." Seven of 44 restaurants exceed a 25× avg/min ratio. Against a ₨400 per-meal target, **43 of 44 cards render green "Fits budget."** The one signal this surface exists to provide has near-zero discriminating power and points the wrong way.

It fails twice in the same pixel. The card renders `₨ 199 fee` and `min order ₨ 249` (`:474, :497`) — and the badge ignores both. That ₨24 roti costs ₨448 minimum to actually receive. And the definitions diverge: `restaurant.repo.ts:112-117` tiers "Best for budget" on avg price (its own comment says so), while the badge classifies on min. **Two contradictory definitions of "fits your budget" on the same card.**

**Deterministic scan.** `detect.mjs --json` returned **0 findings, exit 0** across five invocations — the directory, all eight files explicitly, the two shared components, and `--no-config`. Assessment B proved the scan was live rather than a silent no-op with a control file (a synthetic bounce-easing curve fired correctly), and confirmed no suppression: no `.impeccable/config.json`, no `ignoreRules`/`ignoreFiles`, no `DESIGN.md`.

**Read that clean result correctly: it is a false-negative signal, not a health certificate.** The detector's non-HTML mode is regex pattern matching — it does not resolve Tailwind tokens, compute contrast, or measure hit areas. Every real defect on this surface lives in exactly those blind spots. There are no false positives to adjudicate because there were no findings.

**Where the two assessments converged independently** — the strongest signal in this run: both found that `food-preference-toggle.tsx` styles itself with `border-lumen-dk`, `text-soft`, `text-pulse`, `bg-pulse/[0.10]`, `border-pulse` — tokens that **do not exist**. A found it by grepping `globals.css`; B confirmed it against the CSS chunk the dev server is actually serving (`.text-pulse`, `.border-lumen-dk`, `.bg-pulse`: zero occurrences; `.text-amber`, `.text-green`, `.text-slate`: present). I re-verified: no `--color-pulse`/`--color-lumen`/`--color-soft` in any source CSS, and no `tailwind.config.*` exists. Both also independently cleared `BudgetFitBadge` of color-only encoding.

**What B caught that A missed:** exact contrast arithmetic from resolved hexes; an exhaustive touch-target table showing **nothing on this surface reaches 44×44** (largest is "Call" at ~37.5px); 33 occurrences of sub-12px type; an unlabeled `Select` in `add-to-plan-modal.tsx:177-197`; and a factual error in the codebase's own documentation — `globals.css:131` claims `amber-ink` on `amber-tint` is ~7.1:1, computed it is **5.50:1** (still passes AA, but the comment is wrong).

**Visual overlays.** None. Browser automation was not exposed, so script injection was never attempted, no live-server was started, and nothing is highlighted in your browser. Neither agent started any server; the `:3000`/`:3001` processes were already running and were left untouched.

## Overall Impression

This surface was built competently and then never swept. The engineering instincts are good — URL state is properly round-tripped, thresholds live in `@repo/shared`, progressive disclosure on the detail menu is a genuinely considered decision. But it reads as authored *before* the design system existed: zero focus rings, zero `tabular-nums`, four dead-end error strings, two hardcoded `#f5a623` hexes against a token created specifically to kill them, and `RemainingAmount` — a component whose docblock records a real shipped bug where "₨ -5,000 remaining" skimmed as "5,000 remaining" — reintroduced raw in two places here.

The single biggest opportunity is not visual. **Make the budget signal true.** Fix the badge to classify on a realistic meal cost including delivery and minimum order, unify it with the server sort, and lead the card with typical price instead of menu floor. That one change converts the surface from decorative-honest to actually honest, and it is the only reason this product exists.

## What's Working

1. **URL-as-state, done properly.** `updateParams` (`page.tsx:94-107`) round-trips q/sort/distance/rating/page through `searchParams` with a 300ms debounce, automatic page reset, and a re-sync effect for back/forward (`:122-124`). Filters survive refresh, deep-link, and share — the right call for a surface people open daily.
2. **`classifyBudgetFit` as shared truth.** Thresholds in `@repo/shared` so server sort and client badge read the same constants, one `BudgetFitBadge` used by both restaurants and dashboard meal-slots, and the badge carries **text labels** ("Fits budget" / "Tight" / "Over budget"), not color alone. The architecture is right — only the input is wrong.
3. **Progressive disclosure on the detail page.** `MENU_CONTROLS_THRESHOLD = 6` (`[id]:33,137`) hides search/sort/filter until the menu is big enough to need them; a 4-item menu shows zero chrome. A real decision — and exactly the pattern the list page needs and lacks.

## Priority Issues

### [P0] The budget-fit badge is computed from the wrong number and ignores the real cost
**Why it matters:** Product principle 1 says budget adherence *is* the product; principle 2 says ground everything in reality. A badge that goes green 43 times out of 44 is worse than no badge — it launders an unaffordable restaurant as safe for precisely the user who cannot absorb the error. And the sort and the badge disagree about what "fits" means, so the same card can rank as budget-friendly for one reason and be badged for another.
**Fix:** Classify on a realistic meal cost, not the menu floor: `max(avgItemPrice, minimumOrder ?? 0) + (deliveryFee ?? 0)`. Route both the badge and `restaurant.repo.ts`'s budget-fit sort through one shared helper so they can never diverge again. Lead the card with `Typical meal ₨ 1,076` at full weight and demote "from ₨ 24" to the 11px line. Add one disclosure under the grid: *"Typical meal includes delivery. Prices are estimates from the last menu update."*
**Suggested command:** `/impeccable harden`

### [P0] Blocking a dish renders invisibly — the toggle uses four tokens that do not exist
**Why it matters:** `food-preference-toggle.tsx:85,102-103` uses `border-lumen-dk`, `text-soft`, `border-pulse`, `bg-pulse/[0.10]`, `text-pulse`. None are defined; Tailwind v4 emits nothing for unknown color utilities, confirmed against the served CSS chunk. Favoriting works (`amber` is real); **blocking renders identically to unset.** This component ships on the restaurant header (`[id]:182`) and on all 365 menu cards (`[id]:414`). A block is a hard exclusion on the AI planner — the user bans a dish, the mutation succeeds, the UI says nothing changed, so they click again and un-block it. Silent destruction of a core preference signal.
**Fix:** Map to real tokens — `border-tomato bg-tomato/10 text-tomato` for blocked, `border-sage text-slate` for rest. Then add a guard so undefined color utilities fail the build: `ui/pill.tsx:25-28` carries the same rot (`text-vast`, `hover:bg-lumen`, `hover:border-soft`), and `api-wakeup-banner.tsx:19` reads `var(--color-lumen)` inline, which resolves to nothing.
**Suggested command:** `/impeccable polish`

### [P1] Four dead-end error states, and the no-location state guts the page while the copy keeps promising
**Why it matters:** `page.tsx:408`, `[id]:152`, `[id]:337`, `recommendations:194` are bare `<p>` tags — no retry, no cause, no next step — while `data-error.tsx` (retry-in-place, adopted in 7 other files) exists for exactly this. The stated usage scene is a phone on mobile data, where a dropped request is routine and a dead end means reloading the whole app. Separately, `page.tsx:321-325` tells the user "Set your location in profile to enable distance" as plain 11px text **with no link**, while the header still claims "Places that deliver to you, ranked for your budget" (`:212`) — both halves false in that state, since sort silently falls back to name and no distance is shown at all.
**Fix:** Swap all four for `<DataError message=… onRetry={() => refetch()} />`. Make the location note a `<Link href="/profile">`. Make the header subtitle conditional: when `!hasLocation`, read *"All restaurants, A–Z. Set your location to see what's near you."*
**Suggested command:** `/impeccable harden`

### [P1] The bridge to the real next step is never stated — the loop never closes
**Why it matters:** "Order on Foodpanda" (`[id]:188-197`) opens a new tab and nothing before, during, or after tells the user to come back and log what they spent. "Add to plan" (`[id]:419-428`) sits at the bottom of each of 365 cards, disconnected from the order button, and `AddToPlanModal` prefills the *menu* price as "actual amount spent" (`add-to-plan-modal.tsx:66`) with no mention of the delivery fee the card just displayed. Principle 3 is "the user acts; the app learns" — if actual spend never gets logged, re-planning is fed estimates and the product's feedback loop is dead. The app never ordering is the defining constraint of this product, and it is stated on no pixel of this surface.
**Fix:** Restructure the header CTA as an explicit two-step: `1 · Order on Foodpanda ↗`, then a persistent `2 · Log what you spent` opening `AddToPlanModal`. On window refocus after the external click, surface a dismissible prompt: *"Ordered? Log the actual total (including ₨ 199 delivery) so your plan stays accurate."* Show `+ ₨ 199 delivery` as a hint under the amount field, and port `LogMealModal`'s over-budget confirm guard.
**Suggested command:** `/impeccable clarify`

### [P2] Zero focus states, unlabeled sliders, no target over 38px, and sub-AA contrast on every honesty label
**Why it matters:** Verified: `focus-visible` returns **0 hits** across `app/restaurants/` (dashboard has 6) — no ring on the 24 card links, the 9 preset chips, the filter chips, or pagination. Both sliders have a `<Label>` with no `htmlFor` and no `aria-label` (`page.tsx:288-300, 329-346`); Radix puts `role="slider"` on the thumb, so both announce unnamed. Thumbs are `size-4` = **16px**, under the 24px WCAG 2.5.8 floor. **Nothing on the surface reaches 44×44** — preset pills compute to ~22.5px tall, "Clear all" to ~16.5px, pagination to 32px, the largest affordance ("Call") to ~37.5px. Contrast, computed from resolved hexes: `text-slate/60` on white = **3.10:1** (that's `labelClass`, the rating count, "From", "avg ₨", "no menu yet", and the price-freshness label — the entire price-honesty story); `text-green` on white = **2.05:1**, which includes every menu item price at `[id]:408` in 16px semibold; "Fits budget" pill = 3.86:1; "Over budget" pill = 3.34:1; the disabled-state hint compounds `opacity-40` onto `slate/60` for **1.48:1**. `globals.css:115-121` already documents this and ships `--color-green-deep` at 4.97:1 — unused here. And 0 uses of `tabular-nums` on a grid of 24 stacked PKR figures, against 32 repo-wide including `stat-tile.tsx`, whose comment reads *"money in a 3-across grid needs aligned digits."*
**Fix:** Extract the house `focusRing` constant and apply it to every interactive element here. Add `aria-label="Maximum distance in kilometres"` / `"Minimum rating"` to both sliders and pair the Labels with real `htmlFor`/`id`. Bump thumbs to `size-6` with a `::before` 44px hit area, and give preset pills `py-2`. Promote `text-slate/60` → `text-slate` and `text-green` → `text-green-deep` for all text on white. Add `tabular-nums` to every `formatPKR` output.
**Suggested command:** `/impeccable audit`

## Persona Red Flags

**Casey (distracted mobile user) — 7pm, one-handed, phone**
- Filter panel is `grid-cols-1` on mobile: search + sort + slider + 5 chips + note + slider + 4 chips ≈ **450px of chrome**. With the sticky `AppHeader` (~56px) and `MobileNav` (~64px), **zero results are visible without scrolling.** No collapse, no "Filters (2)" sheet.
- Two 16px slider thumbs under a thumb on a vertically scrolling page; `touch-none` means a mis-grab does nothing at all.
- Taps "Next →" at the bottom → `scroll: false` (`page.tsx:104`) parks her at the **bottom of page 2**, facing pagination controls with 24 unseen cards above her.
- Names `truncate` to one line (`:468`) — on a 360px screen she reads "akhtar-nihari-biryani-bar-bq-and-restara…".

**Sam (accessibility-dependent) — screen reader + keyboard**
- Tabs through 24 cards with no visible focus ring, then 9 preset chips with none, then pagination with none.
- Both sliders announce unnamed; the "Meal" select in `add-to-plan-modal.tsx:177-197` is reachable but unlabeled.
- The rating chip's `aria-label={\`Remove ${chip.label}\`}` (`:385`) produces **"Remove black star 4 plus."**
- Disabling the distance controls (`:299, :308`) fires no live region and no `aria-describedby` to the explanatory note — controls go dead and silent.
- Menu item prices at 2.05:1; every filter label at 3.10:1.

**Riley (stress tester)**
- **Scale:** `/restaurants/{id}` renders **365 menu cards** in one flat grid, 363 lazy images, no virtualization, no pagination, no category grouping (`[id]:362`) — roughly 90,000px of mobile scroll.
- **Zero results:** deep-link `?page=99` → empty array, no active chips → empty state reads *"No restaurants found — try widening your radius"* despite 44 restaurants existing and page 1 being one click away. The same message fires for a no-location user whose radius filter isn't even applied.
- **Long input:** ~12 of 44 live rows are raw URL slugs — `jalal-sons-dha-iii?eo=large_order_swimlane` renders as a restaurant name, query string included. `buildFoodpandaUrl` (`[id]:44-46`) then interpolates that slug unencoded, growing an unintended query string.
- **Duplicates:** "Saudi Xpress" and "Saudi Xpress DHA", identical min/avg (70/623), both listed.
- **Refresh mid-flow:** survives — genuine win. **Back button:** `router.replace` leaves no history, so Back exits the surface entirely.

**Hira (project-specific) — Lahore, ₨ 900 left, 6 meals to go**
- Opens `/restaurants` at 7pm with `avgBudgetPerRemainingMeal = 150`. Card after card shows green **"Fits budget"** — because `minItemPrice` on most vendors is a naan. She taps `Balochi Dera` (min 24 / avg 1,028) into a 365-item menu whose median dish is ₨850.
- If she has already overspent: `formatPKR(amountRemaining)` prints **"₨ -450 remaining"** in 11px slate (`:225`), and in neutral **charcoal** on the detail strip (`[id]:229`) — the exact skim-failure `remaining-amount.tsx` was written to prevent.
- If the clamped path zeroes `avgPerMeal` (`plan-math.ts:109-111`), every budget affordance disappears and the detail page invites her to **"Start a budget plan"** she already has (`[id]:245`).
- Nothing tells her the ₨199 delivery fee and ₨249 minimum order stand between her ₨900 and any of these meals.

## Cognitive Load

**7 of 8 checklist items fail → CRITICAL.** Only *grouping* passes (filter card / chips / grid / pagination are cleanly delineated).

Notable failures: **visual hierarchy actively inverts accuracy** — "From ₨ 24" renders at 16px full-opacity charcoal while the truthful "avg ₨ 1,076" sits at 11px `slate/60` (`:485-491`), and the meaningless `code` badge holds the card's top-left primacy slot. **Working memory** fails twice: the per-meal target appears only at ≥sm *and* only when `avgPerMeal > 0`, and "Back to restaurants" wipes the filter set the user just built.

Decision points above the ≤4 threshold:
- **Filter panel: 15 interactive elements** (search, sort, 2 sliders, 9 chips) before one result is visible.
- **Distance:** 5 presets *plus* a redundant 30-stop slider for the same value — two controls, 35 reachable values. Rating repeats the pattern (4 presets + 11-stop slider).
- **Sort:** 4 options, two of which ("Default (distance)" and "Distance") produce the same order under different names (`:273-280`).
- **Detail menu: 365 cards, one flat ungrouped list.** Worst offender by an order of magnitude.

## Emotional Journey

**Peak: essentially absent.** The designed peak is spotting a green "Fits budget"; in real data ~43/44 cards carry it, so it delivers no relief. The one true peak is small and buried — `AddToPlanModal`'s CTA reading `Log ₨ 450` (`add-to-plan-modal.tsx:253`), which states the exact consequence of the click.

**Valleys:** (1) No active plan → header budget block, `budget-fit` sort, and every fit badge silently vanish, with no explanation and no "create a plan" prompt on the list page — and since the seed's demo plan `endedDaysAgo: 2`, **this is the default demo experience.** (2) Over budget → negative PKR rendered raw in low-contrast 11px. (3) Any network blip → a flat red sentence. (4) Tapping a promising card → 365 uncategorized items and a median dish 35× the price that got you there.

**End:** a `target="_blank"` hand-off to Foodpanda with no sentence about returning to log. The loop the entire product depends on ends in someone else's tab.

## Minor Observations

- The `code` badge (`:431,447`) is a row index. In the card's top-left primacy slot, under a "Sort by rating" the user just chose, "01" reads unambiguously as **rank**. It carries no information and is unstable across sorts and pages.
- `formatCount` renders `1200` as `1.2k`; `[id]:172` renders the same field as `1,200`. One number, two formats, one click apart.
- Hardcoded `#f5a623` at `page.tsx:453` and `[id]:170`, despite `--color-amber: #f5a623` existing at `globals.css:129` with a comment naming this exact drift. `recommendations/page.tsx:34` hardcodes `bg-[#fef6e6] text-[#8a5a12]` — the literals that comment says were consolidated into `amber-tint`/`amber-ink`.
- `globals.css:131` documents `amber-ink` on `amber-tint` as ~7.1:1; computed it is **5.50:1**. Still passes AA, but the codebase's own contrast note is wrong.
- `"within budget"` (`[id]:323`) filters `fit !== 'red'`, keeping items badged "Tight" (up to 1.3× target). The copy overclaims.
- `FIT_RANK` includes a `'none'` key (`[id]:37-42`) that `classifyBudgetFit` can never return — dead branch.
- `Suspense fallback={null}` (`:546`) renders the shell with a blank main before skeletons appear — a two-stage flash on cold load.
- `Stagger` at 0.05 (`:421`) means the 24th card lands **1.2s** after the first, and re-staggers on every filter change.
- Ratings are Foodpanda's, shown with no attribution — not fabricated (correct), but "4.6 ★ · 500" could read as a BudgetBite rating.

## Questions to Consider

1. If 43 of 44 cards say "Fits budget," what is the badge for? Would this surface be more honest with **no** badge than with one that is right by accident?
2. The card shows `deliveryFee` and `minimumOrder` an inch from a badge that ignores both. Who decided those numbers were decoration rather than part of the price?
3. Why does the *detail* page have a "no active plan" state and the *list* page — the entry point, and the default demo experience since the seeded plan has already ended — have none?
4. Is a distance slider the right control for a phone at dinnertime, or are the five presets the actual control and the slider a desktop habit that shipped to mobile?
5. `RemainingAmount` exists because "₨ -5,000 left" once skimmed as "5,000 left." Why does this surface print `formatPKR(amountRemaining)` raw in two places — and what else in the repo hasn't been swept?
6. The app never orders. That is the defining constraint of the product. On which pixel of this surface is it stated?
7. 365 menu items, one flat grid, no categories. What would this page look like if it were designed for someone choosing dinner rather than for someone auditing a menu?
