---
target: profile
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-01T08-19-09Z
slug: apps-web-app-profile-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The location proof panel and confirm dialog report the **previous** pin's restaurant count as the new one's, with no loading state — `useRestaurants` sets `keepPreviousData`, so `isPending` is false while the data is stale. |
| 2 | Match System / Real World | 3 | Strong constraint language throughout, but the duplicate-reminder warning hardcodes "Two reminders…" and the band label "Your current plan" reads as a subscription tier. |
| 3 | User Control and Freedom | 2 | Browser Back is completely unguarded — `useUnsavedChanges` has no `popstate` handler. On mobile the back gesture is the primary exit, and it destroys every edit silently. |
| 4 | Consistency and Standards | 2 | Two opposite commit models on one page: five cards use explicit Save/Revert with a dirty badge; `FoodPreferencesCard` deletes on tap with no confirm and no undo. Two Sign-outs, 40px apart, with opposite safety guarantees. |
| 5 | Error Prevention | 3 | Location confirm, time dedupe, `readOnly` email, fallback never written to state — all good. But the mobile map still commits a coordinate on any click and eats thumb-scroll. |
| 6 | Recognition Rather Than Recall | 3 | Everything labelled and hinted, `NearbyProof` shows evidence. But `dirtyCount` is computed and shown only inside modals — while editing, which cards are unsaved is pure recall across ~2500px. |
| 7 | Flexibility and Efficiency | 2 | No save-all, no section jump list for six cards, no password reveal, no shortcuts. Six round-trips to change six things. |
| 8 | Aesthetic and Minimalist Design | 3 | Coherent palette and one card language, undercut by two whitespace holes the three-band grouping creates in a 2-column grid, plus a band containing one card. |
| 9 | Error Recovery | 2 | `Field`'s error contract is genuinely good, but every network failure is toast-only — a failed save leaves an amber "Unsaved" badge and no explanation once the toast expires. |
| 10 | Help and Documentation | 3 | Hints, empty states that teach and link. Missing: why Save is greyed out, any route from the populated reminders card to the plan it belongs to, account deletion/export. |
| **Total** | | **25/40** | **Acceptable — up from 19, but the rebuild introduced new defects** |

## Design Specificity Verdict

**LLM assessment: the copy is authored, the structure still isn't.** "Where you order from" / "Only restaurants within 10 km of this spot can be suggested", "Hard limits the planner has to work inside", the consequence-named confirm dialog — that language could not be lifted onto another product. `NearbyProof` is real product character: a settings control that renders live evidence of its own consequence from the same endpoint the browse page uses. The `tone="planner" | "account"` split is a genuine semantic invention.

Underneath, it is still a stock two-column card grid. The most consequential control in the product and the least consequential render in identical chrome at identical width, differing by a 36px icon tile colour.

**The three-band grouping does not earn its keep:**

- `GroupHeading` is a sibling `<div>` in the same grid, not a wrapper. Nothing is grouped — three captions are interleaved into a flat card list.
- The card counts do not fit a 2-column grid, so the bands render as whitespace scars: band 1 has three cards `[Location][Dietary] / [FoodPrefs][hole]`, band 2 has one `[Reminders][hole]`. Without the bands the six cards tile cleanly.
- "Your current plan" promises the budget plan and delivers a reminder list — and the `notification-times-card` docblock claims it "links to the plan they live on" when that link exists only in the empty state.

**Deterministic scan: clean, and it caught nothing that matters.** `detect.mjs` returned `[]` on both the profile tree and the two shared components. `check-tokens.mjs`, `lint`, and `check-types` all pass with zero warnings. Contrast measured across all seven token pairings passes AA — `text-slate` on white 8.86:1, `amber-ink` on `amber-tint` 5.50:1, `green-deep` on white 4.97:1. The palette is in good shape. Every real defect below lives where the token guard cannot see: `opacity-*` modifiers, inherited shadcn defaults, and runtime state.

**Visual overlays: not available.** A real session was obtained (demo login, `/profile` → 200), but the page is a client component so SSR yields the skeleton; post-hydration DOM was not observable. No browser automation is exposed and none was installed. Everything below is source-verified.

## Overall Impression

The rebuild closed every P0 and P1 from the previous run and introduced four new ones.

What is fixed and holds up: the cross-form data loss (three separate `isDirty` gates plus `refetchOnWindowFocus: false` on both feeding queries), the OAuth password dead end, the fabricated Karachi pin, focus rings on buttons and links, 44px targets, the save vocabulary.

What broke: the proof panel — the single best idea on the page — can now report a number that is not true. That is worse than the generic card grid it replaced, because it violates the product's second principle at the exact moment the design promised evidence.

## What's Working

1. **`NearbyProof` as a product-defining component.** A settings control that proves its own consequence, shared with onboarding so the same decision proves itself the same way in both places, with `NEARBY_PROOF_RADIUS_KM` guaranteeing the number equals what the user will see when browsing. The idea is excellent; only the freshness plumbing is broken.
2. **Dirty-state discipline in the query layer.** Three `isDirty`-gated reset guards plus `refetchOnWindowFocus: false` on `useUser` and `useActiveBudgetPlan`, each commented with this page as the reason. Six forms seeded from two shared queries is a hard state problem and the common failure is genuinely closed.
3. **`SaveRow` and `Field` as contracts.** One verb, one weight, one position, Revert always paired with Save. `Field`'s `useId` → `aria-describedby` / `role="alert"` / `aria-invalid` wiring is applied consistently on every text input.

## Priority Issues

### [P0] The location proof and confirm dialog show stale or fabricated counts

`useNearbyCount` derives `isLoading` from `query.isPending`, but `useRestaurants` sets `placeholderData: keepPreviousData` — when the pin moves, the key changes and TanStack returns the previous key's data with `status: 'success'`. So the panel and the dialog present the old location's count as the new one's. Separately, `total: query.data?.meta.total ?? 0` means a failed lookup renders as a hard 0, and the dialog never reads `isError` — a network failure produces "0 restaurants deliver within 10 km of the new spot — you have 0 today" as a statement of fact.

**Fix:** `isLoading: enabled && (query.isPending || query.isPlaceholderData)`, make `total` nullable on error, and render "We couldn't check what delivers there" instead of a zero.

**Suggested command:** `/impeccable harden`

### [P0] The header's Sign out destroys unsaved work, 40px from one that doesn't

`app-header.tsx` renders Sign out as a `DropdownMenuItem` whose `onSelect` calls `handleSignOut()` directly. It is not an anchor, so the capture-phase interceptor never sees it, and `beforeunload` does not fire on `router.push`. Three dirty cards, one tap, everything gone. The unsafe control is the one in persistent chrome — the one reached by habit. Same hole: browser Back, which `useUnsavedChanges` does not handle at all.

**Suggested command:** `/impeccable harden`

### [P1] A cancelled plan leaves an invisible, permanently dirty card

If the active plan disappears while reminders are being edited, `NotificationTimesCard` early-returns the empty-state `Section` — which passes no `isDirty` — but `draft` is still non-null and `saved` is now `[]`, so `isDirty` stays true and keeps reporting. The page then has a permanently dirty card with no form, no badge, no Save and no Revert, and every navigation is blocked by an edit the user cannot see or clear.

**Suggested command:** `/impeccable harden`

### [P1] Every text input on the page has a near-invisible focus ring

`Field` composes `Input`, which uses `focus-visible:ring-ring/50` — and `--ring` is `#8cc63f`, the token `globals.css` itself documents as 2.05:1. At 50% alpha that is roughly 1.4:1. Every button, chip and link on this page uses `FOCUS_RING` at 4.97:1; the focus indicator vanishes exactly on the inputs.

**Suggested command:** `/impeccable audit`

### [P1] Two ARIA defects in the map, both verified against the Leaflet source

- The search input sets `role="combobox"` with unconditional `aria-controls={listboxId}`, but the `<ul>` renders only when there are results. Most of the time `aria-controls` points at an ID that does not exist.
- The marker: `alt` was passed to `<Marker>`, but Leaflet only applies `alt` when the icon is an `<img>` — `wisprIcon` is a `divIcon`, so it is ignored, while `keyboard` still sets `tabIndex=0` and `role="button"`. The result is a focusable `role="button"` with no accessible name at all, and no app-authored focus style.

**Suggested command:** `/impeccable audit`

### [P2] Six near-illegible primary buttons are the page's resting state

`SaveRow` uses `disabled:opacity-50` on `bg-green-deep`: white on approximately `#a7bd8b` is about 2.04:1. Revert at `opacity-40` is about 2.7:1. Every card is clean on arrival, so the default view is twelve washed-out buttons, and `disabled:pointer-events-none` removes any hover route to explaining why. WCAG exempts disabled controls, so this is not a violation — but the codebase kills 4.13:1 tokens by build failure, and `check-tokens.mjs` cannot see `opacity-*`.

**Suggested command:** `/impeccable polish`

## Persona Red Flags

**Sam (accessibility-dependent)**: seven `<section aria-labelledby>` cards each become a region landmark, so the landmark list is a card inventory while the three bands — the actual page structure — get none. Four identical "Disable reminder" buttons (the sibling delete gets it right with the time). Removing a reminder or a favourite unmounts the focused button and dumps focus to `<body>` with no announcement. `role="alert"` on the duplicate warning re-interrupts on every edit. Two per-card skeletons with no `role="status"`. `AlertDialogFooter` is `flex-col-reverse` on mobile, so focus order contradicts reading order. All four dialog buttons use `ring-offset-white` on a canvas-coloured dialog when `FOCUS_RING_ON_CANVAS` exists for exactly that. And `lastName: min(1)` rejects mononyms — common in Pakistan, and what Google OAuth returns for single-token names.

**Casey (distracted mobile)**: browser Back and the header sign-out both discard everything silently. The 280px map still eats one-finger scroll and commits a coordinate on any click. She cannot tell what is unsaved without scrolling — `dirtyCount` exists and appears only in modals. Sub-44px on her actual path: map search input ~40px, address results ~34px, inline links ~16px. Both per-card skeletons are `h-64` against ~400px real cards, so the Account band jumps ~145px under her thumb when `useLinkedAccounts` resolves. `useLinkedAccounts` is the one form-feeding query that did not get `refetchOnWindowFocus: false`.

**Riley (stress tester)**: three reminders at 08:00 renders "Two reminders are set to 08:00. You'll be nudged twice." Both numbers wrong. `CANDIDATE_TIMES` has 27 entries but 24 unique, so past 24 the fallback appends duplicate 08:00s forever. Save a card while the leave-dialog is open and the title reads "Leave with 0 unsaved changes?". A broken avatar URL renders a broken-image glyph with `alt=""` and no `onError`, while `initials()` is already imported for the other branch. A correct 6-character legacy password is rejected with "Enter your current password." `changePassword` is called without `revokeOtherSessions` on a card hinted "Keep your account secure."

## Minor Observations

- `SaveRow`'s `mt-auto` and every form's `flex-1` are dead code — the grid is `items-start`, so cards are content-height and there is no free space to claim. Written for `items-stretch`.
- `disabled={!allValid}` on the reminders save is unreachable: `TimePicker` can only emit `HH:MM`.
- `hover:bg-tomato/90` on a `tomato-ink` button reduces contrast to about 3.36:1 — the exact anti-pattern `globals.css` documents fixing for green. The location dialog gets it right (`green-deep` → `green-deeper`); the page's two dialogs do not.
- "Stay and save" does not save, scroll, or focus anything — it just closes.
- `placeholder:text-slate/50` is about 2.5:1. Placeholder text is text.
- `key={i}` on reminders: values are controlled so display is right, but each `TimePicker`'s open state is keyed by position.
- Several docblocks have already drifted from the code they describe — the reminders card claims a plan link it only has in the empty state.
- Two competing breadcrumbs ~40px apart: the shell says "Home · Profile", the page eyebrow says "Account · Profile". System-wide choice, but still two location statements that disagree.

## Questions to Consider

1. Why is this one page? Location, dietary and favourites govern what the AI can suggest; name, email and password govern nothing. The code already names the seam (`tone: 'planner' | 'account'`) — why is it worth 36px of icon colour and not two routes?
2. Changing your location can strand an active plan's meals. The dialog says so and then does nothing. Where is the "re-plan around the new spot?" offer?
3. Why does `FoodPreferencesCard` get to break the commit contract the other five cards spent real complexity on?
4. What is the page's answer to "did it work?" Right now it is a toast, and this product's core scene is an interrupted phone. Should each card carry a "Saved · 2 min ago" line instead?
5. You built proof for location. Adding "shellfish" silently removes dishes from every future plan and shows nothing. Why is the best pattern on the page used exactly once?
