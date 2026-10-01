import { describe, it, expect } from 'vitest';
import {
  LocalRoutingProvider,
  DEMO_ROUTE_COORDINATES,
  DEMO_ALTERNATIVE_COORDINATES,
} from '../src/services/routing/LocalRoutingProvider';
import { OSRMProvider } from '../src/services/routing/OSRMProvider';
import {
  haversineDistance,
  isOffRoute,
  checkHazardProximity,
  pointAlongPolyline,
  polylineLength,
  offsetPosition,
  minDistanceToPolyline,
} from '../src/utils/geo';
import { SURFACE_HAZARDS, ROUTE_STEPS } from '../src/data/demo';
import { LatLng } from '../src/services/routing/types';
import {
  ROUTE_COLORS,
  getRoutePathOptions,
  getAlternativePathOptions,
} from '../src/components/map/routeStyle';

describe('RoutingProvider Tests', () => {
  it('LocalRoutingProvider returns complete route with alternative and calm paths', async () => {
    const provider = new LocalRoutingProvider();
    const result = await provider.calculateRoute([28.6304, 77.2177], [28.6346, 77.2238]);

    expect(result.source).toBe('cached_fallback');
    expect(result.coordinates.length).toBeGreaterThan(5);
    expect(result.alternativeCoordinates).toBeDefined();
    expect(result.alternativeCoordinates!.length).toBeGreaterThan(2);
    expect(result.calmCoordinates).toBeDefined();
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);
  });

  it('OSRMProvider falls back gracefully when server URL is unavailable', async () => {
    const provider = new OSRMProvider('http://invalid-unreachable-osrm-host:9999');
    const result = await provider.calculateRoute([28.6304, 77.2177], [28.6346, 77.2238]);

    expect(result.source).toBe('cached_fallback');
    expect(result.coordinates.length).toBeGreaterThan(5);
  });
});

describe('Geospatial & Hazard Proximity Tests', () => {
  it('calculates Haversine distance correctly between nearby points', () => {
    const p1: LatLng = [28.6304, 77.2177];
    const p2: LatLng = [28.6312, 77.2189]; // ~145 meters away
    const distance = haversineDistance(p1, p2);

    expect(distance).toBeGreaterThan(120);
    expect(distance).toBeLessThan(180);
  });

  it('detects when user is on-route vs off-route', () => {
    const routePolyline: LatLng[] = [
      [28.6304, 77.2177],
      [28.6312, 77.2189],
      [28.6319, 77.2202],
    ];

    // Point right on the route segment
    const onRoutePoint: LatLng = [28.6308, 77.2183];
    expect(isOffRoute(onRoutePoint, routePolyline, 35)).toBe(false);

    // Point far away (>100 meters)
    const offRoutePoint: LatLng = [28.6350, 77.2100];
    expect(isOffRoute(offRoutePoint, routePolyline, 35)).toBe(true);
  });

  it('identifies hazards within 15 meters proximity', () => {
    // Point 5 meters from Metro stairs ([28.6307, 77.2181])
    const nearStairs: LatLng = [28.63072, 77.21812];
    const detected = checkHazardProximity(nearStairs, SURFACE_HAZARDS, 15);

    expect(detected.length).toBeGreaterThan(0);
    expect(detected.some((h) => h.type === 'stairs')).toBe(true);

// Point far away from any hazard
    const safeZone: LatLng = [28.65, 77.25];
    const noneDetected = checkHazardProximity(safeZone, SURFACE_HAZARDS, 15);
    expect(noneDetected.length).toBe(0);
  });
});

describe('Simulated Walking Position Tests', () => {
  it('glides the simulated walker along the demo route without leaving it', () => {
    expect(pointAlongPolyline(DEMO_ROUTE_COORDINATES, 0)).toEqual(DEMO_ROUTE_COORDINATES[0]);
    expect(pointAlongPolyline(DEMO_ROUTE_COORDINATES, 1)).toEqual(
      DEMO_ROUTE_COORDINATES[DEMO_ROUTE_COORDINATES.length - 1]
    );

    // Halfway along the polyline must still sit on the walking line
    const halfway = pointAlongPolyline(DEMO_ROUTE_COORDINATES, 0.5)!;
    expect(isOffRoute(halfway, DEMO_ROUTE_COORDINATES, 5)).toBe(false);

    // Progress is monotonic in distance travelled
    const early = pointAlongPolyline(DEMO_ROUTE_COORDINATES, 0.2)!;
    const late = pointAlongPolyline(DEMO_ROUTE_COORDINATES, 0.8)!;
    expect(polylineLength(DEMO_ROUTE_COORDINATES)).toBeGreaterThan(500);
    expect(haversineDistance(DEMO_ROUTE_COORDINATES[0], early)).toBeLessThan(
      haversineDistance(DEMO_ROUTE_COORDINATES[0], late)
    );
  });

  it('offsetPosition moves a point by the requested number of meters', () => {
    const origin: LatLng = [28.6304, 77.2177];
    const shifted = offsetPosition(origin, 70);

    expect(haversineDistance(origin, shifted)).toBeGreaterThan(65);
    expect(haversineDistance(origin, shifted)).toBeLessThan(75);
    expect(isOffRoute(shifted, DEMO_ROUTE_COORDINATES, 35)).toBe(true);
  });

  it('demo fallback route connects the first and last landmark of the demo walk', () => {
    const first = ROUTE_STEPS[0].coordinates;
    const last = ROUTE_STEPS[ROUTE_STEPS.length - 1].coordinates;

    expect(DEMO_ROUTE_COORDINATES[0]).toEqual(first);
    expect(DEMO_ROUTE_COORDINATES[DEMO_ROUTE_COORDINATES.length - 1]).toEqual(last);
    expect(DEMO_ALTERNATIVE_COORDINATES[0]).toEqual(first);

    // Every demo landmark sits on the drawn route (never a numeric distance is shown in the UI)
    ROUTE_STEPS.forEach((step) => {
      expect(minDistanceToPolyline(step.coordinates, DEMO_ROUTE_COORDINATES)).toBeLessThan(30);
    });
  });
});

describe('Map Route Styling Tests', () => {
  it('draws the active route green and the off-route state red', () => {
    const onRoute = getRoutePathOptions(false);
    expect(onRoute.color).toBe(ROUTE_COLORS.active);
    expect(onRoute.dashArray).toBeUndefined();

    const offRoute = getRoutePathOptions(true);
    expect(offRoute.color).toBe(ROUTE_COLORS.offRoute);
    expect(offRoute.dashArray).toBeDefined();
  });

  it('draws the alternative route as a grey dashed line', () => {
    const alternative = getAlternativePathOptions();
    expect(alternative.color).toBe(ROUTE_COLORS.alternative);
    expect(alternative.dashArray).toBeDefined();
  });
});
