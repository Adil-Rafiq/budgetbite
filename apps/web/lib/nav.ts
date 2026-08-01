import {
  BarChart3,
  CalendarDays,
  LayoutGrid,
  ShieldCheck,
  Store,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * The app's route vocabulary, defined once.
 *
 * This list lived three times — `app-sidebar.tsx`, `mobile-nav.tsx`, and the
 * header's breadcrumb map — hand-synced, and it had already drifted: the
 * sidebar appended an Admin item for admins and the mobile tab bar did not, so
 * below `lg` an admin had no route to `/admin` at all. The header then called
 * `/plans` "Budget plans" while the rail called it "Plans", and `/analytics`
 * answered to three different names depending on which surface you asked.
 *
 * One destination, one name, one icon, one place to add the next one.
 */
export interface NavItem {
  href: string;
  /** The only name this destination answers to, on every surface. */
  label: string;
  icon: LucideIcon;
}

/**
 * The five daily destinations, in both the desktop rail and the phone tab bar.
 *
 * Five is also the ceiling. A sixth tab at 360px leaves ~52px of label width
 * and truncates "Restaurants" to "Restaura…" for every user, so anything that
 * is not part of the daily loop belongs in the account menu instead.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/restaurants', label: 'Restaurants', icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserIcon },
];

/** Role-gated destinations, shown in the header account menu at every width. */
export const ADMIN_NAV_ITEM: NavItem = {
  href: '/admin',
  label: 'Admin',
  icon: ShieldCheck,
};

/**
 * Whether this user gets the admin entry.
 *
 * It lives in the account menu rather than the rail because the rail's twin —
 * the phone tab bar — cannot afford a sixth slot, and an item that exists on
 * one device and not the other is how an admin ended up with no route to
 * `/admin` at all below `lg`. The account menu is identical on both.
 */
export function canSeeAdmin(role: string | undefined): boolean {
  return role === 'admin';
}

/**
 * Whether `href` is the section the user is currently in.
 *
 * The `+ '/'` guard matters: without it `/plan` would match `/plans`, and with
 * a bare `startsWith` every route would light up `/` if one were ever added.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

/**
 * Human name for a URL's first segment, for breadcrumbs and titles.
 *
 * Derived from `NAV_ITEMS` so a renamed destination cannot be renamed in the
 * rail and left stale in the header. Segments with no nav entry (onboarding)
 * are listed separately rather than title-cased blindly.
 */
const EXTRA_SECTION_LABELS: Record<string, string> = {
  onboarding: 'Setup',
};

export function sectionLabel(segment: string): string | undefined {
  const item = [...NAV_ITEMS, ADMIN_NAV_ITEM].find((i) => i.href === `/${segment}`);
  return item?.label ?? EXTRA_SECTION_LABELS[segment];
}
