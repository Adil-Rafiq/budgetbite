---
target: sidebar
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-01T12-55-14Z
slug: apps-web-components-app-sidebar-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + evidence, isolated). Not degraded.

Evidence gap: the sidebar was never observed rendering. No browser-automation tools exposed; puppeteer not installed so detector URL mode failed; all shell routes sit behind proxy.ts (/dashboard 307s to /login without a session cookie). No overlay was injected. All findings are source analysis and arithmetic; contrast figures computed from globals.css token values.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Active route and live % clear; loading, error, and "no plan" all render identically as blank (app-sidebar.tsx:129) |
| 2 | Match System / Real World | 2 | "Main" is system-speak (:98); planType prints a raw enum (:134); over-budget reads "over of PKR 20,000" (:149-151) |
| 3 | User Control and Freedom | 2 | Sections reachable and aria-current orients, but no collapse, no shortcut, inert budget card, Admin unreachable below 1024px |
| 4 | Consistency and Standards | 2 | Shares budget source with header, but bypasses lib/focus-ring.ts, re-implements initials(), hardcodes hex, three names for one destination |
| 5 | Error Prevention | 3 | aria-current + prefix-guarded matching (:100) correct; stale cached figure can render with no staleness cue |
| 6 | Recognition Rather Than Recall | 3 | Icon+label always paired, no icon-only controls, persistent figure. No period dates, no per-meal on desktop |
| 7 | Flexibility and Efficiency | 1 | No collapse, no shortcut, no search, no "Log spend" |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, well-ordered type scale; "Main" and the inert identity block are dead weight |
| 9 | Error Recovery | 1 | No error state on a data-backed widget; the number silently vanishes |
| 10 | Help and Documentation | 1 | No tooltips, no first-run affordance, no explanation of Dashboard vs Plans |
| **Total** | | **20/40** | **Acceptable — significant improvements needed** |

All ten heuristics applied (Operate surface). Assessment A scored 16/40; raised four scores because its 0 on error recovery and 1s on control/consistency under-credited the shared budgetState source, correct nested-route matching, and honest reduced-motion handling.

## Design Specificity Verdict

Category-interchangeable with one exception. Swap "Restaurants" for "Customers" and this is a CRM shell. Nav array (:26-32) is default admin-console vocabulary; icons are stock Lucide with no food or currency semantics; composition is the canonical 256px shadcn rail unmodified; the group label is "Main" (:98).

The exception is the budget mini-card (:129-168): PKR via formatPKR, plan type, spent %, honest negative when over (:56). No other product could use it unchanged. But it is at the floor of the column, conditionally absent, last in DOM and tab order.

Internal evidence: app/analytics/page.tsx headlines "Every rupee, accounted for." The pages have a voice; the shell says "Main." That destination carries three names (sidebar "Analytics", eyebrow "Spend · Analytics", metadata "Spending · BudgetBite"); /plans is "Plans" in the rail and "Budget plans" in the breadcrumb.

Deterministic scan: ZERO findings. detect.mjs --json returned [] and exit 0 on app-sidebar.tsx, ui/sidebar.tsx, app-shell.tsx, and all of components/, with and without project config. Pipeline verified non-no-op via a synthetic font-family: Inter control (correctly returned a finding, exit 2). The .tsx regex engine checks overused fonts, em-dash tells, glow/marquee/radial-halo slop, and design-system drift — NOT contrast, touch targets, or ARIA on source files. Clean means "no AI-slop signatures," not "no problems." No false positives, because no findings.

Visual overlays: none. Injection never attempted; no browser automation in session.

## Overall Impression

Competent, restrained sidebar with one excellent idea and a systematic problem around it: it bypasses the design system the rest of the repo built to prevent exactly its failures. lib/focus-ring.ts exists with a docblock explaining why brand green was rejected as a focus ring — this file hardcodes that rejected green at 40% opacity. lib/name.ts exports initials() with "One concept, one implementation" — this file re-implements it. Tokens exist — this file writes #f0f9e0 twice.

Biggest opportunity: the budget readout is the only thing here that could not belong to another product, and it is placed last, inert to click, and the first thing to disappear when anything goes wrong. Principle 1 says budget adherence IS the product; the shell treats it as a footer widget.

## What's Working

1. The budget figure is sourced once and cannot disagree with itself. app-sidebar.tsx:51-56 and app-header.tsx:79-84 read identical pin-adjusted budgetState with identical fallback chains, and remaining goes negative rather than clamping (:56). Structurally incapable of contradicting itself between shell and page — serves principles 1 and 5.

2. One route vocabulary across desktop and mobile with correct nested-route matching. Both navs use pathname === href || pathname.startsWith(href + '/') (:100, mobile-nav.tsx:40); the + '/' guard stops /plan matching /plans. Phone-to-desktop requires no relearning.

3. Reduced motion honored properly. :157-163 sets initial={false} under prefersReducedMotion rather than zeroing the duration, so the bar paints at final width instead of snapping from 0%. The naive version still produces a one-frame jump.

## Priority Issues

### [P0] Focus indicator fails WCAG 1.4.11 using the exact ring the repo wrote a module to eliminate

app-sidebar.tsx:68 and :107 use focus-visible:ring-green/40. Composited, #8cc63f at 40% over white is #c8e28c — 1.32:1 against a 3:1 floor. mobile-nav.tsx:47 is 1.29:1. admin-shell.tsx:98-101 has no focus styling at all. lib/focus-ring.ts:4-8 docblock: "green-deep rather than the brand green: at #8cc63f a focus ring is 2.05:1 against white and barely visible." This hardcodes the rejected color at 40% alpha — worse than what was thrown out. FOCUS_RING measures 4.97:1.

Why: keyboard-only and low-vision users lose position in primary navigation on every screen, every device.
Fix: import FOCUS_RING from @/lib/focus-ring, replace all three ring strings. Extend apps/web/scripts/check-tokens.mjs (exists, wired into lint, but bans a fixed ghost list) to fail on ring-green/ and new arbitrary hexes.
Suggested command: /impeccable audit

### [P0] Loading, error, and "no plan" all render identically as nothing

:129 gates the card on `active &&`, so fetching, API-down, and no-plan-yet are the same visual event: blank space. user?.name ?? '—' (:89) renders a bare em dash, user?.email ?? '' (:91) collapses the row, initials() returns a bullet (:39).

Why: with the API down — the current state of this environment — the shell tells a user with an active PKR 20,000 plan that they have no budget. Principle 1 says remaining budget must stay legible on every surface; it is the first thing to vanish. components/data-error.tsx and components/skeletons/ exist and are used elsewhere; the shell uses neither.
Fix: three explicit branches. isLoading gets a skeleton at the card's exact dimensions. isError gets inline data-error.tsx, "Couldn't load your budget · Retry." No active plan gets a "Start a plan" CTA. Same for the user block.
Suggested command: /impeccable harden

### [P1] The shell remounts on every navigation, replaying the money-bar animation each time

Verified: app/{dashboard,plans,restaurants,analytics,profile}/layout.tsx are five siblings each independently rendering AppShell. React tears down and rebuilds the shell on every route change, so the 0.9s budget-bar fill (:153-164, and app-header.tsx:149-160) refills from 0% on every click and every mobile tab tap.

Why: the money indicator visibly resets and re-fills, reading as recalculating — undermining the figure the product asks the user to trust. Also discards nav paint on every navigation for a mobile user on a slow connection.
Fix: one app/(app)/layout.tsx route group wrapping all five segments; delete the per-segment shells.
Suggested command: /impeccable optimize

### [P1] Admin unreachable on mobile; nav vocabulary hand-duplicated in three places

:58-61 appends Admin for role === 'admin'. mobile-nav.tsx:22-28 has no equivalent, no overflow, no "more." Below 1024px an admin has no route to /admin at all. The route list is copied verbatim across app-sidebar.tsx, mobile-nav.tsx, and admin-shell.tsx — three hand-synced copies that have already drifted, which is how this gap appeared.

Why: PRODUCT.md is explicit that neither device is the "real" version. A privileged surface ceases to exist on one of them.
Fix: hoist into lib/nav.ts consumed by all three; render a sixth mobile tab for admins or add Admin to the header dropdown beside Profile (app-header.tsx:189).
Suggested command: /impeccable adapt

### [P1] The budget card is inert and omits both facts that make the number actionable

:130-151 renders "WEEKLY BUDGET · 43% · PKR 4,300 · left of PKR 10,000" — no period end, no days remaining, no per-meal allowance. avgBudgetPerRemainingMeal is computed and shown in the mobile pill (app-header.tsx:91, 142-147) but absent from the desktop card, so desktop carries LESS budget detail than the phone. :131 is a plain div: the largest element in the sidebar does nothing when clicked. The over-budget string is ungrammatical at the most anxious moment: "PKR 1,200 / over of PKR 20,000."

Why: PKR 4,300 left is meaningless without knowing whether it covers one day or six. The user does the division the app exists to do for them — hits principle 4.
Fix: wrap the card in a Link to the active plan; add days-remaining from active.plan.endDate and the per-meal figure; fix copy to "PKR 1,200 over your PKR 20,000 budget." Better: extract one BudgetReadout component with rail and pill variants so the two can never disagree about which facts matter.
Suggested command: /impeccable clarify

## Persona Red Flags

**Sam (screen reader, keyboard, low vision, 200% zoom)** — most severely affected.
- Focus ring 1.32:1 across the logo and 5-6 nav links; cannot see where focus is.
- No skip link anywhere in the app (grep-confirmed). Every route change costs 7 tab stops before main.
- Both nav elements unlabeled (app-sidebar.tsx:97, mobile-nav.tsx:34); the rotor lists two indistinguishable "navigation" entries. The sidebar's nav is nested in an aside (:64), announcing primary navigation as complementary content.
- Active-state tint bg-[#f0f9e0] is ~1.09:1 against white. The reliable "you are here" carrier is the label hue shift to green-deep — a color-only signal, plus aria-current.
- At 200% zoom on 1280px the viewport becomes 640px CSS width, below lg, so the sidebar and budget card are hidden. Falls back to the header pill, which sm-gates away per-meal and %. Zooming in removes budget information.
- Progress bar (:152-165) has no role="progressbar" and no aria-hidden. Lower severity than it sounds: :139 duplicates the % as text.

**Casey (one-handed, mobile, slow connection)** — second.
- Never sees this sidebar. Entire nav is mobile-nav.tsx, labels at text-[10px] (:53).
- On a 360px phone the header pill's per-meal figure, bar, and % are all sm-gated away. Standing in a restaurant she sees "Left PKR 4,300" and nothing about whether this dish fits.
- No skeleton: the pill renders nothing until the query resolves, then pops in. Before that the shell asserts she has no budget.
- Every tab tap replays the 0.9s bar animation.
- If she is an admin, no /admin tab and no overflow.

**Alex (impatient power user).**
- No collapse. 256px permanently gone, including on /analytics, the widest-content surface. The primitive shipping collapse, an icon rail, and Cmd/Ctrl+B is imported by nothing.
- Budget card is the biggest element in the rail and is not clickable (:131).
- No "Log spend" anywhere in the shell — the core daily act requires navigating to the dashboard and hunting the right meal slot.
- Profile burns one of five top-level slots and duplicates the header dropdown item.

## Minor Observations

- 694 lines of dead code: components/ui/sidebar.tsx has zero consumers (repo-wide grep hits only structure.md:197), still linted and type-checked every build. globals.css:52-59 defines eight --sidebar-* tokens describing a BLACK rail (--sidebar: #1a1a1a), exported as Tailwind colors at :102-109. Anyone reaching for the primitive gets a black sidebar with no warning. Delete both, or adopt the primitive and delete the hand-rolled aside.
- initials() exists three times: app-sidebar.tsx:34-40, admin-shell.tsx:44-50, and lib/name.ts (whose docblock says "One concept, one implementation").
- admin-shell.tsx is a near-verbatim fork: same aside classes, same bg-[#f0f9e0], same duplicated helper, but 10 nav items in one group and NO focus styling at all. Fixes must land there too.
- #f0f9e0 is untokenized at four sites: app-sidebar.tsx:83, :109, admin-shell.tsx:103, dashboard/meal-slots/index.tsx:138 and :286.
- The wordmark's "Bite" is 2.05:1: text-green at 18px bold (:74) sits below the 18.66px large-text threshold, needing 4.5:1.
- The API-wakeup banner overlaps the sidebar: ApiWakeupBanner is sticky top-0 z-50 (providers.tsx:14) but the sidebar is fixed inset-y-0 with NO z-index (:64), so during the exact failure the banner announces, it covers the wordmark.
- No tabular-nums on the sidebar budget figure (:143) though the header pill has it (app-header.tsx:136). The same number jitters in one place and not the other.
- spentPercent (:55) can print over 100% while the bar clamps at 100 (:158).
- :64 uses fixed inset-y-0 with no left-0 — works via static-position fallback, but implicitly.
- Assessment A reported the token guard as aspirational; it exists at apps/web/scripts/check-tokens.mjs and runs in lint, but bans a fixed ghost list rather than a pattern.
- Sidebar touch targets pass (logo 256x72, nav links ~232x48). The header avatar button is size-11 sm:size-9 — 36x36 above 640px, under the 44 floor, and the only sign-out path on desktop.

## Questions to Consider

1. If remaining budget IS the product, why is it last in the DOM and first to disappear at lg? What if the budget readout became the rail's header, above the wordmark?
2. Is "Plans" a place or an archive? The user has exactly one active plan. Should slot two be "This week" — a live object with days remaining and per-meal allowance — with history demoted to a sub-route?
3. Logging spend is the one thing the app asks the user to do daily. Why is it not in the shell at all?
4. Who is the 256px fixed rail actually for? Casey never sees it, Alex can't collapse it, Sam loses it at 200% zoom.
5. What should the shell say the moment a user crosses into overspend? Re-planning is the app's actual answer to overspending — should the rail offer it?
6. The nav has no notion of urgency. If the plan has 2 days left and 60% unspent, should the rail look identical to day one?
