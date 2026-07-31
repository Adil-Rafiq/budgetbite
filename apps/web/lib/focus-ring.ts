/**
 * Keyboard focus treatment, defined once.
 *
 * `green-deep` rather than the brand `green`: at #8cc63f a focus ring is 2.05:1
 * against white and barely visible, which is the same reason the app's primary
 * fills moved to `green-deep`. The ring must be findable by someone tabbing
 * through a multi-step form, not merely present in the markup. At 4.97:1 it
 * clears the 3:1 floor WCAG 1.4.11 sets for focus indicators with room spare.
 *
 * Pick the variant whose offset matches the surface the control sits on, so the
 * gap between element and ring reads as a clean halo instead of a seam.
 */

/** For controls on white cards. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-deep focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/** For controls on the page/canvas background (headers, sticky footers). */
export const FOCUS_RING_ON_CANVAS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-deep focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

/** For controls sitting directly on a filled green surface. */
export const FOCUS_RING_ON_GREEN =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-deep';
