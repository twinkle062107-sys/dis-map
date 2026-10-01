export type LatLng = [number, number]; // [latitude, longitude]

export interface RouteOptions {
  calmMode?: boolean;
  stepFree?: boolean;
}

export interface RouteResult {
  coordinates: LatLng[];
  alternativeCoordinates?: LatLng[];
  calmCoordinates?: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  source: 'engine' | 'cached_fallback';
  calmSignals?: {
    trafficSignalsAvoided: number;
    quieterStreetMinutes: number;
    lightedSidewalkRatio: number;
  };
}

export interface RoutingProvider {
  name: string;
  calculateRoute(start: LatLng, destination: LatLng, options?: RouteOptions): Promise<RouteResult>;
}
