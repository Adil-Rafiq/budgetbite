'use client';

export type ApiWakeupCallback = (isWakingUp: boolean) => void;

// Render's free tier spins the API down after ~15 min of inactivity. If we
// reached the API more recently than this, it's still warm — skip the banner.
const WARM_WINDOW_MS = 14 * 60 * 1000;
// A warm request comes back in well under a second; only a cold start hangs.
// Wait this long before showing the banner so warm requests never flash it.
const SLOW_REQUEST_MS = 2_000;
// Persisted across reloads (and tabs) so a fresh page load on an already-warm
// server doesn't re-show the banner — the original bug.
const STORAGE_KEY = 'budgetbite:api-last-contact';

let apiWakeupCallback: ApiWakeupCallback | null = null;
let inFlight = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;
let bannerShown = false;

const readLastContact = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
};

const recordContact = () => {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // storage unavailable (SSR / private mode) — degrade silently
  }
};

// The server is considered warm if we successfully reached it within the idle
// window. Computed per-request so a long gap correctly re-arms the banner.
const isWarm = (): boolean => Date.now() - readLastContact() < WARM_WINDOW_MS;

export const registerApiWakeupCallback = (callback: ApiWakeupCallback) => {
  apiWakeupCallback = callback;
};

export const unregisterApiWakeupCallback = () => {
  apiWakeupCallback = null;
};

const showBanner = () => {
  if (!bannerShown) {
    bannerShown = true;
    apiWakeupCallback?.(true);
  }
};

const hideBanner = () => {
  if (bannerShown) {
    bannerShown = false;
    apiWakeupCallback?.(false);
  }
};

export const markApiWakeupStart = () => {
  inFlight += 1;
  // Already warm, or a timer/banner is already pending for this burst — nothing
  // to arm. This is what keeps the banner to the first (cold) request only.
  if (isWarm() || slowTimer || bannerShown) return;
  slowTimer = setTimeout(() => {
    slowTimer = null;
    showBanner();
  }, SLOW_REQUEST_MS);
};

const settle = () => {
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight > 0) return; // wait until the whole burst drains
  if (slowTimer) {
    clearTimeout(slowTimer);
    slowTimer = null;
  }
  hideBanner();
};

export const markApiWakeupFinish = () => {
  // A successful response proves the server is up — mark it warm.
  recordContact();
  settle();
};

export const markApiWakeupError = () => {
  // A failed request doesn't prove the server is warm, so don't record contact;
  // a follow-up request may still legitimately re-arm the banner.
  settle();
};

export const resetApiWakeup = () => {
  if (slowTimer) {
    clearTimeout(slowTimer);
    slowTimer = null;
  }
  inFlight = 0;
  bannerShown = false;
  apiWakeupCallback = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
