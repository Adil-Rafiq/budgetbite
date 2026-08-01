'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Guards in-progress edits against every way they were being lost silently:
 * closing or reloading the tab, clicking a link in the app shell, pressing
 * browser Back, and signing out from the header menu.
 *
 * The store is module-scoped rather than React context because the guard has
 * two consumers that do not share a subtree: the page that owns the forms, and
 * `AppHeader`, which sits above every route in `AppShell`. The header's Sign out
 * is a `DropdownMenuItem`, not an anchor, so the click interceptor below could
 * never see it — it has to ask.
 */

let unsavedCount = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** True when any mounted surface has uncommitted edits. */
export function useHasUnsavedChanges(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => unsavedCount > 0,
    () => false, // server: nothing is ever dirty during SSR
  );
}

/**
 * Guards the surface that owns the edits. Returns the pending destination so the
 * caller can render its own confirmation, plus `runGuarded` for programmatic
 * exits (sign-out) that are not navigations at all.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
  /** Whether our sacrificial history entry is still the current one. */
  const guardArmed = useRef(false);

  // Publish to the module store so `AppHeader` can see this page's state.
  useEffect(() => {
    if (!isDirty) return;
    unsavedCount += 1;
    emit();
    return () => {
      unsavedCount -= 1;
      emit();
    };
  }, [isDirty]);

  // Tab close / reload / navigation out of the app.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required by Chrome; the string itself is never displayed.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // Browser Back / forward. `beforeunload` does not fire on a client-side
  // history change, and the App Router exposes no route-change guard — so the
  // only way to intervene is to push a sacrificial entry and re-push it each
  // time the user pops off it, turning Back into a prompt instead of an exit.
  // On a phone the back gesture is the primary way people leave a page, so this
  // was the single most likely way to lose a session's edits.
  useEffect(() => {
    if (!isDirty) return;

    const GUARD = { __budgetbiteUnsavedGuard: true };
    window.history.pushState(GUARD, '');
    guardArmed.current = true;

    const onPopState = () => {
      // Re-arm immediately so the user stays put, then ask.
      window.history.pushState(GUARD, '');
      guardArmed.current = true;
      setPendingHref((prev) => prev ?? 'back');
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // Retire the sacrificial entry so a clean page does not leave the user
      // needing two Backs to get out. `guardArmed` is the interlock: when the
      // user has *chosen* to leave, `confirmLeave` already stepped past this
      // entry, and popping again here would overshoot by one page.
      if (
        guardArmed.current &&
        (window.history.state as typeof GUARD | null)?.__budgetbiteUnsavedGuard
      ) {
        guardArmed.current = false;
        window.history.back();
      }
    };
  }, [isDirty]);

  // In-app link clicks.
  useEffect(() => {
    if (!isDirty) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isDirty]);

  /**
   * Wrap an exit that is not a navigation — signing out, for instance. Runs the
   * action straight away when nothing is dirty.
   */
  const runGuarded = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      pendingAction.current = action;
      setPendingHref('action');
    },
    [isDirty],
  );

  const confirmLeave = useCallback(() => {
    const href = pendingHref;
    const action = pendingAction.current;
    pendingAction.current = null;
    setPendingHref(null);

    if (action) {
      action();
      return;
    }
    if (href === 'back') {
      // Step past the guard entry and the real one behind it. Disarm first so
      // the effect cleanup does not pop a second time on the way out.
      guardArmed.current = false;
      window.history.go(-2);
      return;
    }
    if (href) router.push(href);
  }, [pendingHref, router]);

  const cancelLeave = useCallback(() => {
    pendingAction.current = null;
    setPendingHref(null);
  }, []);

  return { pendingHref, confirmLeave, cancelLeave, runGuarded };
}
