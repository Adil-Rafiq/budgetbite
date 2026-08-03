---
target: Admin
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 3
timestamp: 2026-08-03T16-39-02Z
slug: apps-web-app-admin
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated). Neither saw the other's output before synthesis.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading/empty/error states on all 8 list pages, but nothing proactive: no failed-run badge, no "last refreshed", bulk delete shows one indeterminate spinner while the hook counts successes it never reports (`use-admin-restaurants.ts:82-87`) |
| 2 | Match System / Real World | 2 | Admin sees raw scraped `r.name` (`restaurants/page.tsx:257`) where the customer page runs `humanizeName` — the operator judging data quality reads a different string than the user does. Raw kebab `menu-item` in audit; SCREAMING_SNAKE env keys in config |
| 3 | User Control and Freedom | 1 | No undo on any delete though `showToast` has an action slot (`lib/toast.ts:7-10`) unused; bulk delete cannot be aborted; `use-unsaved-changes.ts` exists and no admin modal imports it — Cancel discards 12 typed fields silently |
| 4 | Consistency and Standards | 2 | `font-mono` as class and as inline `style={{fontFamily}}` in the same file (18 occurrences, 8 files); two focus-ring treatments; 11 hand-rolled error divs while `components/data-error.tsx` exists |
| 5 | Error Prevention | 3 | 6/6 destructive paths guarded by AlertDialog with good copy. Deducted: bulk delete names no restaurant and no cascade count; `move()` (`meal-types/page.tsx:50-56`) fires two unsynchronised writes — partial failure leaves duplicate `sortOrder` |
| 6 | Recognition Rather Than Recall | 1 | `data-quality/page.tsx:95-99` lists invalid-price items as inert strings with no link, and no menu-item search exists anywhere in the admin API. The highest-severity defect class has no path to a fix |
| 7 | Flexibility and Efficiency | 1 | Zero keyboard shortcuts; no column sorting on six tables; search/offset/selection in `useState` so nothing is bookmarkable or refresh-safe; selection wiped on page change caps every bulk action at 20 |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely restrained, correctly un-chromed tables, zero hardcoded colors — full token adherence verified. Deducted for the Overview duplicating the nav |
| 9 | Error Recovery | 1 | `errorMessage` is on the contract, fetched, and never rendered (`ingestion/page.tsx:82-89`) — the page built to answer "did ingestion break" is diagnostically empty. Eleven "Try again." messages with nothing to press |
| 10 | Help and Documentation | 2 | Two excellent inline field notes tying an admin keystroke to a customer-visible outcome. Nothing else explains consequence |
| **Total** | | **18/40** | **Poor — major overhaul on the two primary tasks** |

All ten heuristics apply; this is an Operate surface with no n/a exemptions.

## Design Specificity Verdict

**LLM assessment: category-interchangeable.** Swap `formatPKR` for `formatUSD` and change two placeholder strings, and nothing in the composition, interaction model, or visual language would notice. The complete inventory of product character across ~2,300 lines and 11 routes is: `formatPKR` in four money columns, the placeholders `"e.g. Burns Road Nihari"` and `"e.g. Chicken Karahi"`, and two inline field notes.

Structural sameness is near-total. Eight of eleven routes are one component with different nouns: `h1` → subtitle → optional filter row → card containing a four-way ternary → Prev/Next. The pagination block is byte-identical in five files. The status-pill map is declared four separate times. The `money` helper is redeclared in four files.

The stated job is not the spine. The operator's real job is keeping scraped data trustworthy because bad menu data poisons AI suggestions. In this IA, Data quality is nav item #8 of 10, omitted entirely from the Overview, and the Overview's six metric tiles report vanity counts — not one is a trust signal. No "last successful scrape", no "restaurants with zero items", no "items priced ≤ 0".

**Deterministic scan: 0 findings, exit 0.** Assessment B verified this is genuine rather than a broken glob three ways: called `walkDir()` directly (returned all 18 `.tsx` files, parentheses resolved fine), fed the pipeline a synthetic violation (correctly caught), and confirmed no ignore rules in config. The detector's ruleset covers slop/motion/color, not a11y or responsive coverage — which is why the static sweep carried the real findings.

**Visual overlays: none.** No browser-automation tool is exposed, so no overlay is visible in the user's browser. `/admin` also returns 307 → `/login` unauthenticated (`proxy.ts` cookie gate) and is double-gated by `AdminGuard`, so live inspection would need a seeded admin session. Steps were impossible, not attempted-and-failed. The dev server was already running and was left untouched.

## Overall Impression

The chrome is excellent and the plumbing is disciplined; the product thinking is absent. The shell is a faithful sibling of the user-facing app, the mutation layer scopes pending state per row and toasts both outcomes, and token adherence is total. Then every page built for the operator's actual job dead-ends.

The single biggest opportunity: this admin is organized as a CRUD directory when its one job is data trust. The Overview should be a verdict, not a link farm.

## What's Working

1. **The shell is a room in the house, not a separate building.** `admin-shell.tsx:104-128` reproduces `app-sidebar.tsx:62-82` recipe-for-recipe — same rail geometry, same four-signal active state (tint wash + filled icon chip + semibold + `aria-current`), same skip link. An operator switching from `/dashboard` to `/admin` relearns nothing, and the four-signal active state is exactly what the 1.16:1 tint requires to never be load-bearing alone.

2. **The mutation layer is more disciplined than the UI layer.** Pending state is scoped to the specific row (`restaurants/page.tsx:242-243`), so deleting one row doesn't grey out the other nineteen. `key={form.restaurant?.id ?? 'new'}` forces a remount so an edit form can never inherit the previous row's defaults — a real bug class, pre-empted. Every write toasts both outcomes with the server's own message.

3. **Two inline field notes are the only writing that knows what product it's in.** `menu-item-form-modal.tsx:122-127` explains that section grouping is by exact string, so a stray lowercase `"starters"` splits the menu on the public page. That connects an admin keystroke to a visible customer outcome at the moment of entry. It's the standard the rest of the surface should meet.

4. **Verified-clean fundamentals.** All 8 icon-only buttons carry `aria-label`; 6/6 destructive actions guarded; skeleton-or-spinner plus explicit empty state on all 8 list pages; zero hardcoded hex/rgb/arbitrary Tailwind color; zero `dangerouslySetInnerHTML`; every table wrapped in `overflow-x-auto`.

## Priority Issues

### [P0] The admin has no navigation below 1024px
`admin-shell.tsx:75` renders the sidebar `hidden … lg:flex`, and the mobile header offers only "App" and "Sign out". There is no Sheet, Drawer, or hamburger anywhere in the file. The Overview's card grid lists only 6 of 10 destinations, omitting Recommendations, Data quality, and Config.

**Why it matters:** below `lg`, all ten admin routes are unreachable except by typing URLs, and three of them are unreachable even from the Overview. The user-facing app already ships `components/mobile-nav.tsx` precisely because this was fixed once before. Confirmed independently by both assessments and by direct inspection.

**Fix:** port `mobile-nav.tsx` into `AdminShell` as a Sheet triggered from the header. Separately, drive the Overview's `sections` array from the same `navItems` constant so the two can never drift again.

**Suggested command:** `/impeccable adapt`

### [P0] Ingestion never shows why a run failed
`ingestion/page.tsx:82-89` renders `run.status` as a pill and stops. `errorMessage` is defined on the contract (`packages/shared/src/schemas/scraper-run.ts:16`), populated on finish, fetched by the hook, and discarded. `latitude`/`longitude` are also dropped, so a run with `area === null` is geographically anonymous.

**Why it matters:** "notice ingestion broke" is one of the two primary admin tasks, and the page built for it is an obituary with the cause of death removed. The operator must leave the product for server logs. Peak-end rule: the most important journey terminates in helplessness.

**Fix:** render `errorMessage` in an expandable row in mono/`tomato-ink`; show `area ?? lat,lng`; badge the Ingestion nav item with failed-run count using the pending-recommendations pattern already built at `admin-shell.tsx:122-127`.

**Suggested command:** `/impeccable harden`

### [P0] Data quality dead-ends on the one defect that poisons the AI
`data-quality/page.tsx:95-99` renders `itemsInvalidPrice` without `linkRestaurants`, so each zero-or-negative-priced item is an inert string. No menu-item search exists in the admin API (`lib/api/endpoints/admin.ts:64` lists items only by restaurant id), and restaurant search is name-only.

**Why it matters:** an item priced ₨0 makes every plan containing it under-count spend — precisely the failure the product cannot tolerate — and it is the only group on the page with zero remediation path. The admin must memorise a dish name and guess its restaurant.

**Fix:** add `restaurantId`/`restaurantName` to `dataQualityEntitySchema`, render each sample linking to `/admin/restaurants/{id}` with the item's edit modal deep-linked. Rank the four sections by severity rather than four equal cards.

**Suggested command:** `/impeccable shape`

### [P1] `text-slate/60` fails AA and carries whole columns of real data
`--color-slate` is `#5c5145`; at 60% over white it computes to **2.90:1** — under both the 4.5:1 body floor and the 3:1 large-text floor. Independently verified. It appears **87 times** across the admin: the entire "Added", "Joined", and "When" columns, menu-item descriptions, every config description, every empty and error state, every "N total" and "Page X of Y".

**Why it matters:** this is timestamps and descriptions the operator reads to judge records, not decoration. It's conspicuous because `globals.css` spends 60 lines proving the team knows exactly this arithmetic.

**Fix:** use `text-slate` (clears AA comfortably) for all secondary data, or add a `--color-slate-muted` token that clears 4.5:1, and replace the 87 occurrences.

**Suggested command:** `/impeccable audit`

### [P1] Eleven load failures are dead ends, and the fix already exists in the codebase
All eleven admin pages render a plain div reading "Could not load X. Try again." — no `role="alert"`, no retry control, and an instruction with nothing to press. `components/data-error.tsx` exists, carries `role="alert"`, wires `refetch`, and is used throughout the user-facing app.

**Why it matters:** the admin's usage scene is the same flaky-connection scene the user's is, and a screen-reader user gets no announcement at all.

**Fix:** replace all eleven with `<DataError message=… onRetry={refetch} />`, destructuring `refetch` from each `useQuery`.

**Suggested command:** `/impeccable harden`

### [P1] Bulk delete is irreversible, opaque, and discards partial progress
`use-admin-restaurants.ts:80-98` runs a sequential loop with no progress reporting, no abort, and an `onError` that throws away the `deleted` counter and reports only "Bulk delete failed".

**Why it matters:** after a mid-loop failure the operator cannot know whether 3 or 30 restaurants — and all their menu items — are gone, in the one product area where knowing the true state of the data *is* the job. The dialog never states how many menu items die with them.

**Fix:** carry `{deleted, failedName}` on the error, report "Deleted 12 of 47 — stopped at 'Burns Road Nihari'", render "Deleting 12 / 47…", add abort, and put the cascade count in the title.

**Suggested command:** `/impeccable harden`

### [P2] Export CSV silently exports 20 rows
`restaurants/page.tsx:115` maps `rows` — the current page — not the full result set, then downloads it as `restaurants.csv`. Verified directly. On a 1,000-restaurant catalogue the button sits next to "1000 total" and produces a 20-row file with no warning.

**Fix:** either fetch the full set for export or label it "Export this page (20)".

**Suggested command:** `/impeccable clarify`

## Cognitive Load: 6 of 8 checks fail — CRITICAL

Failing: single focus, chunking, visual hierarchy, minimal choices, working memory, progressive disclosure. Passing: visual grouping, one-thing-at-a-time.

Decision points exceeding 4 visible options:
- `admin-shell.tsx:29-40` — 10 nav items in one flat list under a single "manage" label
- `admin/page.tsx:87-92` + `:99-118` — 6 metric tiles and 6 section cards, all identical weight
- `restaurants/page.tsx:146-204` — up to 5 toolbar controls in one undifferentiated row; the Delete button mounts/unmounts and shifts the rest
- `restaurants/page.tsx:222-238` — 7 columns, 4 interactive targets per row
- `restaurant-form-modal.tsx:85-242` — 12 flat fields including `latitude`, `longitude`, `externalId`, `slug`; no fieldset, legend, or group heading
- `recommendations/page.tsx:147-155` — 6 columns, first cell holding up to 10 stacked elements in a `whitespace-nowrap` cell
- `config/page.tsx:7-30` — 6 flat rows mixing geo radius, AI input caps, and LLM identity

Working memory specifically: `data-quality/page.tsx:98` gives an item name that must be carried to a search that cannot find it. `restaurants/[id]/page.tsx:74-80` omits `externalId`, `orderUrl`, and `updatedAt`, so verifying a record against Foodpanda means holding the name in your head and leaving the app.

## Persona Red Flags

**Alex (power user):** `/` doesn't focus search. No `e` to edit, no `Cmd+Enter` to submit a modal, no shortcuts at all. Export CSV silently gives 20 rows. Pagination is Prev/Next only — reaching restaurant #900 costs 45 clicks. Bulk delete caps at 20 because selection is wiped on page change. No column sorting on any of six tables, so he cannot sort by rating to find the unrated. On a failed ingestion run he cannot see why, cannot re-trigger the scraper, and cannot filter to failures. One thing he'll like: search debounces at 300ms.

**Sam (accessibility-dependent):** 7 unlabeled inputs — search on restaurants and users, and four Selects on audit/users/plans/recommendations — all relying on placeholder text that vanishes on input, while the user-facing equivalent labels correctly. Zero of six tables has a caption or `aria-label`; `TableCaption` is exported and never imported. No `scope` on any `<th>`. No `role="status"`/`aria-live` anywhere, so result-set changes are unannounced — the user-facing page does exactly this. Pressing Next onto the last page sets `disabled` on the button holding focus, dropping focus to `<body>` silently. Two different focus treatments: the shell's solid 2px `teal-deep` at 7.04:1 versus shadcn's default 50%-alpha ring with no offset on every in-page control. Plus the 2.90:1 contrast on the columns carrying the answers.

**Riley (stress tester):** A deleted restaurant renders as a plausible empty one — `restaurants/[id]/page.tsx:48-52` has no `isError` branch, so a 404 id yields `<h1>Restaurant</h1>` and "No menu items yet." Silent failure on the record-fixing path. Every `TableCell` is `whitespace-nowrap`, so a 90-character scraped name pushes edit/delete off the right edge. Audit truncates `entityId` to 8 chars with no title, copy control, or link — the log cannot trace a record. Reorder fires two mutations with two success toasts and no optimistic update; a second-write failure leaves duplicate `sortOrder`. Refresh mid-edit loses 12 typed fields with no guard. All-clean data quality is four blank cards with no "last checked" and no re-check.

## Minor Observations

- `admin/page.tsx:76` — the `h1` is literally `Admin.` with a full stop at `clamp(28px,3.6vw,40px)`; nothing else in the admin uses either the punctuation or the scale
- The sticky header's entire desktop content is the word `admin` in mono, duplicating the rail's own `admin` monogram — a permanent ~57px band carrying no breadcrumb and no page title
- `recommendations/page.tsx:185` uses `key={idx}`; every other list keys on stable ids
- `totalGenerations` is fetched and never displayed — arguably the most interesting number for an AI product
- `plans/page.tsx:117` renders plan status as raw lowercase text beside `latestAttempt.status` as a coloured pill — two encodings of "status" in adjacent columns
- Config shows `AI_PROVIDER` and `AI_MODEL_NAME` but never whether `AI_API_KEY` is set or the provider is reachable
- Every admin page is `'use client'` with no `metadata` export — all eleven browser tabs read identically
- `can(user.role, …)` is checked in five pages, but `AdminGuard` already redirects non-admins and `ROLE_PERMISSIONS.admin === PERMISSIONS`, so every `{canWrite && …}` branch is unreachable-false
- `AdminGuard` redirects non-admins to `/dashboard` with no explanation of what happened
- "Reject" renders as the brand-teal affirmative button, visually identical to "Approve & create"

## Questions to Consider

1. If there is exactly one admin and no end users, why is `/admin` a directory instead of a status board? What if the Overview were a single verdict — "Catalogue healthy · last scrape 6h ago · 3 items priced ₨0"?
2. What if "Data quality" weren't a page but the ordering principle of the restaurants table? The admin's job isn't to browse restaurants; it's to find broken ones. Why does the primary list rank by nothing at all?
3. The thesis is that bad menu data poisons AI suggestions — so why can't the admin see the poisoning? What if every row showed how many active plans reference it, and every delete dialog said "this appears in 4 active plans"?
4. Why does the admin see a different string than the customer does? If `humanizeName` fixes scraped slugs for the user, the gap between raw and rendered *is* the data-quality signal.
5. `externalId` and `orderUrl` are on every record. What breaks if every row carries "compare with source ↗" and a `lastScrapedAt`, turning record-fixing into side-by-side comparison rather than blind editing?
6. If the scraper is the only writer that matters and it runs outside the UI, is "Ingestion" the wrong noun — should it be a control surface rather than a read-only history?
