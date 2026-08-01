import { AppShell } from '@/components/app-shell';

/**
 * One shell for every signed-in surface.
 *
 * `dashboard`, `plans`, `restaurants`, `analytics` and `profile` each used to
 * render their own `<AppShell>` from their own sibling layout. Sibling layouts
 * are different components, so React tore the whole shell down and rebuilt it
 * on every route change: the sidebar and header remounted, and the budget bar's
 * 0.9s fill replayed from 0% on every click and every tab tap. The app's money
 * indicator visibly recalculating on every navigation is the last thing a
 * budget tracker should imply.
 *
 * A route group keeps the URLs exactly as they were — `/(app)/plans` is still
 * `/plans` — while giving all five a single common parent that persists.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
