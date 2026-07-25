---
target: the dashboard
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-07-25T13-18-02Z
slug: apps-web-app-dashboard-page-tsx
---
⚠️ DEGRADED: single-context (harness restricts sub-agent spawning to explicit user request; browser inspection not run — auth-gated dashboard needs a running API + Neon DB + logged-in session)

Re-critique after the seven-step fix pass. Assessment A (design review) + Assessment B's detector both ran in this one context. Detector: `detect.mjs` over the dashboard tree, exit 0, **0 findings**.

## Design Health Score

| # | Heuristic | Score | Δ | Key Issue |
|---|-----------|-------|---|-----------|
| 1 | Visibility of System Status | 3 | — | Good states; the one remaining pulse now signals "today" honestly |
| 2 | Match System / Real World | 3 | — | Fluent; held back by one stale empty-state string and the unexplained "Watch" status |
| 3 | User Control and Freedom | 3 | — | Change/reroll/dismiss all present |
| 4 | Consistency and Standards | 3 | ▲2→3 | `formatPKR` unifies currency; triplication + dead dark theme gone. A few hardcoded hexes (`bg-[#f0f9e0]`) still bypass tokens |
| 5 | Error Prevention | 3 | — | Schema-validated logging, reversible actions |
| 6 | Recognition Rather Than Recall | 3 | — | `aria-current` added; everything visible |
| 7 | Flexibility and Efficiency | 2 | — | Still no shortcuts/bulk (acceptable for the task) |
| 8 | Aesthetic and Minimalist Design | 3 | ▲2→3 | Hierarchy + eyebrows + single entrance fixed; budget hero still competes as a second focal point and "spent" repeats 3× within the summary |
| 9 | Error Recovery | 3 | ▲2→3 | Raw `error.message` leaks removed; still no retry affordance |
| 10 | Help and Documentation | 1 | — | Derived metrics ("On track", "Per meal left") still have no explanation |
| **Total** | | **27/40** | ▲ +3 | **Acceptable — top of band, one fix from Good** |

## Design Specificity Verdict

**Still authored for BudgetBite, and now cleaner.** Detector `[]` again (exit 0) — no template patterns crept in during the refactor. The money-first identity, meal-slot cards, and voice remain product-specific; the currency now reads identically everywhere via `formatPKR`. (Browser overlays unavailable this run; source-derived.)

## Overall Impression

Real, measurable improvement. The screen now answers its actual question first — *what do I eat today?* — with the budget as context beneath, the currency is consistent, the no-plan screen is one confident moment instead of four fragments, and the motion and contrast are honest. The score moved 24 → 27.

The one thing the reorder didn't finish: the budget summary was moved **down** but not **down in weight**. It's still a full hero (₨ remaining at 6xl) so the page now has two heavyweight blocks — the meal chooser and the budget hero — competing for "look here." Subordinating the summary visually is the single fix that takes this from Acceptable to Good.

## What's Working

1. **The reorder landed.** Greeting → today's meals → budget → history reads as a clear task flow, and the single page-level fade replaced five identical section entrances.
2. **Money is finally one thing.** `formatPKR` everywhere on the surface, and remaining-budget no longer triplicated on desktop (header pill is `lg:hidden`). Directly serves the "honest money UI" principle.
3. **The no-plan screen is confident.** One headline, one CTA, a numbered 3-step "how it works" — a genuine first-run moment rather than scattered "no plan yet" text.

## Priority Issues

**[P2] The budget summary competes with the meal chooser**
- **Why it matters:** Moving it below the meals fixed the *order* but it's still a full-weight hero (6xl remaining number + right-column stats + progress + 3 stat cards). Two big blocks means the eye still doesn't have one obvious anchor — the exact problem the reorder set out to solve, now half-solved.
- **Fix:** Subordinate it. Shrink the remaining figure (e.g. 3xl, not 6xl), or compress the whole summary into a single slim budget strip (remaining · progress · days left) and drop the separate stat cards. Let the meal chooser be visibly the largest thing on the page.
- **Suggested command:** `/impeccable distill` (then `/impeccable layout` if you restructure)

**[P2] "Total spent" appears three times inside the summary**
- **Why it matters:** Within the one budget block, spend shows in the hero subtitle ("₨ X spent"), the progress legend ("Spent: ₨ X"), and the "Total spent" stat card. The triplication moved from across the page to inside one section.
- **Fix:** Show spent once. Keep it in the hero context line; drop it from the progress legend and/or fold the stat cards into the hero.
- **Suggested command:** `/impeccable distill`

**[P2] Stale empty-state copy now misleads users who have a plan**
- **Why it matters:** Now that `DashboardBody` gates the no-plan case, the MealSlots empty state ("No meal suggestions available — create or activate a plan to get started.") only ever renders for someone who *already has* a plan but no slots today. The copy tells them to do something they've already done.
- **Fix:** Rewrite for the real situation — e.g. "No meals suggested for today yet. Check back after your plan generates, or log a meal manually."
- **Suggested command:** `/impeccable clarify`

**[P2] Derived metrics still have no explanation**
- **Why it matters:** "On track: Watch", "Per meal left", and the "on track" threshold are computed values a user can't interpret or act on. Help/Documentation stayed at 1.
- **Fix:** Add a tooltip or one-line caption on each ("Watch = you're spending faster than budget"; "Per meal left = remaining budget ÷ remaining meals").
- **Suggested command:** `/impeccable clarify` (or `/impeccable onboard` for first-run coaching)

## Minor Observations

- Unlogged option tiles are still bordered cards nested inside the white meal card (craft-floor flags nested cards); softening to a fill-only tile would tidy it.
- The budget summary still leans on the hero-metric template (big number + label + 3 supporting stats) — a more product-specific budget visualization (a per-day burn-down) is a future `bolder` opportunity, not a defect.
- Locale split remains deliberate: currency groups `en-US`, dates format `en-PK`.

## Questions to Consider

- If the meal chooser is the point, should the budget be a single slim strip rather than a hero that rivals it?
- How many times does one person need to see "spent" in one glance before it stops being information?
- What would make "On track" actionable rather than just a verdict?
