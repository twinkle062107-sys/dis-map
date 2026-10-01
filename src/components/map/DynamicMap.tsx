'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { RouteStep, SurfaceHazard } from '@/types/navigation';
import { LatLng } from '@/services/routing/types';

interface DynamicMapProps {
  steps: RouteStep[];
  currentStepIndex: number;
  userPosition: LatLng;
  routePolyline: LatLng[];
  alternativePolyline?: LatLng[];
  isOffRoute?: boolean;
  onSelectStep?: (index: number) => void;
  isHighContrast?: boolean;
  surfaceHazards?: SurfaceHazard[];
  showSurfaceLayer?: boolean;
  followUser?: boolean;
  recenterSignal?: number;
}

/**
 * Leaflet touches `window` at import time, so the map is loaded client-side only.
 * Everything above this component stays server/client agnostic.
 */
const DynamicInteractiveMap = dynamic(
  () => import('./InteractiveMap').then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-blue-800 font-bold text-xs p-4 animate-pulse">
        <div className="w-9 h-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-2" />
        <span>Loading the walking map…</span>
      </div>
    ),
  }
);

export const DynamicMap: React.FC<DynamicMapProps> = (props) => {
  return <DynamicInteractiveMap {...props} />;
};

export default DynamicMap;