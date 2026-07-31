/**
 * Make a scraped restaurant name fit to show a person.
 *
 * The scraper takes names from Foodpanda URLs, so a meaningful share of the
 * catalogue arrives as slugs with tracking params still attached:
 * `jalal-sons-dha-iii?eo=large_order_swimlane`. `buildFoodpandaUrl` already
 * strips the query when constructing the outbound link, but the display path
 * never did, so the largest text on a restaurant card was frequently a URL
 * fragment — on the surface whose job is to help someone choose a restaurant.
 *
 * This is display-only and deliberately conservative: it never touches a name
 * that already reads like one (any whitespace means a human or the source
 * wrote it), so real names keep their own capitalisation — "KFC" stays "KFC",
 * "Cafe Zouk" stays "Cafe Zouk". Fixing the data belongs in the scraper; this
 * stops the damage from reaching the page in the meantime.
 */

/** Words that stay lowercase inside a title-cased name. */
const MINOR_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'de', 'for', 'in', 'of', 'on', 'the']);

export function humanizeName(raw: string): string {
  const name = raw.trim();
  if (!name) return name;

  // Already human-written — leave it exactly as the source has it.
  if (/\s/.test(name)) return name.split(/[?#]/)[0]!.trim() || name;

  const slug = name.split(/[?#]/)[0]!;
  if (!slug.includes('-')) return name;

  return slug
    .split('-')
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
