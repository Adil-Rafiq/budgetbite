'use client';

export type ApiWakeupCallback = (isWakingUp: boolean) => void;

let apiWakeupCallback: ApiWakeupCallback | null = null;
let hasWarmedUp = false;
let wakeupInProgress = false;

export const registerApiWakeupCallback = (callback: ApiWakeupCallback) => {
  apiWakeupCallback = callback;
};

export const unregisterApiWakeupCallback = () => {
  apiWakeupCallback = null;
};

const notifyWakeupState = (isWakingUp: boolean) => {
  apiWakeupCallback?.(isWakingUp);
};

export const markApiWakeupStart = () => {
  if (!hasWarmedUp && !wakeupInProgress) {
    wakeupInProgress = true;
    notifyWakeupState(true);
  }
};

export const markApiWakeupFinish = () => {
  if (wakeupInProgress) {
    wakeupInProgress = false;
    hasWarmedUp = true;
    notifyWakeupState(false);
  }
};

export const markApiWakeupError = () => {
  if (wakeupInProgress) {
    wakeupInProgress = false;
    notifyWakeupState(false);
  }
};

export const resetApiWakeup = () => {
  wakeupInProgress = false;
  hasWarmedUp = false;
  apiWakeupCallback = null;
};
