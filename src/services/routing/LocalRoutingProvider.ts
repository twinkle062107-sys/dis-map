import { RoutingProvider, LatLng, RouteOptions, RouteResult } from './types';

/**
 * Offline demo geometry for the stage demo. These are the single source of truth for
 * the map polylines so the app never depends on the public OSRM demo server.
 */

// Primary demo walking route polyline (Metro -> Bank -> ATM -> Domino's -> Shop -> Cafe)
export const DEMO_ROUTE_COORDINATES: LatLng[] = [
  [28.6304, 77.2177], // Metro Gate 2
  [28.6308, 77.2183], // Plaza walkway corner
  [28.6312, 77.2189], // ICICI Bank Branch
  [28.6316, 77.2195], // Pedestrian zebra crossing
  [28.6319, 77.2202], // Bright Yellow ATM
  [28.6323, 77.2208], // Market alley corner
  [28.6328, 77.2215], // Red Domino's Sign
  [28.6333, 77.2221], // Tree-lined pedestrian zone
  [28.6337, 77.2226], // Green-Canopy Shop
  [28.6341, 77.2232], // Market archway
  [28.6346, 77.2238], // Cafe Aroma
];

// Alternative route polyline (drawn grey + dashed on the map)
export const DEMO_ALTERNATIVE_COORDINATES: LatLng[] = [
  [28.6304, 77.2177], // Metro Gate 2
  [28.6302, 77.219], // Outer perimeter sidewalk
  [28.631, 77.2205], // South boulevard
  [28.632, 77.222], // East avenue
  [28.6335, 77.2232], // Market east gate
  [28.6346, 77.2238], // Cafe Aroma
];

// Calm route polyline (avoids loud crossings and congested road corners)
export const DEMO_CALM_COORDINATES: LatLng[] = [
  [28.6304, 77.2177], // Metro Gate 2
  [28.6309, 77.218], // Quiet inner garden pathway
  [28.6315, 77.2186], // Residential mews
  [28.6322, 77.2196], // Tree-shaded pedestrian walk
  [28.633, 77.2208], // Calm courtyard
  [28.6339, 77.2222], // Quiet cafe lane
  [28.6346, 77.2238], // Cafe Aroma
];

export class LocalRoutingProvider implements RoutingProvider {
  name = 'LocalNeighborhoodProvider';

  async calculateRoute(
    start: LatLng,
    destination: LatLng,
    options?: RouteOptions
  ): Promise<RouteResult> {
    const isCalm = options?.calmMode;
    const activeCoords = isCalm ? DEMO_CALM_COORDINATES : DEMO_ROUTE_COORDINATES;

    return {
      coordinates: activeCoords.map((coord) => [coord[0], coord[1]] as LatLng),
      alternativeCoordinates: DEMO_ALTERNATIVE_COORDINATES.map((coord) => [coord[0], coord[1]] as LatLng),
      calmCoordinates: DEMO_CALM_COORDINATES.map((coord) => [coord[0], coord[1]] as LatLng),
      distanceMeters: isCalm ? 780 : 690,
      durationSeconds: isCalm ? 660 : 540, // Calm route: +2 mins for a quieter pace
      source: 'cached_fallback',
      calmSignals: {
        trafficSignalsAvoided: 2,
        quieterStreetMinutes: 8,
        lightedSidewalkRatio: 0.95,
      },
    };
  }
}