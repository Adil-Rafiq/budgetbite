/**
 * Display-name helpers.
 *
 * These lived twice — once in `app-header.tsx` and once in `app/profile/page.tsx`
 * — with different signatures, so the avatar in the header and the avatar on the
 * profile page could disagree about the same person. One concept, one
 * implementation.
 */

/**
 * Split a stored full name into the two fields the profile form edits.
 * Everything after the first whitespace run is the last name, so
 * "Muhammad Abdul Rehman Khan" round-trips through the form unchanged.
 */
export function splitName(fullName: string | undefined | null): {
  firstName: string;
  lastName: string;
} {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * Up to two initials for an avatar. Falls back to a bullet only when there is
 * genuinely nothing to show — a one-word name yields one letter, not a bullet.
 */
export function initials(fullName: string | undefined | null): string {
  const { firstName, lastName } = splitName(fullName);
  const a = firstName.charAt(0).toUpperCase();
  const b = lastName.charAt(0).toUpperCase();
  return `${a}${b}` || '•';
}
