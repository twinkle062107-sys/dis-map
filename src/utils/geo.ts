import { LatLng } from '@/services/routing/types';
import { SurfaceHazard } from '@/types/navigation';

/**
 * Calculates Great-Circle distance between two points in meters using Haversine formula
 */
export function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const deltaLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const deltaLng = ((p2[1] - p1[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates distance in meters from point P to line segment VW
 */
export function distanceToSegment(p: LatLng, v: LatLng, w: LatLng): number {
  const l2 = haversineDistance(v, w);
  if (l2 === 0) return haversineDistance(p, v);

  // Approximate planar projection for local walking distances (<1km)
  const dLat = w[0] - v[0];
  const dLng = w[1] - v[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - v[0]) * dLat + (p[1] - v[1]) * dLng) / (dLat * dLat + dLng * dLng))
  );

  const projection: LatLng = [v[0] + t * dLat, v[1] + t * dLng];
  return haversineDistance(p, projection);
}

/**
 * Computes minimum distance from user position to any segment of the route polyline
 */
export function minDistanceToPolyline(pos: LatLng, polyline: LatLng[]): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return haversineDistance(pos, polyline[0]);

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegment(pos, polyline[i], polyline[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }
  return minDistance;
}

/**
 * Determines whether user has deviated off-route (> threshold meters, default 35m)
 */
export function isOffRoute(pos: LatLng, polyline: LatLng[], thresholdMeters = 35): boolean {
  if (!polyline || polyline.length < 2) return false;
  const dist = minDistanceToPolyline(pos, polyline);
  return dist > thresholdMeters;
}

/**
 * Total length of a polyline in meters
 */
export function polylineLength(polyline: LatLng[]): number {
  if (!polyline || polyline.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineDistance(polyline[i], polyline[i + 1]);
  }
  return total;
}

/**
 * Returns the point sitting at `progress` (0..1) along the polyline, measured by distance.
 * Used to glide the simulated walker dot along the demo route without any GPS hardware.
 */
export function pointAlongPolyline(polyline: LatLng[], progress: number): LatLng | null {
  if (!polyline || polyline.length === 0) return null;
  if (polyline.length === 1) return polyline[0];

  const clamped = Math.max(0, Math.min(1, progress));
  const total = polylineLength(polyline);
  if (total === 0) return polyline[0];

  const target = total * clamped;
  let travelled = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const segment = haversineDistance(polyline[i], polyline[i + 1]);
    if (travelled + segment >= target) {
      const ratio = segment === 0 ? 0 : (target - travelled) / segment;
      return [
        polyline[i][0] + (polyline[i + 1][0] - polyline[i][0]) * ratio,
        polyline[i][1] + (polyline[i + 1][1] - polyline[i][1]) * ratio,
      ];
    }
    travelled += segment;
  }

  return polyline[polyline.length - 1];
}

/**
 * Offsets a position by a number of meters east/north. Used by the demo to visibly
 * deviate the walker from the green route line.
 */
export function offsetPosition(pos: LatLng, eastMeters = 0, northMeters = 0): LatLng {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((pos[0] * Math.PI) / 180);
  return [
    pos[0] + northMeters / metersPerDegLat,
    pos[1] + eastMeters / metersPerDegLng,
  ];
}

/**
 * Checks if user is within proximity (default 15m) of any surface hazards (e.g. stairs, uneven ground)
 */
export function checkHazardProximity(
  pos: LatLng,
  hazards: SurfaceHazard[],
  thresholdMeters = 15
): SurfaceHazard[] {
  if (!hazards || hazards.length === 0) return [];
  return hazards.filter((h) => haversineDistance(pos, h.coordinates) <= thresholdMeters);
}
