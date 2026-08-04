import {
  ClipboardList,
  Database,
  Gauge,
  LayoutGrid,
  Map as MapIcon,
  ScrollText,
  Settings2,
  Sparkles,
  Store,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/**
 * The admin's route vocabulary, defined once.
 *
 * This list lived twice — the rail in `admin-shell.tsx` and a `sections` array
 * on the Overview — and had already drifted: the rail carried ten
 * destinations, the Overview card grid six. Recommendations, Data quality and
 * Config existed only in the rail, and the rail is `hidden` below `lg`, so on
 * a phone those three routes were reachable only by typing the URL.
 *
 * One destination, one name, one icon, one description, one place to add the
 * next one.
 */
export interface AdminNavItem {
  href: string;
  /** The only name this destination answers to, on every surface. */
  label: string;
  icon: LucideIcon;
  /** Shown on the Overview. Says what the operator does here, not what it is. */
  description: string;
}

export interface AdminNavGroup {
  /** Null for the ungrouped lead item. */
  label: string | null;
  items: AdminNavItem[];
}

/**
 * Grouped, because ten flat items under one "manage" label is past the point
 * where a list is scannable — the operator was re-reading all ten to find one.
 * The groups are ordered by how often the single operator actually needs them:
 * data trust is the job, so it sits directly under the catalogue it judges,
 * and the system log and config sink to the bottom where they are consulted
 * rather than worked.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: null,
    items: [
      {
        href: '/admin',
        label: 'Overview',
        icon: LayoutGrid,
        description: 'Whether the catalogue is currently trustworthy.',
      },
    ],
  },
  {
    label: 'catalogue',
    items: [
      {
        href: '/admin/restaurants',
        label: 'Restaurants',
        icon: Store,
        description: 'Browse, edit, and remove restaurants and their menu items.',
      },
      {
        href: '/admin/map',
        label: 'Coverage',
        icon: MapIcon,
        description:
          'Where the catalogue is, where the users are, and which coordinates are wrong.',
      },
      {
        href: '/admin/meal-types',
        label: 'Meal types',
        icon: UtensilsCrossed,
        description: 'Manage the meal types users can plan around.',
      },
    ],
  },
  {
    label: 'data trust',
    items: [
      {
        href: '/admin/ingestion',
        label: 'Ingestion',
        icon: Database,
        description: 'Scraper run history, volume, and why a run failed.',
      },
      {
        href: '/admin/data-quality',
        label: 'Data quality',
        icon: Gauge,
        description: 'Records that would mislead a meal plan, and how to fix them.',
      },
      {
        href: '/admin/recommendations',
        label: 'Recommendations',
        icon: Sparkles,
        description: 'Restaurants users suggested, awaiting review.',
      },
    ],
  },
  {
    label: 'people',
    items: [
      {
        href: '/admin/users',
        label: 'Users',
        icon: UsersRound,
        description: 'Manage accounts and admin access.',
      },
      {
        href: '/admin/plans',
        label: 'Plans',
        icon: ClipboardList,
        description: 'Inspect AI-generated budget plans.',
      },
    ],
  },
  {
    label: 'system',
    items: [
      {
        href: '/admin/audit',
        label: 'Audit log',
        icon: ScrollText,
        description: 'Every admin and scraper mutation.',
      },
      {
        href: '/admin/config',
        label: 'Config',
        icon: Settings2,
        description: 'The deployment values that shape planning.',
      },
    ],
  },
];

/** Flat view, for surfaces that need every destination without the grouping. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

/**
 * `/admin` is an exact match; everything else owns its subtree, so
 * `/admin/restaurants/:id` still lights up Restaurants.
 */
export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

/** Human name for the current admin route, for the mobile header title. */
export function adminSectionLabel(pathname: string): string {
  const match = ADMIN_NAV_ITEMS.filter((i) => isAdminNavItemActive(pathname, i.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.label ?? 'Admin';
}
