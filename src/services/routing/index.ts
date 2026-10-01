import { RoutingProvider } from './types';
import { LocalRoutingProvider } from './LocalRoutingProvider';
import { OSRMProvider } from './OSRMProvider';

let instance: RoutingProvider | null = null;

/**
 * Resolves the routing engine for the session.
 * Defaults to the offline LocalRoutingProvider so the core demo never depends on
 * the public OSRM demo server. Set NEXT_PUBLIC_ROUTING_API_URL to opt into a
 * self-hosted OSRM instance; it still falls back to the local demo route on error.
 */
export function getRoutingProvider(): RoutingProvider {
  if (!instance) {
    const customUrl = process.env.NEXT_PUBLIC_ROUTING_API_URL;
    instance = customUrl ? new OSRMProvider(customUrl) : new LocalRoutingProvider();
  }
  return instance;
}

export * from './types';
export {
  LocalRoutingProvider,
  DEMO_ROUTE_COORDINATES,
  DEMO_ALTERNATIVE_COORDINATES,
  DEMO_CALM_COORDINATES,
} from './LocalRoutingProvider';
export { OSRMProvider } from './OSRMProvider';
