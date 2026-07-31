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
    });
  }
}

if (findings.length > 0) {
  console.error(
    `\nUndefined colour token${findings.length === 1 ? '' : 's'} referenced — these render as nothing:\n`,
  );
  for (const { file, line, token } of findings) {
    console.error(`  ${file}:${line}  ${token}`);
  }
  console.error('\nUse a token defined in app/globals.css @theme.\n');
  exit(1);
}

console.log(`Design tokens OK — no ghost colour utilities in ${SCAN_DIRS.join(', ')}.`);
