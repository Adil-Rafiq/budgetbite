'use client';

import { useState } from 'react';
import { showToast } from '@/lib/toast';

interface UseDetectLocationOptions {
  onSuccess: (latitude: number, longitude: number) => void;
}

export const useDetectLocation = ({ onSuccess }: UseDetectLocationOptions) => {
  const [isDetecting, setIsDetecting] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) {
      showToast.error({ title: 'Geolocation not supported' });
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Truncate to 4 decimal places — ~11m precision, enough for restaurant proximity
        onSuccess(Number(coords.latitude.toFixed(4)), Number(coords.longitude.toFixed(4)));
        setIsDetecting(false);
        showToast.success({ title: 'Location detected!' });
      },
      (err) => {
        setIsDetecting(false);
        showToast.error({
          title: 'Failed to get location',
          description: err.message || 'Please check your browser permissions or try manually',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return { detect, isDetecting };
};
