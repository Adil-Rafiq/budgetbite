---
target: plans
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
timestamp: 2026-07-26T16-58-58Z
slug: apps-web-app-plans
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated). Both P0/P1 claims re-verified against source in the parent before publishing.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | "Next" on the reminders step is a silent no-op — enabled button, no movement, no error (`use-create-plan.ts:155-158` + `use-notification-step.ts:127`). Offset by genuinely excellent generation-status modelling. |
| 2 | Match System / Real World | 2 | A plan's only human identity is `Plan · {plan.id.slice(0, 8)}` — a raw UUID fragment (`plan-detail-header.tsx:42`). |
| 3 | User Control and Freedom | 1 | Esc/overlay/X destroys the whole wizard with no confirm and no draft (`create-plan-dialog.tsx:31`); there is no UI anywhere to edit a plan's budget after commit. |
| 4 | Consistency and Standards | 1 | Zero `focus-visible` rules in all of `app/plans/` despite `lib/focus-ring.ts` shipping three variants used by onboarding, sidebar, and dashboard. Five hand-rolled error blocks while `components/data-error.tsx` (with retry) sits unimported. |
| 5 | Error Prevention | 1 | `types.ts:24` is a bare `.positive()` — no `.max()`, so ₨99,999,999 is accepted; `types.ts:25` has no `.max(5)` while the API enforces `mealsPerDay ≤ 5`. |
| 6 | Recognition Rather Than Recall | 2 | Every card is titled `"{planType} plan"` (`plans-list.tsx:138-140`). Ten monthly plans render ten identical headlines. |
| 7 | Flexibility and Efficiency | 1 | `create-plan-dialog.tsx:74` draws a `↵` glyph next to "Create plan", but the buttons are `type="button"` outside any `<form>` and no key handler exists — Enter does nothing. No status filter despite the API supporting one. |
| 8 | Aesthetic and Minimalist Design | 3 | Coherent and restrained, but three untokenized ambers (`#b45309`, `#8a5a12`/`#fef6e6`/`#f5a623`) and a hardcoded `#f7fbf0` canvas leak through. |
| 9 | Error Recovery | 2 | `generation-attempt-item.tsx:167-172` prints `GENERATION_FAILED: <raw errorMessage>` into the UI; `plans-list.tsx:84` shows a load failure with no retry. |
| 10 | Help and Documentation | 2 | `create-plan-dialog.tsx:79` promises "You can change every value later." No UI to change a plan's budget exists. The promise is made at the moment of financial commitment and is false. |
| **Total** | | **17/40** | **Poor — core experience broken for keyboard users and for anyone over budget** |

All ten heuristics apply (Operate surface); none scored `n/a`.

## Design Specificity Verdict

**Category-interchangeable — and worse, a degraded copy of a better surface that already exists in this repo.**

**LLM assessment.** There is a veneer of authorship: the eyebrow → display-serif headline → stat-tile grammar is consistent, and `plan-timeline.tsx:178-186` gives today a 1.5px green border plus a `color-mix` halo that genuinely earns its place. But strip the green and swap `formatPKR` for `$` and this is a Linear/Notion project list with a 3-step create modal. Nothing in the layout knows it is about a food budget that has to survive a month in Pakistan.

The damning evidence is internal. `app/onboarding/_components/steps/budget-step.tsx` solves this exact task with a 4xl display number and a `₨` glyph, PKR quick-picks calibrated to local takeout spend (15k/30k/45k/60k), live per-meal math on the same step, a notice when weekly↔monthly rescales the amount, `sessionStorage` draft persistence, accessible chips, humane error copy, and a 1,000,000 cap. `app/plans/_components/create-plan/steps/step-budget.tsx:37-44` renders the same value in a stock 36px shadcn `<Input type="number">` and has none of the rest.

Four components render the identical "label above value in a bordered box" tile — `plans-list.tsx:174-183`, `step-preview.tsx:115-124`, `plan-summary-card.tsx:166-185`, `plan-end-summary-card.tsx:125-134` — four copy-pasted definitions of one visual idea, so nothing can evolve.

The single biggest missed opportunity: `components/budget-fit-badge.tsx` is the canonical "Fits budget / Tight / Over budget" pill, paired with `classifyBudgetFit` from `@repo/shared`, used on the dashboard meal decision, the restaurants list, and restaurant detail. It appears **zero times** on the Plans surface. `plan-timeline.tsx:115-117` prints every suggested price in the same brand green whether it is ₨350 against a ₨400 target or ₨1,800. The screen titled "Plans" is the one place in the app that will not tell you whether a suggestion fits your budget.

Second: every suggestion here is inert text. `useMealPin` and `useMealChoice` exist and are never imported into `app/plans/`. You can read Thursday's dinner options but cannot act on them.

**Deterministic scan.** `detect.mjs --json apps/web/app/plans` → **exit 0, `[]`, zero findings** across all 25 files. Assessment B verified this is a real clean result, not a silent skip: it confirmed the walker enumerates all 25 files, ran two control probes with planted anti-patterns that fired correctly, and confirmed no `impeccable-disable` comments, no `ignoreRules`, and no local DESIGN.md. Sibling `apps/web/app/dashboard` also scanned clean.

Important scope caveat: for `.tsx` source the detector runs its regex engine, which covers ~25 of 59 rules — the statically decidable ones. `low-contrast`, `text-overflow`, `line-length`, `cramped-padding`, `text-occlusion`, and `heading-rhythm` **cannot fire on source files at all**. The clean scan is evidence of no static tells, not of a clean rendered page. Notably, the detector caught nothing that Assessment A found — every issue in this report is judgment-level, which is exactly the class of defect a static scan cannot reach.

**Visual overlays: not available.** No browser automation tool was exposed to either agent (the Chrome extension is not connected), so no fresh tab, no injection, no overlay, and no in-page detector run occurred. Nothing is highlighted in your browser. `puppeteer` is also unresolvable from the repo, so the detector's own URL engine could not substitute.

Assessment B did get real rendered evidence by another route: both dev servers were already running, it signed in as the seeded demo user, fetched the authenticated `/plans` (200, 47,752 bytes), and ran the jsdom static-HTML engine on it. One finding — `flat-type-hierarchy` (12/14/16/18px, 1.5:1) — is a **confirmed false positive**: the `<h1>` uses `text-[clamp(28px,3.6vw,40px)]`, jsdom cannot parse `clamp()`/`var()` (the detector's own source admits this at `checks.mjs:2500`), so the display heading is filtered out by the `fontSize >= 8` guard. Real ratio is ~3.3:1, well past the 2.0 threshold.

## Overall Impression

This surface looks finished and is not. The visual layer is calm and coherent; the behavioural layer has three showstoppers, and the product layer has quietly inverted the one principle BudgetBite exists to serve. A keyboard user cannot choose which meals their plan covers. A new user hits a green "Next" button that does nothing and says nothing. And when someone actually overspends — the moment this entire product is built for — the plans list tells them they have **₨ 0 remaining** instead of telling them the truth.

The single biggest opportunity is not new design. It is that a better version of nearly every element here already exists elsewhere in this repo — in onboarding, in the sidebar, in `summary-cards.tsx`, in `budget-fit-badge.tsx`, in `data-error.tsx`, in `focus-ring.ts`. This surface was built beside those and never went back to collect them.

## What's Working

**1. Generation status is modelled as a real state machine, not a spinner.** `generation-status-banner.tsx` + `generation-attempt-item.tsx` handle pending/succeeded/failed/superseded, poll at 2s only while something is pending and stop automatically, distinguish TIMEOUT from generic failure, keep the previous generation labelled "Active" while a new one runs, and put Retry on exactly the one attempt where retrying is meaningful (`generation-attempt-item.tsx:87`). It works because it was derived from the reality that AI generation is slow and occasionally fails, rather than from spinner convention. `generation-status-banner.tsx:37-71` even says *"Your previous plan is still active and safe to use."* — one sentence doing more emotional work than the rest of the surface combined.

**2. The timeline's today-treatment.** `plan-timeline.tsx:178-186` gives today a green border plus a `color-mix` halo and tinted header, past days a flattened `bg-canvas`, future days plain white. Three states legible at a glance, no legend needed, encoded in border weight and surface value rather than text.

**3. One source of truth for money and time.** `lib/currency.ts` and `lib/time.ts` carry comments naming the specific bug each was written to kill ("the plan preview screen already rendered `8:00 PM` while the picker beside it said `20:00`"). `step-preview.tsx:17-28` imports `planBudgetBreakdown` from `@repo/shared` so the preview's per-meal figure is arithmetically identical to what the server stores. In a money product that is the trust model, and it is enforced in code.

## Priority Issues

### [P0] Meal-type selection is unreachable by keyboard and invisible to screen readers
`step-budget.tsx:107-111` renders `<Checkbox className="hidden" />`. Tailwind `hidden` is `display: none`, which removes the Radix `role="checkbox"` button from both the tab order and the accessibility tree. The visible chip is a bare `<label>` (`:99-105`) with no `tabIndex`, no `role`, no `aria-checked`. Compounding it, `app/plans/` contains **zero** `focus-visible` declarations, so nothing else on the surface shows focus either.

**Why it matters:** a keyboard or screen-reader user can open the wizard and reach the budget field but cannot change which meals the plan covers. `use-budget-step.ts:48-52` auto-selects only the first option, so they are silently locked into a breakfast-only plan and cannot perceive a choice existed. That is exclusion from the product's core setup, not a degraded experience.

**Fix:** replace label+hidden-Checkbox with the pattern onboarding already ships (`onboarding/.../budget-step.tsx:200-227`): a real `<button type="button" role="checkbox" aria-checked={checked} className={\`min-h-11 ... ${FOCUS_RING}\`}>` with a visible check indicator. Then apply `FOCUS_RING` from `lib/focus-ring.ts` to every interactive element in `app/plans/` — `plans-page-header.tsx:59`, `create-plan-dialog.tsx:62,71`, `step-notification.tsx:48`, `plans-list.tsx:215,223`, `generation-attempt-item.tsx:142,153`.

**Suggested command:** `/impeccable audit`

### [P0] The Plans surface reports "₨ 0 remaining" when you are over budget
`plans-list.tsx:169` clamps with `Math.max(0, remaining)`; `:98` clamps the bar with `Math.min(100, ...)`. `plan-summary-card.tsx:66-71` doesn't clamp but renders `₨ -5,000 of ₨ 45,000 left` — a hyphen-width minus on a 32px number followed by the word "left", which skims as "5,000 left". `plan-summary-card.tsx:56` adds a hard cliff: `spentPercent >= 90 ? 'bg-tomato' : 'bg-green'`, so 89% is reassuring green, 90% is alarm, and 150% looks identical to 90%.

**Why it matters:** this is the product's one non-negotiable fact and this is the one surface that gets it wrong. `app-sidebar.tsx:143-146`, `app-header.tsx:85-93`, and `summary-cards.tsx:108-113` all handle it honestly with an explicit over/left label and a plain-language sentence. A user who overspends sees "over" in the sidebar and "₨ 0 remaining" on the plan card at the same moment. Principle 5 requires PKR to be unambiguous; a clamp is not rounding, it is a different number.

**Fix:** lift the shell's pattern into both components. Compute `isOver = remaining < 0`, render `formatPKR(Math.abs(remaining))` with `label = isOver ? 'over' : 'left'`, tint tomato when over, and give the bar a distinct over-100% treatment rather than sitting flush at 100%. Replace the 90% cliff with the dashboard's three-band `getSpendingHealth` and its caption.

**Suggested command:** `/impeccable clarify`

### [P0] "Next" on the reminders step silently does nothing for every new user
`use-notification-step.ts:32` seeds every slot with `time: ''` (with an explicit comment saying the user must fill them in). `notificationSlotSchema` requires `/^\d{2}:\d{2}$/` (`types.ts:32`), so every slot is invalid on arrival. `handleNext` (`use-create-plan.ts:155-158`) awaits `trigger()` and returns early. The step's only error outlet reads `errors.notificationSlots?.message` (`use-notification-step.ts:127`) — for per-item failures react-hook-form stores the error at `notificationSlots[0].time`, so `.message` on the array is `undefined` and nothing renders. `canAdvance` (`use-create-plan.ts:85`) only checks meal-type load state, so the button stays fully enabled and green.

**Why it matters:** an enabled button that does nothing with no error is the worst possible failure mode — the user concludes the app is broken. Onboarding already solved this by pre-filling sensible times (breakfast 08:00, lunch 13:00, dinner 20:00) with the comment *"so the user can finish onboarding without opening a single time picker."*

**Fix:** port `DEFAULT_TIME_BY_KEY` / `defaultTimeForMealType` into a shared module used by both flows — not a third copy. Separately surface per-slot errors: read `errors.notificationSlots?.[i]?.time?.message`, render it under the offending row with `role="alert"`, and mark that row's TimePicker `aria-invalid`.

**Suggested command:** `/impeccable harden`

### [P1] Reopening "New plan" shows step 3 of the plan you just created
`plans-page-header.tsx:66` mounts `<CreatePlanDialog>` unconditionally and `create-plan-dialog.tsx:22` calls `useCreatePlan()` above the `<Dialog>`. Radix unmounts the content on close, but the hook — the XState machine and both form instances — never unmounts and is never reset; there is no effect keyed on `open` anywhere. After a successful submit the machine sits in `completed`, which is `type: 'final'` (`create-budget-plan.machine.ts:73-75`) and ignores every subsequent event.

**Why it matters:** clicking "New plan" a second time opens on *"Step 03 · Review and confirm"* with last month's numbers. And because the machine is final, `send({ type: 'START_SUBMIT' })` is a no-op while the code below it still calls `createBudgetPlan` — so `isSubmitting` never goes true, the button never says "Creating…", never disables, and a double-tap can fire two creates.

**Fix:** add a `RESET` event returning the machine to `editing` with `step: 0`, driven from an effect on `open` in `CreatePlanDialog` that also calls `budgetStep.reset()` / `notificationStep.reset()`. Expose `reset` from both step hooks.

**Suggested command:** `/impeccable harden`

### [P1] No exit protection and no draft on the one screen that asks for a money commitment
`create-plan-dialog.tsx:31` wires `onOpenChange` straight through, so Esc, an overlay tap, or the X discards everything. `dialog.tsx:55` sets no `max-h`/`overflow-y-auto`, so on a 667px phone the preview step (hero card + three rows + footer + footnote) overflows a viewport-centred non-scrolling box and the Create button can land off-screen. There is no draft store, while onboarding mirrors every keystroke to `sessionStorage`.

**Why it matters:** "refresh mid-wizard" and "interrupted by a WhatsApp message" are the same test, and both lose everything. The fix is implemented 200 lines away in the same codebase.

**Fix:** (a) add `max-h-[85dvh] overflow-y-auto` to the `DialogContent`; (b) intercept `onOpenChange(false)` when any step form `isDirty` and show a "Discard this plan?" AlertDialog — the surface already imports that primitive twice; (c) reuse `onboarding/_lib/draft-storage.ts` under a `plans:` key.

**Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Casey (distracted mobile user, one thumb, PKR, interrupted).** The budget field is a stock `Input` — `h-9` = **36px**, 8px under the 44px minimum, with `type="number"` spinner arrows she'll fat-finger; the only `min-h-11` in the entire `app/plans/` tree is the New plan button. It's controlled on a value `use-budget-step.ts:100` coerces to `0`, so backspacing to clear snaps it to a stubborn `"0"` she must select and overwrite — onboarding's comment documents fixing exactly this ("a literal 0 the user then has to delete"). Plan type is a ~110px `w-fit` 36px dropdown for a binary choice that represents a 4× difference in her food budget; onboarding uses a full-width segmented toggle. ON/OFF reminder toggles are ~40×24px. A WhatsApp interruption kills the modal and every value with it. She commits ₨45,000 and gets a 3-second toast, returned to the same list, with zero suggestions generated. On the detail page `[id]/page.tsx:94` uses `defaultValue="plan"` with no URL sync, so Android Back leaves the page instead of returning to her tab.

**Riley (stress tester).** 0 plans → `plans-list.tsx:60-69` is a dashed box reading "No plans yet" with **no button inside it**; the actual CTA is a small pill 400px away in the corner — and the dashboard's beautifully-written `no-plan-state.tsx` links here. 1 plan → floats in half a 2-up grid. 50 plans → 5 pages of identical cards, `page` is local `useState` so Back from a plan resets to page 1, and if data shrinks while he's on a later page `plans-list.tsx:86` returns **`null`** — blank screen, no pagination, no way back. Long plan names → **there is no name field in the schema at all**; the only per-plan identifier is `plan.id.slice(0, 8)`. Budget of 0 → rejected by zod's *default* message (`types.ts:24` is a bare `.positive()`), so a money field renders `Too small: expected number to be >0`. Budget of 99999999 → **accepted**, and `step-preview.tsx:56` earnestly reports ₨1,111,111 per meal. 6+ admin-configured meal types → passes the client, then eats a generic toast when the API's `mealsPerDay ≤ 5` rejects it. Credit where due: two tabs racing a create is handled well (`use-create-plan.ts:117-133`).

**Sam (screen reader + keyboard).** Cannot select meal types at all (P0). Cannot see focus anywhere — zero `focus-visible` rules; `globals.css:125-127` sets `outline-ring/50`, a colour with no width or style. Every card announces "Open monthly plan details, link" because `plans-list.tsx:117`'s `aria-label` overrides the dates and amounts that distinguish them. Both progress bars are decorative divs with no `role="progressbar"` and no `aria-valuenow` — budget progress is conveyed to him by nothing at all, while `summary-cards.tsx:157-164` does it correctly. The budget error is a plain `<p>` with no `role="alert"`, no `aria-invalid`, no `aria-describedby`, so money errors never reach him. The wizard's step position has no `aria-live`. Two progress bars animate width unconditionally while `FadeUp`, `Stagger`, `CountUp`, and the shell all check `useReducedMotion()`. One bright spot: `step-notification.tsx:38-47` gives real `aria-label` and `aria-pressed` with state-dependent labels, and `ui/time-picker.tsx` is the best-built control on the surface.

## Minor Observations

- `app-header.tsx:74-76` hardcodes `Home · Dashboard` on desktop, so `/plans/[id]` shows a breadcrumb that lies.
- No estimate caveat on any price, despite principle 2. App-wide, but Plans lays out a whole month of estimates as a commitment.
- `plan-summary-card.tsx:133,139-140` wraps values in `Math.round()` before `formatPKR`, which already rounds — a signal nobody trusts the shared formatter.
- No `tabular-nums` on any money here, though `summary-cards.tsx` uses it. Money in a 3-across grid needs aligned digits.
- The `01`/`02` counters (`plans-list.tsx:125-127`) are decoration masquerading as identifiers, and renumber if a plan is deleted.
- `plans-list.tsx:100` — `statusTone[plan.status] ?? 'completed'` silently paints an unknown status as "completed"; `plan-detail-header.tsx:8-12` types the same map exhaustively.
- `listBudgetPlansQuerySchema` supports a `status` param the list never uses — no Active/Completed filter, the first thing anyone with 20 plans reaches for.
- `generation-history-timeline.tsx:144-148` caps at 20 and says "Showing the latest 20 of 47" with no way to load more.
- `use-start-next-plan.ts:32-34` and `use-create-plan.ts:106-108` both cancel the active plan *before* creating the new one, outside any transaction. A failed create leaves the user with no active plan and an error toast.
- `plan-end-summary-card.tsx:75-77` shows "Adherence to AI 62%" with no explanation — the most interesting number on the card and the most opaque.
- A completed plan's card shows "Days left 0" (`plans-list.tsx:108-109` hardcodes it) beside a "Remaining" figure — two meaningless numbers on every historical card.
- `plan-end-summary-card.tsx:80-91` closing with "Ordered most from Student Biryani (7×)" is warm, human, and product-specific — the second real peak on this surface, and it only appears after the plan is over.

## Questions to Consider

1. **Why does this app have two budget wizards?** Onboarding's and Plans' ask the same three questions, but onboarding has presets, live per-meal math, weekly↔monthly conversion, draft persistence, accessible chips, humane errors, and a cap. Is the Plans wizard meant to be the *quick* version, or simply the one nobody went back to? If it's the same flow, why isn't it literally the same components?
2. **What is a plan called?** There's no name field, so the entire identity vocabulary is "Monthly plan" plus a UUID prefix. Would `"July · ₨45,000"` — auto-derived, editable — do more for scanability than any layout change? Or is a *list* the wrong metaphor entirely, and this should be a continuous ledger of budget periods rather than a folder of documents?
3. **If `BudgetFitBadge` is the canonical "does this fit?" signal on three other surfaces, what does its absence here mean?** Was the timeline conceived as a *report* rather than a *decision surface*? Suggestions shown without fit and without an action are a receipt for work the AI did, not a tool. What would it become with a fit pill and a Pin button on every option?
4. **Why can't a user change a budget they already committed?** The wizard promises they can. Real budgets get revised mid-month — a raise, a wedding, a bad week. Is the missing edit path the reason `plans-page-header.tsx:25-33` has to offer the brutal "cancel your plan and start over" replace flow instead?
5. **This surface has an "over budget" state it refuses to render.** The shell shows it, the dashboard writes a sentence about it, `planSummaryResponseSchema.variance` models it as explicitly signed — and `plans-list.tsx:169` clamps it to zero. Is that a bug, or a designer flinching from bad news? What would a Plans surface look like if it were *built for* the month you overspend, rather than treating that as the exception a `Math.max` hides?
6. **What is a plan for on a phone at 8pm?** The desktop reading is "review the month". The mobile reading should be "what am I eating tonight and can I afford it" — but the timeline renders every day equally, forces a scroll past the past, and offers nothing to tap. Should `/plans/[id]` open scrolled to today, with past days collapsed behind a "show earlier" disclosure?
