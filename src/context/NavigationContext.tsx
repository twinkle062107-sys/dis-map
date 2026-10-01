'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RouteStep, CaregiverAlert, Badge, SurfaceHazard } from '@/types/navigation';
import { ROUTE_STEPS, BADGES, DEMO_DESTINATIONS, SURFACE_HAZARDS } from '@/data/demo';
import { speakText, stopSpeaking } from '@/utils/speech';
import {
  LatLng,
  RouteResult,
  getRoutingProvider,
  DEMO_ROUTE_COORDINATES,
  DEMO_ALTERNATIVE_COORDINATES,
  DEMO_CALM_COORDINATES,
} from '@/services/routing';
import { useGeolocation } from '@/hooks/useGeolocation';
import { checkHazardProximity, pointAlongPolyline, offsetPosition } from '@/utils/geo';

export type NavigationStatus = 'on_route' | 'stopped' | 'off_route';

interface SyncPayload {
  currentStepIndex: number;
  isNavigating: boolean;
  status: NavigationStatus;
  collectedLandmarks: string[];
  score: number;
  alerts: CaregiverAlert[];
  lastUpdate: number;
  currentLandmarkName: string;
}

interface NavigationContextType {
  activeRoute: RouteStep[];
  currentStepIndex: number;
  currentStep: RouteStep;
  isNavigating: boolean;
  isWalkingSimulated: boolean;
  status: NavigationStatus;
  collectedLandmarks: string[];
  score: number;
  unlockedBadges: Badge[];
  alerts: CaregiverAlert[];
  isHighContrast: boolean;
  isVoiceMuted: boolean;
  isSafeHavenOpen: boolean;
  isRadarOpen: boolean;
  isFlashbackOpen: boolean;
  selectedDestination: string;
  // Map, GPS & Routing
  userGpsPosition: LatLng;
  routeCoordinates: LatLng[];
  alternativeCoordinates: LatLng[];
  calmCoordinates: LatLng[];
  routingSource: RouteResult['source'];
  enableRealGps: boolean;
  toggleRealGps: () => void;
  isGpsTracking: boolean;
  gpsError: string | null;
  showSurfaceLayer: boolean;
  toggleSurfaceLayer: () => void;
  calmMode: boolean;
  toggleCalmMode: () => void;
  stepFreeMode: boolean;
  toggleStepFreeMode: () => void;
  surfaceHazards: SurfaceHazard[];
  nearbyHazards: SurfaceHazard[];
  // Handlers
  startNavigation: (destinationId?: string) => void;
  stopNavigation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (index: number) => void;
  toggleSimulateWalking: () => void;
  toggleHighContrast: () => void;
  toggleVoiceMute: () => void;
  triggerOffRoute: () => void;
  resolveOffRoute: () => void;
  collectLandmark: (stepId: string) => boolean; // returns true if newly collected
  setSafeHavenOpen: (open: boolean) => void;
  setRadarOpen: (open: boolean) => void;
  setFlashbackOpen: (open: boolean) => void;
  sendCaregiverAlert: (
    type: CaregiverAlert['type'],
    message: string,
    severity?: CaregiverAlert['severity']
  ) => void;
  speakCurrentInstruction: () => void;
  resetAll: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'memorybridge_sync_channel';
const LOCAL_STORAGE_KEY = 'memorybridge_state_v1';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoute] = useState<RouteStep[]>(ROUTE_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isWalkingSimulated, setIsWalkingSimulated] = useState<boolean>(false);
  const [status, setStatus] = useState<NavigationStatus>('on_route');
  const [collectedLandmarks, setCollectedLandmarks] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isSafeHavenOpen, setIsSafeHavenOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [isFlashbackOpen, setIsFlashbackOpen] = useState<boolean>(false);
  const [selectedDestination, setSelectedDestination] =
    useState<string>('Cafe Aroma near the market');

  // --- Map / GPS / Routing state (Feature 1) ---
  // Seeded with the offline demo geometry so the map paints instantly and never waits on a network engine
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>(DEMO_ROUTE_COORDINATES);
  const [alternativeCoordinates, setAlternativeCoordinates] = useState<LatLng[]>(
    DEMO_ALTERNATIVE_COORDINATES
  );
  const [calmCoordinates, setCalmCoordinates] = useState<LatLng[]>(DEMO_CALM_COORDINATES);
  const [routingSource, setRoutingSource] = useState<RouteResult['source']>('cached_fallback');
  const [enableRealGps, setEnableRealGps] = useState<boolean>(false);
  const [showSurfaceLayer, setShowSurfaceLayer] = useState<boolean>(true);
  const [calmMode, setCalmMode] = useState<boolean>(false);
  const [stepFreeMode, setStepFreeMode] = useState<boolean>(false);
  const [offRouteDeviation, setOffRouteDeviation] = useState<LatLng | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);
  // Latest simulated walker position, used to anchor the off-route demo deviation
  const offRouteAnchorRef = useRef<LatLng>(ROUTE_STEPS[0].coordinates as LatLng);

  const currentStep = activeRoute[currentStepIndex] || activeRoute[0];

  // Helper to broadcast state to other tabs (e.g., Caregiver Dashboard)
  const broadcastSync = useCallback((payload: Partial<SyncPayload>) => {
    if (typeof window === 'undefined') return;
    try {
      const fullPayload: SyncPayload = {
        currentStepIndex,
        isNavigating,
        status,
        collectedLandmarks,
        score,
        alerts,
        lastUpdate: Date.now(),
        currentLandmarkName: currentStep.landmarkName,
        ...payload,
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullPayload));

      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SYNC_STATE', payload: fullPayload });
      }
    } catch (e) {
      console.warn('Broadcast sync error:', e);
    }
  }, [currentStepIndex, isNavigating, status, collectedLandmarks, score, alerts, currentStep.landmarkName]);

  // Set up BroadcastChannel & LocalStorage listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load initial from localStorage if present
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SyncPayload;
        if (typeof parsed.currentStepIndex === 'number') {
          setCurrentStepIndex(parsed.currentStepIndex);
        }
        if (typeof parsed.isNavigating === 'boolean') {
          setIsNavigating(parsed.isNavigating);
        }
        if (parsed.status) {
          setStatus(parsed.status);
        }
        if (Array.isArray(parsed.collectedLandmarks)) {
          setCollectedLandmarks(parsed.collectedLandmarks);
        }
        if (typeof parsed.score === 'number') {
          setScore(parsed.score);
        }
        if (Array.isArray(parsed.alerts)) {
          setAlerts(parsed.alerts);
        }
      }
    } catch {
      // ignore parse errors
    }

    try {
      if ('BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current.onmessage = (event) => {
          if (event.data?.type === 'SYNC_STATE' && event.data.payload) {
            const data: SyncPayload = event.data.payload;
            isBroadcastingRef.current = true;
            setCurrentStepIndex(data.currentStepIndex);
            setIsNavigating(data.isNavigating);
            setStatus(data.status);
            setCollectedLandmarks(data.collectedLandmarks || []);
            setScore(data.score || 0);
            setAlerts(data.alerts || []);
            setTimeout(() => {
              isBroadcastingRef.current = false;
            }, 50);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const data: SyncPayload = JSON.parse(e.newValue);
          setCurrentStepIndex(data.currentStepIndex);
          setIsNavigating(data.isNavigating);
          setStatus(data.status);
          setCollectedLandmarks(data.collectedLandmarks || []);
          setScore(data.score || 0);
          setAlerts(data.alerts || []);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Update unlocked badges when score / collection changes
  useEffect(() => {
    const newBadges: Badge[] = [];
    BADGES.forEach((b) => {
      if (collectedLandmarks.length >= b.requiredCount) {
        newBadges.push(b);
      }
    });
    setUnlockedBadges(newBadges);
  }, [collectedLandmarks]);

  // TTS helper for current step
  const speakCurrentInstruction = useCallback(() => {
    if (isVoiceMuted) return;
    const step = activeRoute[currentStepIndex];
    if (!step) return;
    const spoken = `${step.turnText}. ${step.text} Look for the ${step.colorName} ${step.landmarkName}.`;
    speakText(spoken);
  }, [currentStepIndex, activeRoute, isVoiceMuted]);

  // Start Navigation
  const startNavigation = useCallback((destinationId?: string) => {
    const matched = DEMO_DESTINATIONS.find((d) => d.id === destinationId) || DEMO_DESTINATIONS[0];
    setSelectedDestination(matched.name);
    setCurrentStepIndex(0);
    setIsNavigating(true);
    setStatus('on_route');
    setIsWalkingSimulated(false);
    setOffRouteDeviation(null);

    const newAlert: CaregiverAlert = {
      id: 'alert-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'progress',
      severity: 'low',
      message: `Started walking navigation toward ${matched.name}.`,
      landmarkContext: ROUTE_STEPS[0].landmarkName,
      resolved: true,
    };

    const nextAlerts = [newAlert, ...alerts].slice(0, 20);
    setAlerts(nextAlerts);

    broadcastSync({
      currentStepIndex: 0,
      isNavigating: true,
      status: 'on_route',
      alerts: nextAlerts,
      currentLandmarkName: ROUTE_STEPS[0].landmarkName,
    });

    // Voice announcement
    if (!isVoiceMuted) {
      speakText(`Navigation started to ${matched.shortName}. ${ROUTE_STEPS[0].text}`);
    }
  }, [alerts, broadcastSync, isVoiceMuted]);

  // Stop Navigation
  const stopNavigation = useCallback(() => {
    stopSpeaking();
    setIsNavigating(false);
    setIsWalkingSimulated(false);
    setStatus('stopped');
    broadcastSync({ isNavigating: false, status: 'stopped' });
  }, [broadcastSync]);

  // Next Step
  const nextStep = useCallback(() => {
    if (currentStepIndex < activeRoute.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextLandmark = activeRoute[nextIdx];

      const newAlert: CaregiverAlert = {
        id: 'alert-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: nextIdx === activeRoute.length - 1 ? 'destination_reached' : 'progress',
        severity: 'low',
        message: nextIdx === activeRoute.length - 1
          ? `Reached final destination: ${nextLandmark.landmarkName}!`
          : `Advanced to Step ${nextIdx + 1}: ${nextLandmark.landmarkName}.`,
        landmarkContext: nextLandmark.landmarkName,
        resolved: true,
      };

      const updatedAlerts = [newAlert, ...alerts].slice(0, 20);
      setAlerts(updatedAlerts);

      broadcastSync({
        currentStepIndex: nextIdx,
        alerts: updatedAlerts,
        currentLandmarkName: nextLandmark.landmarkName,
      });

      if (!isVoiceMuted) {
        speakText(`${nextLandmark.turnText}. ${nextLandmark.text}`);
      }
    }
  }, [currentStepIndex, activeRoute, alerts, broadcastSync, isVoiceMuted]);

  // Previous Step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevLandmark = activeRoute[prevIdx];
      broadcastSync({
        currentStepIndex: prevIdx,
        currentLandmarkName: prevLandmark.landmarkName,
      });
      if (!isVoiceMuted) {
        speakText(`Returned to ${prevLandmark.landmarkName}. ${prevLandmark.text}`);
      }
    }
  }, [currentStepIndex, activeRoute, broadcastSync, isVoiceMuted]);

  // Jump to specific step (e.g. from Radar re-anchor)
  const jumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < activeRoute.length) {
      setCurrentStepIndex(index);
      setStatus('on_route');
      const targetLandmark = activeRoute[index];

      const reanchorAlert: CaregiverAlert = {
        id: 'alert-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 're_anchored',
        severity: 'medium',
        message: `Successfully re-anchored position at ${targetLandmark.landmarkName}!`,
        landmarkContext: targetLandmark.landmarkName,
        resolved: true,
      };

      const nextAlerts = [reanchorAlert, ...alerts].slice(0, 20);
      setAlerts(nextAlerts);

      broadcastSync({
        currentStepIndex: index,
        status: 'on_route',
        alerts: nextAlerts,
        currentLandmarkName: targetLandmark.landmarkName,
      });

      if (!isVoiceMuted) {
        speakText(`Position re-anchored at ${targetLandmark.landmarkName}. Continue on route.`);
      }
    }
  }, [activeRoute, alerts, broadcastSync, isVoiceMuted]);

  // Simulate walking toggle (auto advances every 7 seconds)
  const toggleSimulateWalking = useCallback(() => {
    setIsWalkingSimulated((prev) => !prev);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isNavigating && isWalkingSimulated && status === 'on_route') {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < activeRoute.length - 1) {
            const nextIdx = prev + 1;
            const targetLandmark = activeRoute[nextIdx];
            
            // Speak new step
            if (!isVoiceMuted) {
              speakText(`${targetLandmark.turnText}. ${targetLandmark.text}`);
            }

            broadcastSync({
              currentStepIndex: nextIdx,
              currentLandmarkName: targetLandmark.landmarkName,
            });
            return nextIdx;
          } else {
            setIsWalkingSimulated(false);
            return prev;
          }
        });
      }, 7000); // 7 seconds per landmark step
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isNavigating, isWalkingSimulated, status, activeRoute, broadcastSync, isVoiceMuted]);

  // Simulate off-route trigger (Key demo moment)
  const triggerOffRoute = useCallback(() => {
    setStatus('off_route');
    setIsWalkingSimulated(false);
    // Nudge the simulated walker off the green line so the map shows the deviation
    setOffRouteDeviation((prev) => prev ?? offsetPosition(offRouteAnchorRef.current, 70));

    const offRouteAlert: CaregiverAlert = {
      id: 'alert-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'off_route',
      severity: 'critical',
      message: `User deviated off designated route near ${currentStep.landmarkName}!`,
      landmarkContext: currentStep.landmarkName,
      resolved: false,
    };

    const nextAlerts = [offRouteAlert, ...alerts].slice(0, 20);
    setAlerts(nextAlerts);

    broadcastSync({
      status: 'off_route',
      alerts: nextAlerts,
    });

    if (!isVoiceMuted) {
      speakText('Notice: It looks like you may have turned off the main route. Tap I am lost to re-orient, or tap Safe Haven.');
    }
  }, [currentStep.landmarkName, alerts, broadcastSync, isVoiceMuted]);

  // Resolve off-route
  const resolveOffRoute = useCallback(() => {
    setStatus('on_route');
    setOffRouteDeviation(null);
    const resolvedAlerts = alerts.map((a) =>
      a.type === 'off_route' ? { ...a, resolved: true } : a
    );
    setAlerts(resolvedAlerts);
    broadcastSync({
      status: 'on_route',
      alerts: resolvedAlerts,
    });
  }, [alerts, broadcastSync]);

  // ---------------------------------------------------------------------------
  // Map, GPS & routing (Feature 1)
  // ---------------------------------------------------------------------------

  // Load the active route geometry from the configured provider.
  // Defaults to the offline LocalRoutingProvider, so the core demo never calls a public demo server.
  useEffect(() => {
    let cancelled = false;
    const provider = getRoutingProvider();
    const start = ROUTE_STEPS[0].coordinates as LatLng;
    const destination = ROUTE_STEPS[ROUTE_STEPS.length - 1].coordinates as LatLng;

    provider
      .calculateRoute(start, destination, { calmMode, stepFree: stepFreeMode })
      .then((result) => {
        if (cancelled) return;
        if (result.coordinates && result.coordinates.length > 1) {
          setRouteCoordinates(result.coordinates);
        }
        if (result.alternativeCoordinates && result.alternativeCoordinates.length > 1) {
          setAlternativeCoordinates(result.alternativeCoordinates);
        }
        if (result.calmCoordinates && result.calmCoordinates.length > 1) {
          setCalmCoordinates(result.calmCoordinates);
        }
        setRoutingSource(result.source);
      })
      .catch(() => {
        // LocalRoutingProvider is the safety net; nothing to recover here.
      });

    return () => {
      cancelled = true;
    };
  }, [calmMode, stepFreeMode]);

  // Progress along the route (0..1) drives the simulated walker when GPS is off
  const routeProgress = activeRoute.length > 1 ? currentStepIndex / (activeRoute.length - 1) : 0;

  const simulatedPosition = useMemo<LatLng>(() => {
    if (offRouteDeviation) return offRouteDeviation;
    const alongRoute = pointAlongPolyline(routeCoordinates, routeProgress);
    return alongRoute || (activeRoute[currentStepIndex]?.coordinates as LatLng) || routeCoordinates[0];
  }, [offRouteDeviation, routeCoordinates, routeProgress, activeRoute, currentStepIndex]);

  // Keep the ref in sync outside of render (used to anchor the off-route demo deviation)
  useEffect(() => {
    offRouteAnchorRef.current = simulatedPosition;
  }, [simulatedPosition]);

  // Real GPS via navigator.geolocation.watchPosition, simulated walking otherwise
  const handleGpsDeviation = useCallback(
    (pos: LatLng) => {
      setOffRouteDeviation(pos);
      triggerOffRoute();
    },
    [triggerOffRoute]
  );

  const {
    position: userGpsPosition,
    error: gpsError,
    isTracking: isGpsTracking,
  } = useGeolocation({
    enableRealGps,
    routePolyline: routeCoordinates,
    simulatedCoordinates: enableRealGps ? undefined : simulatedPosition,
    onOffRouteDetected: handleGpsDeviation,
  });

  // Hazards right around the walker (stairs, cobblestones, gravel...)
  const nearbyHazards = useMemo(
    () => checkHazardProximity(userGpsPosition, SURFACE_HAZARDS, 15),
    [userGpsPosition]
  );

  const toggleRealGps = useCallback(() => {
    setEnableRealGps((prev) => {
      if (prev) setOffRouteDeviation(null);
      return !prev;
    });
  }, []);

  const toggleSurfaceLayer = useCallback(() => setShowSurfaceLayer((prev) => !prev), []);

  const toggleCalmMode = useCallback(() => {
    setCalmMode((prev) => {
      const next = !prev;
      if (!isVoiceMuted) {
        speakText(
          next
            ? 'Calm route on. We will avoid the loud busy crossings and use the quieter garden pathway.'
            : 'Calm route off. Back on the main walking route.'
        );
      }
      return next;
    });
  }, [isVoiceMuted]);

  const toggleStepFreeMode = useCallback(() => setStepFreeMode((prev) => !prev), []);

  // Landmark Collector (+10 points)
  const collectLandmark = useCallback((stepId: string): boolean => {
    if (collectedLandmarks.includes(stepId)) {
      return false; // already collected
    }
    const updated = [...collectedLandmarks, stepId];
    const newScore = score + 10;
    setCollectedLandmarks(updated);
    setScore(newScore);

    broadcastSync({
      collectedLandmarks: updated,
      score: newScore,
    });

    return true;
  }, [collectedLandmarks, score, broadcastSync]);

  // Generic Caregiver Alert sender
  const sendCaregiverAlert = useCallback((
    type: CaregiverAlert['type'],
    message: string,
    severity: CaregiverAlert['severity'] = 'medium'
  ) => {
    const alert: CaregiverAlert = {
      id: 'alert-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      severity,
      message,
      landmarkContext: currentStep.landmarkName,
      resolved: false,
    };

    const nextAlerts = [alert, ...alerts].slice(0, 20);
    setAlerts(nextAlerts);

    broadcastSync({
      alerts: nextAlerts,
    });
  }, [currentStep.landmarkName, alerts, broadcastSync]);

  // Toggle contrast
  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => !prev);
  }, []);

  // Toggle voice mute
  const toggleVoiceMute = useCallback(() => {
    setIsVoiceMuted((prev) => {
      if (!prev) stopSpeaking();
      return !prev;
    });
  }, []);

  // Reset all
  const resetAll = useCallback(() => {
    stopSpeaking();
    setCurrentStepIndex(0);
    setIsNavigating(false);
    setIsWalkingSimulated(false);
    setStatus('on_route');
    setCollectedLandmarks([]);
    setScore(0);
    setAlerts([]);
    setOffRouteDeviation(null);
    setEnableRealGps(false);
    setCalmMode(false);
    setStepFreeMode(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    broadcastSync({
      currentStepIndex: 0,
      isNavigating: false,
      status: 'on_route',
      collectedLandmarks: [],
      score: 0,
      alerts: [],
    });
  }, [broadcastSync]);

  return (
    <NavigationContext.Provider
      value={{
        activeRoute,
        currentStepIndex,
        currentStep,
        isNavigating,
        isWalkingSimulated,
        status,
        collectedLandmarks,
        score,
        unlockedBadges,
        alerts,
        isHighContrast,
        isVoiceMuted,
        isSafeHavenOpen,
        isRadarOpen,
        isFlashbackOpen,
        selectedDestination,
        userGpsPosition,
        routeCoordinates,
        alternativeCoordinates,
        calmCoordinates,
        routingSource,
        enableRealGps,
        toggleRealGps,
        isGpsTracking,
        gpsError,
        showSurfaceLayer,
        toggleSurfaceLayer,
        calmMode,
        toggleCalmMode,
        stepFreeMode,
        toggleStepFreeMode,
        surfaceHazards: SURFACE_HAZARDS,
        nearbyHazards,
        startNavigation,
        stopNavigation,
        nextStep,
        prevStep,
        jumpToStep,
        toggleSimulateWalking,
        toggleHighContrast,
        toggleVoiceMute,
        triggerOffRoute,
        resolveOffRoute,
        collectLandmark,
        setSafeHavenOpen: setIsSafeHavenOpen,
        setRadarOpen: setIsRadarOpen,
        setFlashbackOpen: setIsFlashbackOpen,
        sendCaregiverAlert,
        speakCurrentInstruction,
        resetAll,
      }}
    >
      <div className={isHighContrast ? 'contrast-mode min-h-screen bg-black text-white' : 'min-h-screen bg-slate-50 text-slate-900'}>
        {children}
      </div>
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
