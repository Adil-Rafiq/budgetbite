---
target: profile
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-01T07-24-06Z
slug: apps-web-app-profile-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Toasts, "Saving…", and disabled-until-dirty are solid — but nothing shows *which* of the six cards has unsaved changes, and the loading skeleton has no `aria-busy`/`role="status"` (`analytics/page.tsx:501` ships exactly that pattern). |
| 2 | Match System / Real World | 2 | "Notification times" is a **budget plan** property dressed as an account setting; its empty state leaks the schema ("Create a plan to configure reminders"). "Update location" names a database write, not the user's goal. |
| 3 | User Control and Freedom | 1 | No undo, no revert, no cancel on any of the five forms. No unsaved-change guard. No confirm on Sign out, on removing a favorite, or on moving your home location — the highest-consequence control in the product. |
| 4 | Consistency and Standards | 1 | `FOCUS_RING` is imported by 33 files across the app; **zero** in `app/profile/` (verified). Two label systems inside one card. Container is `max-w-5xl` while dashboard and analytics are `max-w-[1180px]`. Five save buttons, five labels, two visual weights for identical stakes. |
| 5 | Error Prevention | 1 | Data loss by design (P0). A password form offered to users who provably cannot use it. Location committed with no consequence preview. No `maxLength` on either name field. Two identical 08:00 reminders save without a duplicate check. |
| 6 | Recognition Rather Than Recall | 2 | Good section titles/icons/hints, but the saved location is never shown as text (you must read a pin), the 10 km rule taught in onboarding is never restated, and six equal-weight cards make "where do I change allergens" a scan every time. |
| 7 | Flexibility and Efficiency | 2 | The map's search combobox is genuinely well built (debounce, arrow keys, Escape, `aria-activedescendant`). But the `↵` hint appears on one of five forms, there is no keyboard path to set the map pin, and no section deep-links. |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, coherent, correct app-shell rhythm; `Section` is a real primitive. Loses a point for zero hierarchy across six cards and a 280px map crammed into a half-width desktop column. |
| 9 | Error Recovery | 2 | Toasts carry title + description, but five field errors have no `role="alert"`, no `aria-invalid`, no `aria-describedby` — while the `DietaryTagPicker` embedded on the same page *does*. And "Check your current password." is actively wrong for the OAuth user who has none. |
| 10 | Help and Documentation | 3 | The hints do real work — "Hard limits — suggested meals will never include these", "Favorites nudge the AI toward these; blocks are never suggested". Nothing explains what moving your location does, or that reminders belong to a plan. |
| **Total** | | **19/40** | **Poor — major UX work needed before this is release-quality** |

## Design Specificity Verdict

**LLM assessment: category-interchangeable.** The structural core is `grid grid-cols-1 gap-5 lg:grid-cols-2` holding six identical `rounded-2xl border border-sage bg-white p-6 shadow-sm` cards, each with a green-tinted icon tile, a 15px title, a 12px hint, a form, and a left-aligned save button. Swap six strings and this ships as the settings page of any Supabase starter or Vercel dashboard. Nothing in the composition knows it belongs to a budgeting app — the word "budget" appears nowhere on the page.

What *is* BudgetBite-shaped here is inherited from elsewhere: `LocationMap` and `DietaryTagPicker` come from onboarding, and `FoodPreferencesCard` — the one genuinely product-specific thing — lives in a child file. The page's own contribution (header, identity strip, name form, password form) is interchangeable in every respect.

**The degradation is the damning part.** The Location card is the same control as `onboarding/_components/steps/location-step.tsx`, shipped worse:

| | Onboarding | Profile |
|---|---|---|
| Detect icon | `<LocateFixed />` | `<span>◉</span>` — a raw U+25C9 fisheye, the only one in the app |
| Focus ring | `FOCUS_RING` | none |
| Button height | `min-h-11` (44px) | `py-2` ≈ 35px |
| Proof of consequence | `<NearbyProof>` — live restaurant count, closest name, min price at that pin | nothing |
| Fallback coords | passed as `fallbackCenter` (a view hint) | **written into the form value** |

That last row contradicts a docblock the team wrote for exactly this hazard (`onboarding/constants.ts:49-55`: *"It is deliberately never written into the location form: a user in Lahore who taps straight through must not silently commit a Karachi address, because proximity is the whole mechanic"*). On Profile, a user with no saved location gets a pin dropped on central Karachi, reverse-geocoded, and labelled **"Your spot."** — and because the form isn't dirty, "Update location" is disabled, so they cannot correct it without first moving the map.

**Deterministic scan: clean, and that is not reassuring.** `detect.mjs --json apps/web/app/profile` returned `[]`, exit 0. The single-file run against `page.tsx` confirmed coverage — also `[]`. `apps/web/scripts/check-tokens.mjs` passed: *"Design tokens OK — no ghost colour utilities."* No raw hex/rgb literals anywhere in the profile tree; the only inline style is `borderTopColor: 'transparent'`.

The detector also **corrected two suspicions** rather than confirming them: every interactive element on the surface has an accessible name (both icon-only buttons carry explicit `aria-label`s), and the `initials()` helper is *not* buggy — `"A" + ""` is truthy, so the one-word-name case renders correctly and `|| '•'` fires only when it should. Two false leads killed by evidence.

What the scan cannot see is where this page actually fails: focus rings, contrast, target size, cross-form state destruction, and the gap between two implementations of the same control. Static evidence confirmed the measurable half — every button the page authors is under the house 44px rule (`py-2 text-[13px]` ≈ 35px for the five main saves; `py-1.5` ≈ 30px for the notification controls; `h-8 w-8` = 32px for remove-reminder; **`h-6 w-6` = 24px** for the *destructive* remove-favorite), and one control signals state by colour alone (the TimePicker's selected hour/minute).

**Visual overlays: not available.** A dev server is running on :3000, but `/profile` 307-redirects to `/login` — the route is auth-gated by `apps/web/proxy.ts` and needs a live API + database. Injection was not attempted and no overlay exists in your browser. All findings below are source-verified instead.

## Overall Impression

This page is app-shell-consistent and completely unauthored. It looks fine and it loses your data.

The craft floor here is measurably below the rest of the app — not by taste, by grep. `FOCUS_RING` appears in 33 files and zero times in `app/profile/`. `input.tsx:14` documents `min-h-11` as the house target rule; no button on this page obeys it. `onboarding/constants.ts` carries a docblock explaining why the Karachi fallback must never be written into a form value; this page writes it. Every one of these is a decision the team already made correctly somewhere else. This surface is the unswept one.

The single biggest opportunity: **this page owns the planner's constraints.** Location, allergens, blocks, and favorites aren't preferences — they are the rules that decide what the AI can ever suggest. A settings page that showed what those constraints actually cost you ("these 4 rules removed 62 of 340 nearby items") would be unmistakably BudgetBite's, and it would be built from data the app already has.

## What's Working

1. **The hints are contracts, not captions.** "Hard limits — suggested meals will never include these." "Favorites nudge the AI toward these; blocks are never suggested." "Preferences and allergens the AI must respect." These tell the user what the *AI is bound by* — principle 5 (honest UI) landing at field level. Most settings pages write "Manage your dietary preferences."

2. **The favorites/blocks empty state is the best-authored fragment on the surface.** It renders the actual `Heart` and `Ban` glyphs inline mid-sentence — the same icons the user will tap — and links to the exact page where the action lives. Eight lines that turn a dead end into a tutorial, with no modal.

3. **Disabled-until-dirty on every editable form.** No false affordances, no no-op writes hitting the API, and "there's nothing to save here" communicated without a word of copy. It's the right primitive. It just needs its complement — a dirty *indicator* — which doesn't exist.

## Priority Issues

### [P0] Unsaved edits are destroyed silently, by three separate mechanisms

**What.** All three paths verified in source:

- **Cross-form.** `onSaveAccount` calls `queryClient.invalidateQueries(['users','me'])` (`page.tsx:157`), and `useUpdateProfile.onSuccess` does the same (`hooks/use-user.ts:19`). The refetch yields a new `user` object → new `useMemo` defaults → the `useEffect([user])` at `page.tsx:125-131` calls `accountForm.reset()` and `locationForm.reset()`, while `use-dietary-step.ts:25-31` fires its own `reset()` on `[profile, form]`. **Saving any one card resets the other three**, dirty or not.
- **Window refocus.** `refetchOnWindowFocus` is never set in `lib/get-query-client.ts`, so it defaults to `true`, and `staleTime` is 60s. Glance at WhatsApp for a minute, come back, everything unsaved is gone.
- **Navigation / refresh.** No `beforeunload` handler exists anywhere in the app, and there is no route guard.

**Why it matters.** The reset is identity-based, not value-based — a refetch returning byte-identical data still wipes edits. And the loss is announced by a green success toast: you edit your name *and* add "peanuts" to allergens, hit Save on Personal, and watch the allergen disappear under "Profile updated". On a six-form settings page, editing two cards before saving is the expected behaviour, not an edge case. This is also a food-safety field.

**Fix.** Gate both reset effects on `!formState.isDirty`. Set `refetchOnWindowFocus: false` on `['users','me']` and the active-plan query. Add a route/`beforeunload` guard reusing the discard-confirm already built in `create-plan-dialog.tsx:66-78`. Add a per-`Section` dirty dot so "unsaved changes here" is visible *before* the loss is possible.

**Suggested command:** `/impeccable harden`

### [P1] The Password card is a functional dead end for OAuth-only accounts

**What.** `apps/api/src/lib/auth.ts` enables Google and GitHub, and both login and register pages offer them. `authClient.listAccounts` is called nowhere in the web app, and `userSchema` returns no provider info — so `<Section icon={Lock} title="Password">` renders unconditionally at `page.tsx:426`. A Google-only user fills three fields, submits, and gets **"Could not change password — Check your current password."** for a password that has never existed.

**Why it matters.** It is the last card in the mobile column — the page's ending. The system blames the user for its own missing state, and users in this position typically conclude they've forgotten a password they never had, then go to password reset, which is a second dead end.

**Fix.** Return linked providers from `GET /api/users/me`, or call `authClient.listAccounts()` client-side. With no `credential` account, replace the form with *"You sign in with Google. There's no password on this account."* plus a "Set a password" affordance if `setPassword` is enabled. At absolute minimum, fix the error copy.

**Suggested command:** `/impeccable harden`

### [P1] Moving your home location has no proof, no consequence, and a fabricated default

**What.** Three defects in one card. (a) `initialLocation` writes `DEFAULT_MAP_VIEW` into the form when the profile has no coordinates (`page.tsx:104-110`), so the map sees finite numbers, drops a pin on Karachi, reverse-geocodes it, and labels it "Your spot" — and since the form isn't dirty, the user can't save a correction without moving the map first. (b) No equivalent of onboarding's `NearbyProof`: zero evidence of what the new location buys or costs. (c) No confirmation for the action that permanently redefines the app's entire candidate set and can strand the active plan's picks outside the delivery radius.

**Why it matters.** This hits principles 1 and 2 head-on. The app claims "only real, nearby, orderable items", then shows a location the user never chose as though they chose it.

**Fix.** Pass `fallbackCenter={DEFAULT_MAP_VIEW}` and leave the form values `undefined`, exactly as the onboarding step does. Mount `NearbyProof` under the map against the *pending* pin. Rename the button "Save this location", and when a plan is active, confirm with real numbers: *"14 restaurants deliver within 10 km of the new spot (you have 31 today). 2 meals in your current plan fall outside it."*

**Suggested command:** `/impeccable clarify`

### [P1] The accessibility floor is below the rest of the app

**What.** All verified:

- `primaryBtn` / `ghostBtn` (`page.tsx:84-87`) carry **no `focus-visible` styles** — grep for `FOCUS_RING|focus-visible` across `app/profile/` returns zero matches, against 33 files elsewhere. The base `* { @apply outline-ring/50 }` rule leaves all seven buttons with a 50%-alpha `#8cc63f` outline that is effectively invisible.
- `labelClass` is `text-slate/60` at 10px uppercase with `0.18em` tracking → roughly `#929292` on white, ≈**3.1:1**. That's the label on *every* field on the page. `restaurants/page.tsx:60` uses the identical class at full `text-slate`.
- Five error `<p>`s with no `role="alert"`; inputs with no `aria-invalid` / `aria-describedby`. A failed submit announces nothing.
- The disabled email input removes both the field *and* its explanatory note from the tab order.
- `<span>◉</span>` and `<span>↵</span>` are not `aria-hidden`; the map has no keyboard path to set the pin (click handler + draggable marker only).

**Fix.** Import `FOCUS_RING` into both button constants and add `min-h-11`. Change `labelClass` to full `text-slate`. Add `role="alert"` + `aria-invalid` + `aria-describedby` to all five error paths. Replace `◉` with `<LocateFixed />` to match onboarding. Make email `readOnly` rather than `disabled` so it stays focusable.

**Suggested command:** `/impeccable audit`

### [P2] No hierarchy, five vocabularies for one action, and every target undersized

**What.** Six visually identical cards — same radius, border, shadow, padding, icon tint — ordered by nothing but source position. Save buttons labelled "Save changes" / "Update location" / "Save dietary settings" / "Save" / "Change password", in two different visual weights for identical stakes. Container `max-w-5xl` against `max-w-[1180px]` everywhere else. And every button the page authors is under the house 44px rule, down to a **24px destructive** remove-favorite. The only correctly sized targets on the page are the map's zoom buttons — from a shared component.

Dietary, Location, and Favorites are *planner inputs* that change what the AI can ever suggest; Personal and Password are account metadata. They render at identical weight.

**Fix.** One `SaveRow` sub-component per Section: single "Save" label, `min-h-11`, `FOCUS_RING`, dirty dot. Give planner-input cards a distinct icon tint from account cards and order the grid by stakes. Bump remove buttons to a 44px hit area with an inset glyph.

**Suggested command:** `/impeccable layout`

## Persona Red Flags

**Sam (accessibility-dependent)**: Seven tab stops — Sign out, Save changes, Use my current location, Update location, Save dietary settings, Change password — with no visible focus ring. Five error messages that announce nothing on submit (no `role="alert"`, no `aria-invalid`). The disabled email field is skipped in the tab order, taking "Email changes aren't supported yet" with it, so Sam never learns why it's inert. `◉` is announced as "circled dot" before "Use my current location"; `↵` is read inside the Save button's name; the avatar `<div>` reads initials as letter salad immediately before the same person's full name. The map pin can only be moved by click or drag — no keyboard path at all — and the search input has `aria-autocomplete`/`aria-expanded`/`aria-activedescendant` but **no `role="combobox"`**, so the input↔listbox relationship is never exposed. The loading skeleton is five pulsing divs with no `aria-busy`, while `analytics/page.tsx:501` ships the correct pattern. Six `<section>`s with no accessible name map to `generic`, not `region`.

**Casey (distracted mobile, one-handed)**: A 24px destructive remove-favorite, a 32px remove-reminder, ~30px On/Off toggles, and ~35px on all five save buttons — every one below the 44px rule the codebase documents in `input.tsx:14`. Every save is `self-start`, bottom-left of a tall card: the hardest one-handed reach, and nothing is sticky. The exact Casey scenario — glance at a notification, return 60 seconds later — triggers `refetchOnWindowFocus` and wipes every unsaved field. Worst: `LocationMap` renders a 280px full-width Leaflet canvas with scroll-wheel zoom and drag enabled, mid-page, with no tap-to-activate gate — scrolling past the Location card *pans the map*, and a pan sets `shouldDirty: true`, arming a location change by accident. Changing a password on a phone means scrolling past the map and all 16 dietary chips.

**Riley (stress tester)**: Edit name + allergens, hit "Save changes", watch the allergens revert under a green success toast — reproducible on demand. A brand-new OAuth user who skipped onboarding lands straight on the fabricated Karachi pin labelled "Your spot", with the correction button disabled. `accountSchema` is `.min(1)` with no max and neither input has `maxLength`, so a 500-character name passes client-side. `add()` always inserts `08:00` with no duplicate check — press Add twice, save, get two identical reminders; `remove(i)` deletes instantly with no undo. Sign out has no confirm and no `queryClient.clear()`, so the cache survives the session boundary. Two suspicions Riley *cleared*: `initials()` handles one-word names correctly, and every icon-only control has a proper `aria-label`.

## Minor Observations

- The subtitle "Account, location, reminders." inventories three of six cards — dietary, favorites/blocks, and password go unmentioned on a page whose main problem is finding the right card.
- The `LocationMap` skeleton uses `rounded-[10px]`/`rounded-[14px]` and `bg-sage` while the real component renders `rounded-xl`/`rounded-2xl`; onboarding's skeleton gets both right with `bg-canvas`. The placeholder doesn't match the thing it stands in for, and it pops on load.
- `Profile.` is flat next to `Every rupee, accounted for.` (analytics) and `What's for today?` (dashboard). The surfaces with the flattest headlines are the ones with no product idea in their composition either.
- No `FadeUp` entrance here; dashboard and analytics both use it.
- Sign out appears twice in one viewport — identity card and header dropdown — styled differently, confirmed in neither.
- `app-header.tsx:48-54` contains a second, differently-signatured `initials()`. One concept, two implementations, guaranteed drift.
- The `↵` hint appears only on the Personal form. Enter submits the Password form too, with no hint.
- `globals.css` defines colour and radius tokens but **no font-size scale**, which is why `text-[10px]`/`text-[13px]`/`text-[15px]` are scattered across every file. Repo-wide, not a profile defect — but it's why the two label systems could diverge unnoticed.
- Cognitive load: **6 of 8 checks fail** (single focus, chunking, hierarchy, one-thing-at-a-time, ≤4 options, working memory, progressive disclosure). Six simultaneous forms is the *right* pattern for a settings surface — users arrive with a target, not a journey. What fails is what the pattern obligates: per-card dirty state, per-card revert, guaranteed isolation between cards, and a nav aid past ~4 cards. The page provides none of the four and actively violates isolation.

## Questions to Consider

1. **Why does the reminder schedule live on Profile when the budget amount — the same plan's property, and the actual product — doesn't?** Right now the page has arbitrary custody of one plan field and pretends it's an account setting.
2. **If location is the mechanic the whole product rests on, why is it the second card in a six-card grid rather than a surface of its own?** Onboarding gives it a full step with live proof; changing it later gets half a card and a ghost button.
3. **What is a settings page for, in an app where the settings *are* the planner's inputs?** A card showing "these 4 constraints removed 62 of 340 nearby items from your plan" would make this page unmistakably BudgetBite's — from data the app already has.
4. **Six independent save buttons, or one page-level save bar that appears when anything is dirty?** The current model has all the cost of independence and none of the benefit, since a single mutation already invalidates everything anyway.
5. **Would you ship a page where the success toast and the data loss fire in the same frame?**
