import type { PathOptions } from 'leaflet';

/**
 * Route line styling for the Leaflet map.
 * Green = the route you are walking, red = you are off route,
 * grey dashed = the alternative route.
 */
export const ROUTE_COLORS = {
  active: '#16a34a',
  offRoute: '#dc2626',
  alternative: '#64748b',
} as const;

/** Stroke styling for the active route line. */
export function getRoutePathOptions(isOffRoute: boolean): PathOptions {
  return {
    color: isOffRoute ? ROUTE_COLORS.offRoute : ROUTE_COLORS.active,
    weight: 7,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: isOffRoute ? '10, 8' : undefined,
    className: isOffRoute ? 'route-line-off-route' : 'route-line-active',
  };
}

/** Stroke styling for the grey dashed alternative route. */
export function getAlternativePathOptions(): PathOptions {
  return {
    color: ROUTE_COLORS.alternative,
    weight: 6,
    dashArray: '2, 10',
    lineCap: 'round',
    opacity: 0.75,
  };
}