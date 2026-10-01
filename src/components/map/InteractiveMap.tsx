'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteStep, SurfaceHazard } from '@/types/navigation';
import { LatLng } from '@/services/routing/types';
import { getRoutePathOptions, getAlternativePathOptions } from './routeStyle';

// Fix leaflet default icon missing assets in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** OpenStreetMap default tile template. Override with NEXT_PUBLIC_TILE_LAYER_URL. */
export const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const HAZARD_EMOJI: Record<string, string> = {
  stairs: '🪜',
  ramp: '♿',
  elevator: '🛗',
  uneven_cobblestones: '🪨',
  mud: '💧',
  smooth_paved: '🛣️',
  busy_curb_crossing: '🚦',
  pedestrian_crossing: '🚶',
};

interface InteractiveMapProps {
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
  /** Keep the map locked on the walker */
  followUser?: boolean;
  /** Bump to force one re-center on the walker */
  recenterSignal?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Frames the whole demo route on first paint so the map reads as a route overview. */
function FitRouteOverview({
  route,
  alternative,
  steps,
}: {
  route: LatLng[];
  alternative?: LatLng[];
  steps: RouteStep[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: LatLng[] = [
      ...route,
      ...(alternative || []),
      ...steps.map((s) => s.coordinates as LatLng),
    ].filter((p) => Array.isArray(p) && p.length === 2);

    if (points.length < 2) return;

    map.fitBounds(
      L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng))),
      { padding: [48, 48], animate: false }
    );
    // Only ever frame the route once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

/** Re-centers on the walker when following is enabled or a re-center is requested. */
function MapViewController({
  center,
  follow,
  recenterSignal,
}: {
  center: LatLng;
  follow: boolean;
  recenterSignal: number;
}) {
  const map = useMap();
  const lat = center?.[0];
  const lng = center?.[1];

  useEffect(() => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    if (!follow && recenterSignal === 0) return;
    map.setView([lat, lng], map.getZoom(), { animate: !prefersReducedMotion() });
  }, [map, lat, lng, follow, recenterSignal]);

  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  steps,
  currentStepIndex,
  userPosition,
  routePolyline,
  alternativePolyline,
  isOffRoute = false,
  onSelectStep,
  isHighContrast = false,
  surfaceHazards = [],
  showSurfaceLayer = false,
  followUser = false,
  recenterSignal = 0,
}) => {
  const tileUrl = process.env.NEXT_PUBLIC_TILE_LAYER_URL || DEFAULT_TILE_URL;

  const defaultCenter: LatLng =
    userPosition || steps[0]?.coordinates || [28.6304, 77.2177];

  // Custom DivIcon for landmarks: emoji + colored ring + written text label
  const createLandmarkDivIcon = (step: RouteStep, isCurrent: boolean, isVisited: boolean) =>
    L.divIcon({
      className: 'custom-landmark-pin',
      html: `
        <div class="custom-landmark-pin-inner" title="${step.landmarkName} — ${step.colorName}">
          <div class="landmark-pin-circle${isCurrent ? ' is-current' : ''}${
            isVisited ? ' is-visited' : ''
          }" style="background-color:${step.colorHex};">
            <span aria-hidden="true">${step.emoji || '📍'}</span>
          </div>
          <div class="landmark-pin-label${isCurrent ? ' is-current' : ''}">${step.landmarkName}</div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

  // Live walker marker
  const userGpsIcon = useMemo(
    () =>
      L.divIcon({
        className: 'user-gps-divicon',
        html: `<div class="user-gps-pulse" title="You are here"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  );

  // Surface hazard icon (icon + text label)
  const createHazardDivIcon = (hazard: SurfaceHazard) => {
    const emoji = HAZARD_EMOJI[hazard.type] || '⚠️';
    const badgeColor = hazard.severity === 'barrier' ? '#dc2626' : '#d97706';

    return L.divIcon({
      className: 'custom-hazard-pin',
      html: `
        <div class="custom-hazard-pin-inner" title="${hazard.label}">
          <div class="hazard-pin-circle" style="background-color:${badgeColor};">
            <span aria-hidden="true">${emoji}</span>
          </div>
          <div class="landmark-pin-label hazard">${hazard.label.split('(')[0].trim()}</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  return (
    <div
      className={`w-full h-full relative overflow-hidden ${
        isHighContrast ? 'contrast-125 contrast-more' : ''
      }`}
      role="region"
      aria-label="Walking route map. Landmarks are marked with icons, colored rings and written labels."
    >
      <MapContainer
        center={defaultCenter}
        zoom={16}
        minZoom={13}
        maxZoom={19}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={true}
        className="h-full w-full"
      >
        <FitRouteOverview route={routePolyline} alternative={alternativePolyline} steps={steps} />
        <MapViewController center={userPosition} follow={followUser} recenterSignal={recenterSignal} />

        {/* OpenStreetMap tiles (attribution preserved) */}
        <TileLayer attribution={OSM_ATTRIBUTION} url={tileUrl} maxZoom={19} />

        {/* Alternative route: grey dashed */}
        {alternativePolyline && alternativePolyline.length > 1 && (
          <Polyline positions={alternativePolyline} pathOptions={getAlternativePathOptions()} />
        )}

        {/* Active route: green when walking it, red when off route */}
        {routePolyline && routePolyline.length > 1 && (
          <>
            {/* Casing keeps the route readable on busy street tiles */}
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#ffffff',
                weight: 11,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline positions={routePolyline} pathOptions={getRoutePathOptions(isOffRoute)} />
          </>
        )}

        {/* Landmark markers: emoji + colored ring + text label */}
        {steps.map((step, idx) => (
          <Marker
            key={step.id}
            position={step.coordinates}
            icon={createLandmarkDivIcon(step, idx === currentStepIndex, idx < currentStepIndex)}
            alt={`${step.landmarkName}, ${step.colorName}`}
            title={`${step.landmarkName} — ${step.colorName}`}
            riseOnHover={false}
            zIndexOffset={idx === currentStepIndex ? 900 : idx < currentStepIndex ? 400 : 0}
            eventHandlers={{
              click: () => onSelectStep && onSelectStep(idx),
            }}
          >
            <Tooltip direction="top" offset={[0, -26]} opacity={1}>
              <span className="font-bold">
                {step.colorName} · {step.landmarkName}
              </span>
            </Tooltip>
          </Marker>
        ))}

        {/* Walker position */}
        {userPosition && (
          <Marker position={userPosition} icon={userGpsIcon} zIndexOffset={1200} interactive={false} />
        )}

        {/* Surface hazards layer */}
        {showSurfaceLayer &&
          surfaceHazards.map((hazard) => (
            <Marker
              key={hazard.id}
              position={hazard.coordinates}
              icon={createHazardDivIcon(hazard)}
              alt={`${hazard.label} surface hazard`}
              title={hazard.label}
              zIndexOffset={600}
            />
          ))}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;