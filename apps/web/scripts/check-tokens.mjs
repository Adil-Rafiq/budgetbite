#!/usr/bin/env node
/**
 * Fail the build when a colour utility names a token the theme does not define.
 *
 * Tailwind v4 emits nothing for an unknown colour utility and says nothing about
 * it. That silence shipped a real bug: `FoodPreferenceToggle` styled its blocked
 * state with `border-pulse bg-pulse/[0.10] text-pulse`, none of which existed, so
 * blocking a dish — a hard exclusion on the AI planner — rendered identically to
 * not blocking it. The user clicked, the mutation succeeded, the UI said nothing.
 *
 * Rather than resolve every Tailwind default, this guards the specific families
 * from an earlier palette that were left behind in the codebase. Add a name here
 * if another ghost palette ever shows up.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['app', 'components', 'features', 'lib', 'hooks'];
const EXTENSIONS = /\.(tsx?|css)$/;

/**
 * Colour families the theme does not define.
 *
 * `lumen`/`pulse`/`soft`/`vast`/`fathom` are leftovers from a previous palette.
 * `dark-green` is different: it was real, and it was the app's link colour and
 * button hover in 193 places — but at 4.13:1 it failed AA as 12-13px text and
 * again as a fill under white labels. It was swept to `teal-deep` and deleted
 * from @theme, so it is listed here to make the sweep stick: reintroducing it
 * is now a build failure rather than a silent regression to sub-AA text.
 *
 * `green` and `sage` are here for the same reason, one palette later. The
 * "terrace" swap renamed them to `teal` and `sand` across ~930 call sites, and
 * a missed one is invisible: Tailwind emits nothing for `border-sage` and says
 * nothing about it, so the element simply loses its border. Listing them turns
 * every straggler into a build failure — which is also how the rename was
 * verified complete. This does NOT cover `BudgetFit`'s `green | amber | red`
 * rating in @repo/shared: that is a domain classification shared with the API,
 * not a colour token, and it never appears as `*-green`.
 */
const GHOST_TOKENS = ['lumen', 'pulse', 'soft', 'vast', 'fathom', 'dark-green', 'green', 'sage'];

const utilityPattern = new RegExp(
  String.raw`\b(?:text|bg|border|ring|fill|stroke|from|to|via|shadow|outline|divide|accent|caret)-(?:${GHOST_TOKENS.join('|')})(?:-[a-z]+)?\b`,
  'g',
);

/**
 * Utilities that exist but are wrong for the job, with the right one named.
 *
 * These are the failure modes dark mode introduced. Both are invisible in light
 * mode — which is the whole problem, since light is what most contributors have
 * on screen — and neither produces a build error on its own.
 *
 * `bg-white` is the sharper of the two: it is a Tailwind default with a literal
 * value, so it cannot follow the theme. 214 call sites of it meant every card
 * in the app stayed white on a near-black page. The opacity forms (`bg-white/5`
 * and friends) are deliberately still allowed — those are scrims on the
 * permanently dark landing bands, where white *is* the right answer.
 *
 * The `teal-deep` family is subtler. It is a fill token: the value a white
 * label sits on. Used as ink or as a border it happens to work in light mode,
 * because there one dark teal does both jobs — but in dark mode the fill stays
 * dark and the ink has to go bright, so `text-teal-deep` renders dark-on-dark.
 * `teal-ink` is the same value in light mode, so switching is free.
 */
const MISUSED_UTILITIES = [
  [/\bbg-white\b(?!\/)/g, 'bg-white cannot follow the theme — use `bg-surface`'],
  [
    /\bring-offset-white\b/g,
    'ring-offset-white pins the halo to light — use `ring-offset-surface`',
  ],
  [
    /\b(?:hover:|focus:|focus-visible:|group-hover:|active:)*(?:text|border|ring|shadow|fill|stroke|divide)-teal-deep(?:er)?\b/g,
    '`teal-deep` is a fill, not an ink — use the `teal-ink` token',
  ],
  // The mirror of the rule above. `bg-tomato-ink` was the spelling on every
  // destructive button, and it is the one that breaks: an ink pale enough to
  // read on a dark page cannot carry a white label.
  [
    /\b(?:hover:|focus:|focus-visible:|group-hover:|active:)*bg-tomato-ink\b/g,
    '`tomato-ink` is an ink, not a fill — use the `tomato-deep` token',
  ],
];
const cssVarPattern = new RegExp(
  String.raw`--color-(?:${GHOST_TOKENS.join('|')}|ink)(?:-[a-z]+)?\b`,
  'g',
);

/**
 * The literal values behind deleted tokens, banned by hex as well as by name.
 *
 * Matching only utility names and `--color-*` vars left one door open: code
 * that needs a concrete colour rather than a class — Recharts props are the
 * common case — declares `const DARK_GREEN = '#5a8a1a'` and walks straight
 * past the guard. That is exactly how the swept-away `dark-green` came back
 * onto the analytics page as a chart fill. A banned value is banned in every
 * spelling, so the hex is checked too.
 */
const BANNED_HEXES = new Map([
  ['#5a8a1a', 'dark-green'],
  // The active-nav wash. It was a bare arbitrary value in both shells and the
  // meal-slot cards, plus a raw hex inside an inline boxShadow — one colour
  // with no name, which is how it drifted into an inline style. Now `teal-tint`.
  ['#e2f1f0', 'teal-tint'],
  // Caution amber, which had four spellings across the app before it was
  // tokenised. `#9a6400` was a fifth, invented for one admin badge.
  ['#e9a020', 'amber'],
  ['#fdf2dc', 'amber-tint'],
  ['#8a5a12', 'amber-ink'],
  ['#9a6400', 'amber-ink'],
  // Retired with the "fresh greens" palette. These are listed for the same
  // reason `dark-green` is: the swap to "terrace" touched a dozen files that
  // needed concrete values rather than classes (Recharts series, an SVG map
  // pin, the dot-grid backgrounds, `themeColor`), and a stray survivor would
  // not fail anything — it would just quietly render one mint element in a
  // cream app. Deliberately excludes the old `charcoal`/`slate` neutrals:
  // #1a1a1a and #4a4a4a are values generic enough to appear innocently.
  ['#8cc63f', 'the retired lime brand — use `teal`'],
  ['#d4e8b0', 'the retired mint — use `sand`'],
  ['#f7fbf0', 'the retired cream-green canvas — use `canvas`'],
  ['#4f7c17', 'the retired olive — use `teal-deep`'],
  ['#3f6212', 'the retired olive hover — use `teal-deeper`'],
  ['#6b8f3a', 'the retired mid-olive chart ramp step'],
  ['#7d8a6b', 'the retired control boundary — use `sand-edge`'],
  ['#e84c3d', 'the retired tomato — use `tomato`'],
  ['#b32d1f', 'the retired tomato ink — use `tomato-ink`'],
  ['#f0f9e0', 'the retired nav wash — use `teal-tint`'],
  ['#f5a623', 'the retired amber — use `amber`'],
  ['#fef6e6', 'the retired amber tint — use `amber-tint`'],
  // The live "terrace" palette. These were not banned while the app had one
  // theme — an inlined `#ebe0cd` and the `sand` token were the same pixel, so
  // the duplication cost nothing. With two themes they are no longer the same
  // pixel: a literal cannot invert, so every one of these spellings is a patch
  // of light mode stranded in a dark page. The dot-grid backgrounds on the
  // landing and auth pages, the hero underline, the map pin and eight Recharts
  // constants all reached the theme this way.
  ['#fbf7ee', 'canvas'],
  ['#ebe0cd', 'sand'],
  ['#8d8271', 'sand-edge'],
  ['#178a8a', 'teal'],
  ['#0d6363', 'teal-deep (fill) or teal-ink (text/border)'],
  ['#094a4a', 'teal-deeper'],
  ['#2e9c9c', 'teal-mid'],
  ['#c8402f', 'tomato'],
  ['#a02c1d', 'tomato-ink'],
  ['#1f1a14', 'charcoal (ink) or onyx (a permanently dark surface)'],
  ['#5c5145', 'slate'],
  ['#776b5c', 'slate-muted'],
]);
const hexPattern = new RegExp(String.raw`${[...BANNED_HEXES.keys()].join('|')}`, 'gi');

/**
 * Focus rings that cannot be seen.
 *
 * `lib/focus-ring.ts` exists because the brand `teal` is 4.17:1 on white and
 * a ring drawn in it is under the AA floor. That reasoning did not stop five
 * surfaces from hardcoding `ring-teal/40` anyway — 1.68:1 composited, well
 * under the 3:1 focus floor — including both navigation shells,
 * where a keyboard user loses their place on every route. A rule nobody can
 * see is a rule that comes back, so it is a build failure now.
 *
 * Matches `ring-teal`, `ring-teal/40`, `focus-visible:ring-teal/40` and the
 * `focus:` variants, but not `ring-teal-ink` / `ring-teal-deep(er)` / the
 * ramp's `ring-teal-mid`.
 *
 * `-ink` is the one that matters now: focus rings were swept from
 * `ring-teal-deep` to `ring-teal-ink` when the fill and ink roles split for
 * dark mode, and an exclusion list that only knew about `-deep` turned the
 * *correct* token into six build failures.
 */
const weakRingPattern =
  /\b(?:focus-visible:|focus:|group-focus-visible:)?ring-teal(?!-(?:deep|ink|mid))(?:\/\d+)?\b/g;

/**
 * Blank out comments, preserving line numbering.
 *
 * The docblock explaining why a token is banned has to be able to name it —
 * otherwise the guard forbids its own rationale. Only real code is scanned.
 * `//` is ignored when preceded by `:` or `/` so protocol-relative URLs and
 * `https://` links inside code are not mistaken for the start of a comment.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:/])\/\/[^\n]*/g, (_m, lead) => lead);
}

/**
 * Escape hatch for the handful of places that genuinely cannot use a token.
 *
 * `viewport.themeColor` is the motivating case: it is serialised into a
 * `<meta>` tag by Next, so a `var()` in it reaches the browser as the literal
 * string "var(--canvas)" and the mobile chrome falls back to default grey. A
 * blanket ban with no exit turns into a ban people work around by renaming the
 * constant, so the exit is explicit and greppable instead.
 *
 * Checked against the raw line rather than the comment-stripped one, since the
 * marker lives in a comment.
 */
const ALLOW_MARKER = 'token-guard-allow';

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(entry)) yield full;
  }
}

const findings = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(WEB_ROOT, dir))) {
    const source = readFileSync(file, 'utf8');
    const rawLines = source.split('\n');
    const lines = stripComments(source).split('\n');
    lines.forEach((line, i) => {
      if (rawLines[i]?.includes(ALLOW_MARKER)) return;
      for (const [pattern, advice] of MISUSED_UTILITIES) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          findings.push({
            file: relative(WEB_ROOT, file).replace(/\\/g, '/'),
            line: i + 1,
            token: `${match[0]} — ${advice}`,
          });
        }
      }
      for (const pattern of [utilityPattern, cssVarPattern]) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          findings.push({
            file: relative(WEB_ROOT, file).replace(/\\/g, '/'),
            line: i + 1,
            token: match[0],
          });
        }
      }
      hexPattern.lastIndex = 0;
      // A custom-property declaration is where these values are *supposed* to
      // live — `--color-amber: #f5a623` is the token, not a bypass of it. Only
      // the definition line is exempt; every use site must name the token.
      const isTokenDeclaration = /^\s*--[\w-]+\s*:/.test(line);
      for (const match of isTokenDeclaration ? [] : line.matchAll(hexPattern)) {
        const name = BANNED_HEXES.get(match[0].toLowerCase());
        findings.push({
          file: relative(WEB_ROOT, file).replace(/\\/g, '/'),
          line: i + 1,
          token: `${match[0]} — use the \`${name}\` token`,
        });
      }
      weakRingPattern.lastIndex = 0;
      for (const match of line.matchAll(weakRingPattern)) {
        findings.push({
          file: relative(WEB_ROOT, file).replace(/\\/g, '/'),
          line: i + 1,
          token: `${match[0]} — a focus ring under 3:1; import FOCUS_RING from @/lib/focus-ring`,
        });
      }
    });
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Contrast floors, asserted rather than commented.

   globals.css documents a ratio next to almost every value. Those comments were
   accurate when written and have no way to stay accurate: nudging one hex to
   taste — which is exactly what happens to a palette — silently invalidates
   every number written about it. Now there are two palettes, so a nudge can
   also pass in the theme the author has on screen and fail in the other one.

   This reads the values back out of globals.css and checks the pairs that
   actually appear on screen, in both themes. It is the same reasoning as the
   ghost-token scan above: a rule nobody can see is a rule that comes back.
   ────────────────────────────────────────────────────────────────────────── */

const AA_TEXT = 4.5;
/** WCAG 1.4.11: the floor for control boundaries and focus indicators. */
const NON_TEXT = 3.0;

/** [ink, background, floor] — token names as declared in globals.css. */
const CONTRAST_PAIRS = [
  ['charcoal', 'canvas', AA_TEXT],
  ['charcoal', 'surface', AA_TEXT],
  ['slate', 'canvas', AA_TEXT],
  ['slate', 'surface', AA_TEXT],
  ['slate-muted', 'canvas', AA_TEXT],
  ['slate-muted', 'surface', AA_TEXT],
  ['teal-ink', 'canvas', AA_TEXT],
  ['teal-ink', 'surface', AA_TEXT],
  ['teal-ink', 'teal-tint', AA_TEXT],
  ['tomato-ink', 'surface', AA_TEXT],
  ['amber-ink', 'amber-tint', AA_TEXT],
  // Fills that carry a hardcoded white label.
  ['white', 'teal-deep', AA_TEXT],
  ['white', 'teal-deeper', AA_TEXT],
  ['white', 'tomato', AA_TEXT],
  ['white', 'tomato-deep', AA_TEXT],
  ['white', 'onyx', AA_TEXT],
  // Boundaries and indicators.
  ['sand-edge', 'surface', NON_TEXT],
  ['sand-edge', 'canvas', NON_TEXT],
  ['teal-ink', 'canvas', NON_TEXT],
  ['teal', 'surface', NON_TEXT],
  ['tomato', 'surface', NON_TEXT],
];

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Pull `--name: #hex;` declarations out of one CSS rule block. */
function readPalette(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  if (open === -1 || close === -1) return null;
  const palette = { white: '#ffffff' };
  for (const [, name, hex] of css
    .slice(open, close)
    .matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    palette[name] = hex.toLowerCase();
  }
  return palette;
}

const globalsPath = join(WEB_ROOT, 'app', 'globals.css');
const globalsCss = stripComments(readFileSync(globalsPath, 'utf8'));
const THEMES = [
  ['light', readPalette(globalsCss, ':root')],
  ['dark', readPalette(globalsCss, '.on-onyx')],
];

for (const [themeName, palette] of THEMES) {
  if (!palette) {
    findings.push({
      file: 'app/globals.css',
      line: 1,
      token: `could not read the ${themeName} palette — has the selector been renamed?`,
    });
    continue;
  }
  for (const [ink, bg, floor] of CONTRAST_PAIRS) {
    const inkHex = palette[ink];
    const bgHex = palette[bg];
    if (!inkHex || !bgHex) {
      findings.push({
        file: 'app/globals.css',
        line: 1,
        token: `${themeName}: no value for \`${!inkHex ? ink : bg}\` — a contrast pair names a token that no longer exists`,
      });
      continue;
    }
    const ratio = contrast(inkHex, bgHex);
    if (ratio < floor) {
      findings.push({
        file: 'app/globals.css',
        line: 1,
        token: `${themeName}: \`${ink}\` on \`${bg}\` is ${ratio.toFixed(2)}:1, under the ${floor}:1 floor`,
      });
    }
  }
}

if (findings.length > 0) {
  console.error(
    `\n${findings.length} colour problem${findings.length === 1 ? '' : 's'} — an undefined utility renders as nothing, an untokenised value drifts, a weak ring cannot be seen:\n`,
  );
  for (const { file, line, token } of findings) {
    console.error(`  ${file}:${line}  ${token}`);
  }
  console.error('\nUse a token defined in app/globals.css @theme.\n');
  exit(1);
}

console.log(`Design tokens OK — no ghost colours or weak focus rings in ${SCAN_DIRS.join(', ')}.`);
