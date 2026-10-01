'use client';

import React, { useCallback, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { DynamicMap } from '@/components/map/DynamicMap';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Volume2,
  Compass,
  History,
  AlertTriangle,
  Play,
  Pause,
  Sparkles,
  Flag,
  Crosshair,
  Satellite,
  Leaf,
  Trees,
  MapPin,
} from 'lucide-react';

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

export const NavigateScreen: React.FC = () => {
  const {
    activeRoute,
    currentStepIndex,
    currentStep,
    nextStep,
    prevStep,
    jumpToStep,
    stopNavigation,
    isWalkingSimulated,
    toggleSimulateWalking,
    triggerOffRoute,
    resolveOffRoute,
    status,
    collectLandmark,
    collectedLandmarks,
    speakCurrentInstruction,
    isHighContrast,
    setRadarOpen,
    setFlashbackOpen,
    // Map / GPS
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
    nearbyHazards,
    surfaceHazards,
  } = useNavigation();

  const [collectedCelebration, setCollectedCelebration] = useState<boolean>(false);
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [recenterSignal, setRecenterSignal] = useState<number>(0);

  const isCollected = collectedLandmarks.includes(currentStep.id);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeRoute.length - 1;
  const isOffRoute = status === 'off_route';

  const handleRecenter = useCallback(() => {
    setFollowUser(true);
    setRecenterSignal((n) => n + 1);
  }, []);

  const handleMapLandmarkSelect = useCallback(
    (index: number) => {
      if (index === currentStepIndex) return;
      jumpToStep(index);
    },
    [currentStepIndex, jumpToStep]
  );

  // Render direction turn arrow
  const renderTurnArrow = () => {
    switch (currentStep.turn) {
      case 'left':
        return <ArrowLeft className="w-8 h-8 stroke-[3]" />;
      case 'right':
        return <ArrowRight className="w-8 h-8 stroke-[3]" />;
      case 'arrive':
        return <Flag className="w-8 h-8 stroke-[3]" />;
      case 'start':
      case 'straight':
      default:
        return <ArrowUp className="w-8 h-8 stroke-[3]" />;
    }
  };

  // Landmark Collection action with confetti
  const handleCardTapToCollect = () => {
    const isNew = collectLandmark(currentStep.id);
    if (isNew) {
      setCollectedCelebration(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: [currentStep.colorHex, '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore if canvas-confetti issues
      }
      setTimeout(() => setCollectedCelebration(false), 2000);
    }
  };

  // The map draws the calm route when calm mode is on, otherwise the main walking route
  const activeRouteLine = calmMode && calmCoordinates.length > 1 ? calmCoordinates : routeCoordinates;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* =========================================================
          MAP — top ~45% of the screen (secondary, glanceable)
          ========================================================= */}
      <section className="relative flex-[45] min-h-[200px] shrink-0" aria-label="Walking route map area">
        <div className="absolute inset-0 overflow-hidden rounded-b-[32px] shadow-[0_10px_28px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5">
          <DynamicMap
            steps={activeRoute}
            currentStepIndex={currentStepIndex}
            userPosition={userGpsPosition}
            routePolyline={activeRouteLine}
            alternativePolyline={alternativeCoordinates}
            isOffRoute={isOffRoute}
            onSelectStep={handleMapLandmarkSelect}
            isHighContrast={isHighContrast}
            surfaceHazards={surfaceHazards}
            showSurfaceLayer={showSurfaceLayer}
            followUser={followUser}
            recenterSignal={recenterSignal}
          />
        </div>

        {/* Floating: route state + step counter */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg border-2 ${
              isOffRoute
                ? 'bg-red-600 text-white border-red-300'
                : 'bg-white text-emerald-800 border-emerald-200'
            }`}
          >
            <span
              className={`w-3 h-1.5 rounded-full ${isOffRoute ? 'bg-white' : 'bg-emerald-600'}`}
              aria-hidden="true"
            />
            <span>{isOffRoute ? 'RED line: off route' : 'GREEN line: your route'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-full text-[11px] font-black bg-white/95 text-blue-800 shadow-md border border-blue-100">
            Landmark {currentStepIndex + 1} of {activeRoute.length}
            {routingSource === 'engine' ? ' · live engine' : ' · offline demo route'}
          </div>
        </div>

        {/* Floating controls (48px+ targets, icon + written label) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <MapControlButton
            label="Follow me"
            description="Keep the map centred on you"
            active={followUser}
            onClick={handleRecenter}
            icon={<Crosshair className="w-5 h-5" />}
          />
          <MapControlButton
            label="Live GPS"
            description={gpsError ? `GPS unavailable: ${gpsError}` : 'Use this phone’s real GPS'}
            active={enableRealGps}
            onClick={toggleRealGps}
            icon={<Satellite className="w-5 h-5" />}
            tone={isGpsTracking ? 'emerald' : 'blue'}
          />
          <MapControlButton
            label="Calm route"
            description="Quieter pathway, fewer crossings"
            active={calmMode}
            onClick={toggleCalmMode}
            icon={<Leaf className="w-5 h-5" />}
            tone="emerald"
          />
        </div>

        {/* Floating legend: colour names are always written out, never numbers */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5 rounded-2xl bg-white/92 backdrop-blur border border-slate-200 shadow-md">
            <LegendItem color="#16a34a" label="Your route" />
            <LegendItem color="#64748b" label="Alternative" dashed />
            <LegendItem color="#dc2626" label="Off route" />
          </div>
          <button
            onClick={toggleSurfaceLayer}
            className={`pointer-events-auto min-h-[44px] px-2.5 py-1.5 rounded-2xl shadow-md border flex flex-col items-center justify-center gap-0.5 transition-colors ${
              showSurfaceLayer
                ? 'bg-white text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-500 border-slate-300'
            }`}
            aria-pressed={showSurfaceLayer}
            aria-label={
              showSurfaceLayer
                ? 'Hide surface hazard markers on the map'
                : 'Show surface hazard markers on the map'
            }
          >
            <Trees className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-wide">Hazards</span>
          </button>
        </div>
      </section>

      {/* =========================================================
          LANDMARK CARD — bottom ~55% of the screen (primary instruction)
          ========================================================= */}
      <section
        className={`relative flex-[55] min-h-0 flex flex-col -mt-6 rounded-t-[32px] z-10 border-t ${
          isHighContrast
            ? 'bg-zinc-950 border-yellow-400 text-white'
            : 'bg-white border-slate-100 shadow-[0_-10px_28px_rgba(15,23,42,0.16)]'
        }`}
        aria-label="Landmark instruction card"
      >
        {/* Grab handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden="true">
          <div
            className={`h-1.5 w-12 rounded-full ${isHighContrast ? 'bg-yellow-400' : 'bg-slate-300'}`}
          />
        </div>

        {/* Hero landmark instruction (tap to collect) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-1">
          <div
            onClick={handleCardTapToCollect}
            className={`relative w-full rounded-3xl p-4 transition-all cursor-pointer select-none overflow-hidden shadow-sm border-2 ${
              isHighContrast
                ? 'bg-zinc-900 border-yellow-400'
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}
            style={{ borderTopColor: currentStep.colorHex, borderTopWidth: '8px' }}
            role="button"
            tabIndex={0}
            aria-label={`Current step: ${currentStep.turnText}. ${currentStep.text} Look for the ${currentStep.colorName} ${currentStep.landmarkName}. Tap to collect this landmark for ten explorer points.`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0"
                  style={{ backgroundColor: currentStep.colorHex }}
                  aria-hidden="true"
                >
                  {renderTurnArrow()}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                    {currentStep.turnText}
                  </span>
                  <h2 className="text-xl font-black leading-tight text-slate-900 truncate">
                    {currentStep.landmarkName}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-600">
                    <span
                      className="w-3 h-3 rounded-full border border-white shadow"
                      style={{ backgroundColor: currentStep.colorHex }}
                      aria-hidden="true"
                    />
                    {currentStep.colorName} landmark
                  </span>
                </div>
              </div>

              {/* Collection status pill */}
              <div
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 border ${
                  isCollected
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <span>{isCollected ? '✓ Seen' : '⭐ +10 pts'}</span>
              </div>
            </div>

            {/* The instruction itself — landmarks, never numbers */}
            <p className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900">
              {currentStep.text}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-slate-600">{currentStep.subText}</p>

            {/* Visual landmark reference */}
            <div className="mt-3 w-full h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={currentStep.photoPlaceholder}
                alt={`Illustration of the ${currentStep.colorName} ${currentStep.landmarkName}`}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <p className="mt-2 text-[11px] font-bold text-slate-500">{currentStep.detailHint}</p>

            {/* Collector confetti overlay */}
            {collectedCelebration && (
              <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white p-4 text-center z-20 animate-in fade-in zoom-in duration-300">
                <Sparkles className="w-12 h-12 mb-2" />
                <h3 className="text-2xl font-black">LANDMARK COLLECTED!</h3>
                <p className="text-sm font-bold mt-1">+10 Explorer Points Awarded</p>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-between px-1 py-2.5" aria-label={`Step ${currentStepIndex + 1} of ${activeRoute.length}`}>
            <div className="flex items-center gap-1.5">
              {activeRoute.map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex
                      ? 'w-7 bg-blue-600'
                      : i < currentStepIndex
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-black text-slate-500">
              Tap a map pin to jump to that landmark
            </span>
          </div>

          {/* Nearby ground hazards — described in words, no numbers */}
          {showSurfaceLayer && nearbyHazards.length > 0 && (
            <div className="pb-2 space-y-1.5">
              {nearbyHazards.map((hazard) => (
                <div
                  key={hazard.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200"
                >
                  <span className="text-lg" aria-hidden="true">
                    {HAZARD_EMOJI[hazard.type] || '⚠️'}
                  </span>
                  <span className="text-xs font-extrabold text-amber-900 leading-tight">
                    Underfoot: {hazard.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary navigation controls (48px+ touch targets) */}
        <div className="shrink-0 px-4 pt-1 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={prevStep}
              disabled={isFirstStep}
              className={`min-h-[56px] rounded-2xl font-black text-sm border-2 flex items-center justify-center gap-2 transition-all ${
                isFirstStep
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 active:scale-95'
              }`}
              aria-label="Previous landmark step"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3]" />
              <span>PREVIOUS</span>
            </button>

            <button
              onClick={nextStep}
              className={`min-h-[56px] rounded-2xl font-black text-sm border-2 flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg ${
                isLastStep
                  ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  : isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300'
                  : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
              }`}
              aria-label={isLastStep ? 'Finish walking journey' : 'Next landmark step'}
            >
              <span>{isLastStep ? 'FINISHED!' : 'NEXT STEP'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Assistive tools + hands-free simulation */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setRadarOpen(true)}
              className="min-h-[52px] px-2 py-2 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[11px] flex flex-col items-center justify-center text-center gap-0.5 transition-transform active:scale-95"
              aria-label="Open I am lost compass radar"
            >
              <Compass className="w-5 h-5 text-amber-700" />
              <span>&quot;I&apos;m Lost&quot;</span>
            </button>

            <button
              onClick={() => setFlashbackOpen(true)}
              className="min-h-[52px] px-2 py-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-[11px] flex flex-col items-center justify-center text-center gap-0.5 transition-transform active:scale-95"
              aria-label="Replay breadcrumb flashback"
            >
              <History className="w-5 h-5 text-indigo-700" />
              <span>Flashback</span>
            </button>

            <button
              onClick={toggleSimulateWalking}
              className={`min-h-[52px] px-2 py-2 rounded-2xl border-2 font-extrabold text-[11px] flex flex-col items-center justify-center text-center gap-0.5 transition-all ${
                isWalkingSimulated
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              aria-pressed={isWalkingSimulated}
              aria-label={
                isWalkingSimulated
                  ? 'Stop the simulated walking. Your step advances automatically.'
                  : 'Simulate walking. Your step advances automatically every few seconds.'
              }
            >
              {isWalkingSimulated ? (
                <>
                  <Pause className="w-5 h-5 text-emerald-700" />
                  <span>Auto: ON</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-slate-600" />
                  <span>Simulate Walk</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Speak again */}
            <button
              onClick={speakCurrentInstruction}
              className="min-h-[48px] px-3 py-2 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
              aria-label="Repeat the spoken landmark instruction"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>SPEAK AGAIN</span>
            </button>

            {/* End walk */}
            <button
              onClick={stopNavigation}
              className="min-h-[48px] px-3 py-2 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Cancel the walk and return to the home screen"
            >
              <MapPin className="w-4 h-4" />
              <span>END WALK</span>
            </button>
          </div>

          {/* Key Demo Moment: Simulate Off-Route */}
          <button
            onClick={isOffRoute ? resolveOffRoute : triggerOffRoute}
            className={`w-full min-h-[48px] px-3 py-2 rounded-2xl border-2 font-black text-[11px] flex items-center justify-center gap-2 transition-all ${
              isOffRoute
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
            }`}
            aria-label={
              isOffRoute
                ? 'Resolve the demo off-route alert and return to the route'
                : 'Demo only: simulate walking off the route, which alerts your caregiver'
            }
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>{isOffRoute ? 'BACK ON ROUTE' : 'DEMO: SIMULATE OFF-ROUTE'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Floating map control (icon + written label, 48px+ target)           */
/* ------------------------------------------------------------------ */
const MapControlButton: React.FC<{
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone?: 'blue' | 'emerald';
}> = ({ label, description, active, onClick, icon, tone = 'blue' }) => {
  const activeClasses =
    tone === 'emerald'
      ? 'bg-emerald-600 text-white border-emerald-400'
      : 'bg-blue-600 text-white border-blue-400';
  const idleClasses = 'bg-white text-slate-700 border-slate-200';

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={description}
      title={description}
      className={`min-h-[52px] min-w-[52px] px-2 py-1.5 rounded-2xl border shadow-lg flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
        active ? activeClasses : idleClasses
      }`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-wide leading-none">{label}</span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Legend chip: colour is always named in words                        */
/* ------------------------------------------------------------------ */
const LegendItem: React.FC<{ color: string; label: string; dashed?: boolean }> = ({
  color,
  label,
  dashed = false,
}) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
    <span
      className="w-5 h-1 rounded-full"
      style={
        dashed
          ? {
              backgroundColor: 'transparent',
              backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`,
            }
          : { backgroundColor: color }
      }
      aria-hidden="true"
    />
    {label}
  </span>
);