import { RoutingProvider, LatLng, RouteOptions, RouteResult } from './types';
import { LocalRoutingProvider } from './LocalRoutingProvider';

export class OSRMProvider implements RoutingProvider {
  name = 'SelfHostedOSRMProvider';
  private fallbackProvider = new LocalRoutingProvider();
  private baseUrl: string;

  constructor(customUrl?: string) {
    this.baseUrl =
      customUrl ||
      process.env.NEXT_PUBLIC_ROUTING_API_URL ||
      process.env.ROUTING_API_URL ||
      '';
  }

  async calculateRoute(
    start: LatLng,
    destination: LatLng,
    options?: RouteOptions
  ): Promise<RouteResult> {
    // If no custom engine is configured, immediately use cached local provider
    if (!this.baseUrl) {
      return this.fallbackProvider.calculateRoute(start, destination, options);
    }

    try {
      // OSRM format: /route/v1/foot/{startLng},{startLat};{endLng},{endLat}?overview=full&geometries=geojson&alternatives=true
      const url = `${this.baseUrl}/route/v1/foot/${start[1]},${start[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&alternatives=true`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });

      if (!response.ok) {
        throw new Error(`OSRM responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes returned by OSRM');
      }

      const primary = data.routes[0];
      // Convert geojson [lng, lat] to [lat, lng]
      const coordinates: LatLng[] = primary.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      let alternativeCoordinates: LatLng[] | undefined;
      if (data.routes.length > 1) {
        alternativeCoordinates = data.routes[1].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
      }

      return {
        coordinates,
        alternativeCoordinates,
        distanceMeters: primary.distance,
        durationSeconds: primary.duration,
        source: 'engine',
      };
    } catch (err) {
      console.warn('Custom routing engine unavailable, falling back to LocalRoutingProvider:', err);
      return this.fallbackProvider.calculateRoute(start, destination, options);
    }
  }
}
