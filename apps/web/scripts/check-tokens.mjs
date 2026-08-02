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
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];
const EXTENSIONS = /\.(tsx?|css)$/;

/**
 * Colour families the theme does not define.
 *
 * `lumen`/`pulse`/`soft`/`vast`/`fathom` are leftovers from a previous palette.
 * `dark-green` is different: it was real, and it was the app's link colour and
 * button hover in 193 places — but at 4.13:1 it failed AA as 12-13px text and
 * again as a fill under white labels. It was swept to `green-deep` and deleted
 * from @theme, so it is listed here to make the sweep stick: reintroducing it
 * is now a build failure rather than a silent regression to sub-AA text.
 */
const GHOST_TOKENS = ['lumen', 'pulse', 'soft', 'vast', 'fathom', 'dark-green'];

const utilityPattern = new RegExp(
  String.raw`\b(?:text|bg|border|ring|fill|stroke|from|to|via|shadow|outline|divide|accent|caret)-(?:${GHOST_TOKENS.join('|')})(?:-[a-z]+)?\b`,
  'g',
);
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
  // with no name, which is how it drifted into an inline style. Now `green-tint`.
  ['#e2f1f0', 'green-tint'],
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
  ['#8cc63f', 'the retired lime brand — use `green`'],
  ['#d4e8b0', 'the retired mint — use `sage`'],
  ['#f7fbf0', 'the retired cream-green canvas — use `canvas`'],
  ['#4f7c17', 'the retired olive — use `green-deep`'],
  ['#3f6212', 'the retired olive hover — use `green-deeper`'],
  ['#6b8f3a', 'the retired mid-olive chart ramp step'],
  ['#7d8a6b', 'the retired control boundary — use `sage-edge`'],
  ['#e84c3d', 'the retired tomato — use `tomato`'],
  ['#b32d1f', 'the retired tomato ink — use `tomato-ink`'],
  ['#f0f9e0', 'the retired nav wash — use `green-tint`'],
  ['#f5a623', 'the retired amber — use `amber`'],
  ['#fef6e6', 'the retired amber tint — use `amber-tint`'],
]);
const hexPattern = new RegExp(String.raw`${[...BANNED_HEXES.keys()].join('|')}`, 'gi');

/**
 * Focus rings that cannot be seen.
 *
 * `lib/focus-ring.ts` exists because the brand `green` is 2.05:1 on white and
 * a ring drawn in it is decoration. That reasoning did not stop five surfaces
 * from hardcoding `ring-green/40` anyway — 1.32:1 composited, weaker than the
 * value the module was written to replace — including both navigation shells,
 * where a keyboard user loses their place on every route. A rule nobody can
 * see is a rule that comes back, so it is a build failure now.
 *
 * Matches `ring-green`, `ring-green/40`, `focus-visible:ring-green/40` and the
 * `focus:` variants, but not `ring-green-deep` / `ring-green-deeper`.
 */
const weakRingPattern =
  /\b(?:focus-visible:|focus:|group-focus-visible:)?ring-green(?!-deep)(?:\/\d+)?\b/g;

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
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
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
