'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { LatLng } from '@/services/routing/types';
import { isOffRoute } from '@/utils/geo';

export const DEFAULT_DEMO_POSITION: LatLng = [28.6304, 77.2177];

interface UseGeolocationOptions {
  enableRealGps?: boolean;
  routePolyline?: LatLng[];
  offRouteThresholdMeters?: number;
  simulatedCoordinates?: LatLng;
  onOffRouteDetected?: (pos: LatLng) => void;
}

/**
 * Position source for the map.
 * - Real device GPS via navigator.geolocation.watchPosition when enabled.
 * - Otherwise a simulated walker position is derived (so the demo works with no GPS hardware).
 */
export function useGeolocation({
  enableRealGps = false,
  routePolyline = [],
  offRouteThresholdMeters = 35,
  simulatedCoordinates,
  onOffRouteDetected,
}: UseGeolocationOptions = {}) {
  const [gpsPosition, setGpsPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  // Latest values kept in refs so watchPosition is never re-subscribed on every render
  const routePolylineRef = useRef<LatLng[]>(routePolyline);
  const offRouteCallbackRef = useRef<((pos: LatLng) => void) | undefined>(undefined);

  const geolocationSupported =
    typeof window === 'undefined' ? true : typeof navigator.geolocation !== 'undefined';

  useEffect(() => {
    routePolylineRef.current = routePolyline;
    offRouteCallbackRef.current = onOffRouteDetected;
  });

  // Real GPS watchPosition
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!enableRealGps) return;
    if (!geolocationSupported) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setGpsPosition(newCoords);
        setAccuracy(pos.coords.accuracy);

        const polyline = routePolylineRef.current;
        if (polyline.length > 1) {
          const off = isOffRoute(newCoords, polyline, offRouteThresholdMeters);
          if (off && offRouteCallbackRef.current) {
            offRouteCallbackRef.current(newCoords);
          }
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enableRealGps, offRouteThresholdMeters, geolocationSupported]);

  // Fall back to the simulated walker whenever live GPS is not in use
  const position: LatLng = enableRealGps
    ? gpsPosition || DEFAULT_DEMO_POSITION
    : simulatedCoordinates || DEFAULT_DEMO_POSITION;

  const hasDeviated = useMemo(() => {
    if (routePolyline.length < 2) return false;
    return isOffRoute(position, routePolyline, offRouteThresholdMeters);
  }, [position, routePolyline, offRouteThresholdMeters]);

  return {
    position,
    accuracy,
    error: enableRealGps
      ? geolocationSupported
        ? error
        : 'Geolocation is not supported by this browser.'
      : null,
    isTracking: enableRealGps && geolocationSupported && !error,
    hasDeviated,
  };
}