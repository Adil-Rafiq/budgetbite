'use client';

import { useState } from 'react';
import { Store } from 'lucide-react';

import { cn } from '@/lib/utils';

interface RestaurantImageProps {
  src: string | null | undefined;
  /** Shape and size, applied to the photo and its stand-in alike. */
  className?: string;
  /** Icon size inside the stand-in. */
  iconClassName?: string;
  /**
   * What to draw when there is no usable photo.
   *
   * `placeholder` holds the space — a card thumbnail that vanished for the
   * restaurants without artwork would leave a ragged grid. `nothing` removes
   * the element entirely, which is right for the detail-page banner: an empty
   * grey band the height of a photo is worse than no band at all.
   */
  fallback?: 'placeholder' | 'nothing';
}

/**
 * A restaurant's own photo, with a fallback that survives a dead URL.
 *
 * The URLs come from the scraper and point at Foodpanda's CDN, which expires
 * them without warning — so "no photo" and "a photo that 404s" have to render
 * the same, or the browser draws its broken-image glyph. Same reasoning as the
 * menu thumbnails on the restaurant detail page.
 *
 * The photo is decorative: every caller draws the restaurant's name next to it,
 * so an alt text would only make a screen reader say the name twice.
 */
export function RestaurantImage({
  src,
  className,
  iconClassName,
  fallback = 'placeholder',
}: RestaurantImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (fallback === 'nothing') return null;
    return (
      <div aria-hidden className={cn('flex items-center justify-center bg-canvas', className)}>
        <Store className={cn('text-slate', iconClassName)} />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
