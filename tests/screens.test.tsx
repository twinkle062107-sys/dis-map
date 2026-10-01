import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { NavigationProvider } from '../src/context/NavigationContext';
import { NavigateScreen } from '../src/components/NavigateScreen';
import { HomeScreen } from '../src/components/HomeScreen';

const renderWithProvider = (ui: React.ReactElement) =>
  renderToString(React.createElement(NavigationProvider, null, ui));

describe('NavigateScreen server-render smoke test', () => {
  const html = renderWithProvider(React.createElement(NavigateScreen));

  it('renders the landmark instruction card with icon + written colour name', () => {
    expect(html).toContain('Landmark instruction card');
    expect(html).toContain('Metro Station Gate 2');
    expect(html).toContain('Cobalt Blue');
    expect(html).toContain('Exit Gate 2 toward the blue Metro pillars.');
  });

  it('keeps the map as the secondary top panel and client-only', () => {
    // Leaflet must never run on the server: only the dynamic loading shell is prerendered
    expect(html).toContain('Loading the walking map');
    expect(html).not.toContain('leaflet-container');
  });

  it('writes the route colours out in words instead of numbers', () => {
    expect(html).toContain('GREEN line: your route');
    expect(html).toContain('Your route');
    expect(html).toContain('Alternative');
    expect(html).toContain('Off route');
    expect(html).not.toMatch(/\d+\s?(m|metres|meters|minutes|mins)\b/i);
  });

  it('keeps the assistive controls and the simulated walking toggle', () => {
    expect(html).toContain('Simulate Walk');
    expect(html).toContain('Lost');
    expect(html).toContain('Flashback');
    expect(html).toContain('DEMO: SIMULATE OFF-ROUTE');
  });
});

describe('HomeScreen server-render smoke test', () => {
  it('still renders the voice destination entry point', () => {
    const html = renderWithProvider(React.createElement(HomeScreen));
    expect(html).toContain('Where to?');
    expect(html).toContain('Cafe Aroma near the market');
  });
});