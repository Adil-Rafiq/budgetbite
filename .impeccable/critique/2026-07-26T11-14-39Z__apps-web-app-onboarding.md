---
target: onboarding
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-07-26T11-14-39Z
slug: apps-web-app-onboarding
---
Method: dual-agent (A: design review · B: detector + browser evidence), both isolated, neither saw the other's output.

**Coverage caveat, stated up front:** no browser automation is exposed in this session and no dev server was running, so **zero pixels of this flow were rendered**. Both assessments are source-level. Contrast figures are computed by hand from the hex tokens in `globals.css` — the arithmetic is sound, but nothing was browser-measured. Layout/occlusion claims are marked as inferred.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Broad coverage (4 progress signals, `Saving…`, `Detecting…`, skeletons, toasts) undone by a terminal action that misstates itself: the button says "Generating your plan…" (`onboarding-shell.tsx:133`) but generation is env-gated and fire-and-forget (`budget-plan.service.ts:230`). Step changes have no `aria-live` and no focus move. |
| 2 | Match System / Real World | 3 | 24-hour times (`time-picker.tsx:64`) where Pakistan speaks 12-hour — and the same app renders `8:00 PM` in `plans/.../step-preview.tsx:8-14`. "live prices" (`constants.ts:12`) contradicts the product's own price disclaimer. |
| 3 | User Control and Freedom | 1 | No skip, no save-and-exit. `currentStep` lives only in XState context (`onboarding.machine.ts:37-40`), never in the URL — browser Back exits the whole flow, refresh restarts at step 0. Only exit is the unlabeled logo link. |
| 4 | Consistency and Standards | 2 | Primary CTA is `bg-tomato` on steps 1-3 (`onboarding-shell.tsx:109`), `bg-green` on step 4 (`:125`) — the primary changes hue mid-flow, and tomato is the declared destructive token. This is the app's **only** red primary. The same "create a budget plan" decision has a completely different UI in `/plans`. |
| 5 | Error Prevention | 1 | Step 0 pre-commits Karachi coordinates with Continue unconditionally enabled. `canAdvance` (`use-onboarding.ts:104`) ignores budget validity; Weekly↔Monthly keeps the number and silently reinterprets it 4.3×. |
| 6 | Recognition Rather Than Recall | 3 | Strong defaults and labeled icons — but there is **no review before Launch**, while the lower-stakes `/plans` dialog has one (`step-preview.tsx`). The validation toast (`use-onboarding.ts:150`) asks the user to fix a screen they can no longer see. |
| 7 | Flexibility and Efficiency | 1 | One rigid path. Progress segments and dots are non-interactive `<div>`s that look like navigation. Not a `<form>`, nav buttons are `type="button"` — Enter does nothing anywhere except the dietary "add your own" field. |
| 8 | Aesthetic and Minimalist Design | 2 | **Four** simultaneous progress indicators for a 4-step flow (`:50`, `:56-63`, `:77`, `:147-158`). The "Budget breakdown" card (`budget-step.tsx:196-231`) draws N identical bars at identical widths showing N identical numbers — a chart encoding zero information, fronted by a magic-wand icon. |
| 9 | Error Recovery | 2 | The meal-types error block (`budget-step.tsx:134-151`) is a model: `role="alert"`, plain language, inline `Try again` wired to `refetch`. But Launch-time validation is a dead end, and 409 `PLAN_ALREADY_ACTIVE` — which `/plans` handles with a real recovery path (`use-create-plan.ts:136-141`) — falls through to a generic toast here. |
| 10 | Help and Documentation | 1 | Zero contextual help. No privacy statement at the moment a home address is captured. Both support references (`budget-step.tsx:141`, `:158`) say "contact support" as **plain text with no link, email, or mechanism**. |
| **Total** | | **18/40** | **Poor** |

All ten apply; this is an Operate surface, no `n/a`. 18 is harsh and it stands: genuinely good component-level craft sits on top of four structural holes — a silent wrong location, no state persistence, no focus indicators, no help.

## Design Specificity Verdict

**LLM assessment: a category-interchangeable shell with real product character confined to three data arrays.**

Swap four strings in `constants.ts` and this onboarding ships for a CRM, a fitness app, or a payroll tool without a single structural edit. The shell is the canonical 2023-SaaS wizard assembled from stock parts: sticky header with logo + "Step N of 4", 4-segment progress bar, centered `max-w-2xl` column, eyebrow chip → `h1` → subhead, fixed bottom bar with ghost-Back / filled-Continue, a *second* redundant dot indicator, and the boilerplate "You can change all of this later in settings."

The sameness is specific. **One card style for everything** — `rounded-[20px] border border-sage bg-white p-5 shadow-sm` wraps a Leaflet map (`location-step.tsx:27`), two tag pickers (`dietary-step.tsx:13,25`), a slider (`budget-step.tsx:16`), and a toggle list (`notifications-step.tsx:13`) identically. A map and a list of switches carry the same visual weight because the container doesn't know what's inside it. **Stock-icon literalism** — `MapPin`/`Salad`/`Wallet`/`Bell` are the first Lucide result for each concept; `Rocket` is the most templated icon in onboarding; `Wand2` fronts arithmetic that is literally `total / days / meals`. **Generic step order** — location → preferences → number → notifications is account-setup order, not food-decision order.

What *is* authored for this product is real but small: PKR presets calibrated to Pakistani takeout spend (`budget-step.tsx:12-13`), Karachi default coordinates, and `DIETARY_PREFERENCE_OPTIONS` leading with `'halal'` and including `'no beef'` (`constants.ts:46-54`). That one array does more product-specific work than the entire visual system wrapped around it.

**The missed opportunity: the flow never shows one real restaurant, meal, or price.** BudgetBite's whole positional claim is "real, nearby, orderable menus." The user pins their home on a map and the app answers with a reverse-geocoded street name they already knew. The budget step's payoff is three identical grey-green bars showing the same number three times. The scraper has already populated restaurants with coordinates for exactly this purpose. Four screens of extraction, zero screens of proof.

Worse, the copy promises something the product explicitly disclaims. PRODUCT.md: *"Displayed prices are best-effort and not guaranteed."* `constants.ts:12` promises **"live prices"** in the first sentence a new user reads.

**Deterministic scan: 0 findings, exit 0 — and that number means much less than it looks.**

`detect.mjs --json apps/web/app/onboarding` returned `[]`. Widening to `apps/web/app`, then all of `apps/web`, also returned `[]`. Assessment B verified this was a real pass and not a silent no-op: a canary file produced 3 correct findings, and all 15 onboarding files (including the underscore-prefixed private dirs) were confirmed walked. No `.impeccable` ignore rules and no inline waivers exist.

But scanning source directories uses the **regex engine, which reaches only 19 of 59 rules**. The 40 unreachable rules require a rendered URL — and they include `low-contrast`, `line-length`, `cramped-padding`, `tiny-text`, `undersized-ui-text`, `tight-leading`, `heading-rhythm`, `text-overflow`, and `clipped-overflow-container`. **Every issue class Assessment A found by hand is in the unreachable set.** The clean scan and the contrast failures below are not in conflict; the detector never looked. Additionally the four `design-system-*` rules were inactive — `loadDesignSystemForTarget()` returns `NONE` because there is no DESIGN.md on the resolution path from `apps/web`, so token drift was never checked either.

Zero false positives, because there were zero findings.

**Visual overlays: none.** No browser automation is exposed in this session (the `claude-in-chrome` extension is not set up), no dev server was running on `:3000`/`:3001`, Puppeteer is not installed, and `/onboarding` is gated behind a `better-auth.session_token` cookie (`proxy.ts`). No user-visible overlay is available. Fallback signal: **no browser tool exposed**. No servers were started; nothing is left running.

## Overall Impression

The component-level craft here is better than the score suggests — the async meal-types triad is genuinely exemplary, and the defaults are engineered with real care. What's missing is *product* conviction. This is a well-built generic wizard that extracts four pieces of data and never once demonstrates why the user should trust it with them. It asks for a home address and a money figure and offers, in return, an 11px line of the lowest-contrast text on the page.

The single biggest opportunity: **turn extraction into proof.** The database already holds real restaurants with real coordinates and real prices. One screen that says "47 restaurants within 10 km — cheapest lunch near you is ₨320 chicken pulao, 1.4 km away" would do more for activation than every polish pass on the current four screens combined.

## What's Working

**1. The meal-types async triad is exemplary** (`budget-step.tsx:123-161`). A loading skeleton sized to the real control (`h-[42px] w-28`), an error state with `role="alert"` + plain language + an inline "Try again" wired to `refetch`, and a *distinct* empty state naming the actual cause ("An admin still needs to configure these") rather than shrugging. Three genuinely different states where most products render one spinner — and `canAdvance` blocks forward motion when the data isn't there, so the states aren't decorative.

**2. Defaults engineered so you can finish without touching anything optional.** Reminder times pre-filled per meal key (`use-notification-step.ts:22-31`), the first meal type auto-selected, notification slots that preserve existing times when the meal selection changes, and meal types held in canonical menu order rather than click order (`use-budget-step.ts:88-93`, with a comment explaining why). Invisible when done right, and done right.

**3. The dietary quick-picks are the one place the product is unmistakably itself.** `'halal'` first, `'no beef'` as a first-class option, `'no seafood'`. No generic wellness-app list contains those in that order.

## Priority Issues

### [P0] Step 1 silently commits a Karachi home address the user never chose

**What:** `DEFAULT_COORDINATES` (`constants.ts:40-43`) seeds the *form value*, not just the map view — confirmed at `use-location-step.ts:22-23`, where `normalizeCoordinate` writes Karachi into `defaultValues`. `locationPreferencesSchema` marks lat/lng `.optional()` (`types.ts:48-51`), and Continue is unconditionally enabled at step 0 (`use-onboarding.ts:103-104`). Tapping Continue writes `24.8607 / 67.0011` to the profile.

**Why it matters:** Proximity is the product's core mechanic. A Lahore or Islamabad user who clicks through — the default behavior for anyone in a hurry — gets a permanently wrong restaurant set, with no error, ever. And it is self-sealing: `getPostLoginPath` only re-routes to onboarding when lat/lng are **null** (`post-login-redirect.ts:6`), so once the Karachi value is written the user is treated as onboarded forever and never asked again.

**Fix:** Seed the map's *view* from `DEFAULT_COORDINATES`, not the form value. Make lat/lng required in `locationPreferencesSchema` and gate Continue on a `hasPickedLocation` flag set by detect / search-select / map-click / pin-drag. Turn the address row into an explicit confirmation, and name the consequence: "We'll look for restaurants within 10 km of here."

**Suggested command:** `/impeccable harden`

### [P1] The per-meal figure drifts between the last onboarding screen and the first dashboard screen

**What:** `SLIDER_CONFIG` divides by hardcoded `days: 7` / `days: 30` (`budget-step.tsx:12-13`, verified) to produce "≈ ₨X per meal". The API computes the same figure from an **inclusive** day count — `Math.round(...) + 1` in `plan-math.ts:21` — over the range built by `getPlanDateRange` (`use-onboarding.ts:27-31`: `+7 days` weekly, `+1 month` monthly). So the API divides by **8** days weekly and 31–32 monthly where onboarding divides by 7 and 30.

**Why it matters:** Verified drift is **12.5% weekly** (₨7,500 ÷ 7 days ÷ 3 meals = ₨357/meal in onboarding; ÷ 8 days = ₨312/meal on the dashboard) and 3–6% monthly. Two screens, four seconds apart, in a product whose fifth stated principle is *"no numbers that drift from what was actually spent."* This is exactly the failure `lib/currency.ts` was written to prevent one layer up.

**Fix:** Derive the onboarding breakdown from the same `getPlanDateRange` output and the same inclusive-day arithmetic as `totalMealsForPlan`. Hoist that math into a module both `apps/web` and `apps/api` import — there's precedent in how `formatPKR` was unified.

**Suggested command:** `/impeccable harden`

### [P1] Progress and unsubmitted work evaporate on refresh or browser Back

**What:** `currentStep` lives only in XState context (`onboarding.machine.ts:37-40`); nothing writes it to the URL or storage. Location and dietary persist on Continue, but budget and notification values are only sent at Launch (`use-onboarding.ts:161-169`).

**Why it matters:** Casey backgrounds the tab mid-budget, iOS reclaims it, and he returns to step 1 with his ₨ figure gone. Or he uses the OS back gesture out of habit and is thrown clear out of onboarding with no route back. This is *the* most common interruption pattern for mobile onboarding, and the flow has no defense against it.

**Fix:** Sync the step to a query param (`/onboarding?step=budget`) and push history on advance so browser Back walks the wizard instead of leaving it. Mirror unsubmitted budget/notification values into `sessionStorage` and rehydrate on mount.

**Suggested command:** `/impeccable harden`

### [P1] The primary button is the same red as every error message

**What:** Continue is `bg-tomato` on steps 1-3 (`onboarding-shell.tsx:109`, verified), switching to `bg-green` at step 4 (`:125`). The budget step's eyebrow chip is also tomato (`constants.ts:26`). Tomato is the declared destructive token (`globals.css:14`) and is used for every error in this very flow (`budget-step.tsx:114,191`; `notifications-step.tsx:63`; `dietary-tag-picker.tsx:98`). **Onboarding is the only surface in the app with a red primary** — `register/page.tsx:241`, `no-plan-state.tsx:47`, and `create-plan-dialog.tsx:71` are all green.

**Why it matters:** Users learn "red = something is wrong" from every other screen, then must click red to proceed on the one flow where they have the least context. The budget step — the highest-anxiety moment — is the reddest screen in the product. And the primary changing hue at step 4 breaks the target the user spent three screens learning.

**Fix:** Green primary throughout, matching the rest of the app. Reserve tomato for errors. Give the budget step a non-alarming accent. Differentiate the final action through copy and weight — "Launch my BudgetBite" + rocket already does that work.

**Suggested command:** `/impeccable polish`

### [P2] Zero focus indicators in the flow; the product's most important number is its faintest

**What:** There is not a single `focus-visible:` rule anywhere in `apps/web/app/onboarding/`. The only focus-related declaration is `outline-none` on the budget field (`budget-step.tsx:72`), whose replacement cue is a swap between two pale greens. Meanwhile `no-plan-state.tsx:47`, `summary-cards.tsx:61,211`, and `time-picker.tsx:52` all ship proper rings — **this flow is behind its own codebase.** Hand-computed from `globals.css`: white on `bg-green` (#8cc63f) ≈ **2.0:1**, white on `bg-tomato` (#e84c3d) ≈ **3.8:1** — both below 4.5:1 for the 14px semibold button labels. The ₨ budget figure itself is `text-green` on white ≈ **2.0:1** (`budget-step.tsx:72`), failing even the 3:1 large-text threshold.

**Why it matters:** A keyboard user cannot see where they are in a four-step form. A low-vision user cannot read the button they must press — or the single number the entire product is about.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2` to every interactive element (better: hoist into a shared button class). Render the budget figure in `charcoal` and let green live in the ₨ mark and the slider thumb. Darken button fills past `dark-green` (#5a8a1a is still only ≈4.1:1 on white).

**Suggested command:** `/impeccable audit`

## Cognitive Load

**6 of 8 checklist items fail → HIGH (critical fix needed).**

| Item | Result |
|---|---|
| Single focus | **FAIL** — step 3 stacks four decisions on one screen: plan type, amount, which meals, plus a breakdown to read. |
| Chunking (≤4/group) | **FAIL** — 7 preference chips + 9 allergen chips render simultaneously. |
| Grouping | PASS — cards group related controls correctly. |
| Visual hierarchy | **FAIL** — every block is the same white/sage `shadow-sm` card at the same elevation, and the one element with real scale is also the faintest thing on screen. |
| One thing at a time | **FAIL** — as above. |
| Minimal choices (≤4) | **FAIL** — enumerated below. |
| Working memory | **FAIL** — the Launch validation toast requires recalling an invisible screen; Launch itself requires remembering the ₨ figure from step 3 with no restatement and no preview. |
| Progressive disclosure | PASS at flow level; the breakdown correctly gates on `mealTypes.status === 'ready'`. |

**Decision points with >4 visible options:**
- **Dietary step** — 7 preference chips + field + Add, *plus* 9 allergen chips + field + Add = **20 interactive controls on one screen**.
- **Budget amount** — 4 preset chips + slider + number field = **6 competing ways to set one value**.
- **Budget step overall** — 2 plan-type buttons + 6 amount affordances + N meal-type cards = 11+ visible decisions.
- **TimePicker** — 24 hour options + 60 minute options in scrolling listboxes = **84 options behind one control**, for values already correctly pre-filled.
- **Location** — search field + up to 5 geocoder results + Detect + draggable pin + map-click + 2 zoom buttons = 6+ ways to set one coordinate pair.

## Emotional Journey

**Entry** is from `verify-email/page.tsx:82` — right after a real win (OTP accepted). That momentum is squandered within one second: step 1 lands on a full map **already pinned in Karachi**. For the majority of Pakistani users who are not in Karachi, the first thing the product communicates is that it doesn't know where they are — presented with exactly the same confidence as a real answer.

**Valley 1 — the trust moment is unaccompanied.** The flow asks for a home address on screen one and a money figure on screen three. Between them there is not one word about what is stored, who sees it, or why. The sole reassurance is one 11px line of `text-slate/70` (`onboarding-shell.tsx:161`) at ≈3.8:1 — the lowest-contrast text on the page. The highest-stakes ask gets the least legible support.

**Peak 1 (real, undersold).** Step 2 is the flow's most pleasant moment: tapping "halal", "no beef", "high-protein" is fast, culturally recognized, and feels like being *understood* rather than interrogated. It is sandwiched between a map and a money form and given no weight.

**Valley 2 — the money screen is rendered in the error color.** Tomato eyebrow, tomato Continue, tomato validation error, all on the same screen. Wrong emotional register for the moment you ask someone to commit money.

**Peak 2 (earned).** "Launch my BudgetBite" + rocket is good copy and earns the moment.

**The end is where this fails hardest.** The peak deflates instantly. The button promises "Generating your plan…" — the API doesn't do that synchronously (`budget-plan.service.ts:230`, verified: env-gated *and* fire-and-forget). The toast is a generic "Setup complete!" Then `router.push('/dashboard')` drops the user on a screen headed "What's for today?" that may have nothing in its meal slots. **Everything the user just told the app — their neighbourhood, their halal preference, their ₨45,000 — is never reflected back.** Peak-end rule says the ending is what gets remembered, and this ending is an unceremonious redirect.

## Persona Red Flags

**Jordan (Confused First-Timer)**
- Lands on a map already pinned in Karachi, badged "Tap or drag pin", showing a street he's never heard of. He cannot tell whether the app *knows* where he lives or is *guessing*. Nothing says "this is a guess."
- **"Detect"** is a one-word label on a ~30px chip. He won't map it to "use my current location," and tapping it fires an OS permission dialog with no forewarning.
- The "Optional — skip if anything goes" hint is on the *preferences* picker only; Allergens says "Hard limits" with no optional marker, so he'll believe allergens are mandatory and won't know what to type.
- Three ways to set one number. He types into the field, the slider won't follow past `config.max`, the preset chips never light up. He can't tell which control the app is listening to.
- Both support instructions tell him to contact support **with no link, address, or button**. That is precisely where Jordan abandons.

**Casey (Distracted Mobile User)**
- A 280px Leaflet map mid-screen on a 390px viewport: a finger drag pans the map, not the page, and there's no cooperative-gesture guard. He gets stuck partway down step 1. *(Inferred from the Leaflet config — not browser-verified.)*
- The fixed bottom bar is the right instinct, but **every tap target above it is under 44px**: Detect (~30px), quick-pick chips (~26px), the reminder switch (`h-6` = 24px), map zoom (32px), dietary chips (~34px).
- A call interrupts him mid-budget; the tab reloads and his ₨ figure is gone.
- The budget field is `type="number"` with `Number(event.target.value)` — clearing it yields `0`, which fails `.positive()` and paints a red error *while he is still typing*, leaving a literal `0` he must delete.
- Step 1 pulls Leaflet, CARTO tiles, and marker sprites from **`unpkg.com`**, and fires a Nominatim reverse-geocode on every coordinate change. Nothing is tuned for a slow connection.

**Bilal, the ₨-counting Foodpanda regular** *(project-specific, derived from PRODUCT.md §Users: 26, Lahore, orders lunch 4-5×/week, knows to the rupee what karahi costs near his office)*
- The map opens on Karachi. He's in Lahore. **The first thing the product shows him is that it doesn't know where he is.** Credibility test, failed at second zero.
- He types ₨18,000 monthly; the flow replies "≈ ₨200 per meal" and draws three identical bars. He knows ₨200 doesn't buy lunch anywhere he'd order from. The app doesn't push back, doesn't say "that's tight for your area," and doesn't show him one real ₨200 item to prove it's possible. **He has no reason to believe the number is achievable — and the entire product rests on it being achievable.**
- He never sees a restaurant, a menu item, or a price during onboarding, despite the app having scraped exactly that data.
- "live prices" reads as marketing, and it's a claim the product itself disclaims.
- He selects Lunch and Dinner only and finds the budget split evenly — but his dinners cost twice his lunches. The flow offers no way to say so.

## Minor Observations

- `progress` (`use-onboarding.ts:97,205`) and `values.reminderText` (`use-notification-step.ts:142`) are computed and exposed but rendered nowhere.
- Progress segments and dots are non-interactive `<div>`s styled like navigation. Either make them buttons that jump to completed steps, or make them read less clickable.
- Section labels inside steps are `<p>`/`<span>`, so each step has exactly one heading — heading navigation gives a screen-reader user no structure within a step.
- Step change remounts via `key={currentStep}` with no focus management and no live region; focus stays on the footer button and the new `h1` is never announced.
- "Quiet by default" restates the step description *and* the footer line — three versions of the same reassurance on one screen.
- The number field and slider desync silently above `config.max`: type 500,000 monthly and the slider pins at 200,000 with no indication which value wins.
- The slider has `aria-label="Budget amount"` but no `aria-valuetext`, so it announces "45000" instead of "₨ 45,000".
- Switching Weekly↔Monthly preserves the number, silently reinterpreting ₨45,000/month as ₨45,000/week (4.3×).
- No cap on meal-type selection, while `createBudgetPlanSchema` requires `mealsPerDay ≤ 5` — 6+ active meal types makes the final click a 400.
- A user arriving from `plan-summary-card.tsx:105` ("Finish onboarding to add your location") hits 409 `PLAN_ALREADY_ACTIVE` with only a generic toast, and can therefore never finish.
- The duplicated `if (!currentStepData) return null` guard in both `page.tsx:15` and `onboarding-shell.tsx:30` suggests unclear ownership.
- **Cross-surface:** the same "create a budget plan" decision exists twice with no shared design — onboarding uses slider + presets + big ₨ + check cards; `/plans` uses a shadcn `Select` + bare `Input` + pill checkboxes. Reminder toggles differ too (`role="switch"` vs an ON/OFF pill with `aria-pressed`). And `/plans` — the *lower*-stakes flow — has a preview step that onboarding lacks.
- There is no DESIGN.md on the resolution path from `apps/web`, so the detector's four `design-system-*` rules are permanently inactive for this app. Token drift is currently unenforceable.

## Questions to Consider

1. **What if step 1 ended with "47 restaurants within 10 km — cheapest lunch: ₨320 chicken pulao, 1.4 km away"** instead of a reverse-geocoded street name? The data is already in the DB. What does it cost to *prove* the positioning instead of asserting it in a subhead?
2. **Why does the lower-stakes `/plans` dialog have a review step and the first-run flow doesn't?** What if screen five reflected everything back — neighbourhood, ₨ figure, meals, reminder times — and *that* were the peak, rather than a rocket button that redirects to a possibly-empty dashboard?
3. **What if the budget step asked "what does lunch usually cost you?" and derived the period budget** — instead of asking for a monthly total the user has to divide in their head? Which number does a Pakistani takeout orderer actually know off the top of their head?
4. **Does this need to be four steps?** Dietary preferences block nothing, and notification times are pre-filled for a feature PRODUCT.md says isn't wired up yet. What if onboarding were two screens — where you are, what you'll spend — and the rest surfaced in settings when they matter?
5. **What if the budget figure were the hero of the whole flow**, pinned in the header from step 1 onward, rather than appearing on screen 3 and vanishing on screen 4? The product's first principle says remaining budget must stay legible on every surface. Onboarding is a surface.
6. **What would a version look like that treated trust as a design problem rather than a footnote?**
7. **What if a wrong answer were survivable by design** — a real "Skip, I'll set this later" on every step plus a persistent "finish setup" prompt on the dashboard — instead of a four-step gate with a silent Karachi default behind it?
