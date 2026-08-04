'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { TileLayer } from 'react-leaflet';

/**
 * The basemap, in the theme the rest of the page is in.
 *
 * Until this existed the app had one map component and it hardcoded CARTO's
 * light Voyager tiles. That was invisible while there was one theme; since the
 * dark theme landed it renders as a floodlit rectangle in the middle of a
 * near-black page — the single brightest thing on screen, and on the profile
 * and onboarding screens it is most of the viewport.
 *
 * Voyager and Dark Matter are the same cartography at the same zoom levels, so
 * switching between them moves no label and redraws no road.
 */
const BASEMAPS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const;

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Whether the page is currently dark, without a frame of the wrong answer.
 *
 * `useTheme()` returns `undefined` for `resolvedTheme` on the very first render
 * — it cannot know the OS preference until it has run — and defaulting that to
 * light would flash white tiles into a dark page every time a map mounts.
 * next-themes' pre-hydration script has already written the class onto <html>
 * by then, so reading it directly in the state initializer gets the real answer
 * one render earlier. After that `resolvedTheme` takes over and the toggle
 * works normally.
 */
export function useIsDarkTheme(): boolean {
  const { resolvedTheme } = useTheme();
  const [initial] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  return resolvedTheme ? resolvedTheme === 'dark' : initial;
}

export function ThemedTileLayer() {
  const isDark = useIsDarkTheme();

  return (
    <TileLayer
      // react-leaflet diffs this prop and calls Leaflet's `setUrl`, which keeps
      // the old tiles on screen until the new ones decode. Remounting the layer
      // on theme change (via `key`) would blank the map instead.
      url={isDark ? BASEMAPS.dark : BASEMAPS.light}
      attribution={ATTRIBUTION}
      subdomains="abcd"
      maxZoom={20}
    />
  );
}
