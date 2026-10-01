'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { RouteStep } from '@/types/navigation';
import { speakText, stopSpeaking } from '@/utils/speech';
import {
  History,
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const BreadcrumbFlashbackModal: React.FC = () => {
  const {
    isFlashbackOpen,
    setFlashbackOpen,
    activeRoute,
    currentStepIndex,
    isHighContrast,
    isVoiceMuted,
  } = useNavigation();

  // Visited steps up to current step (at least current step)
  const visitedSteps: RouteStep[] = activeRoute.slice(0, currentStepIndex + 1);

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loopCount, setLoopCount] = useState<number>(0);

  // Auto-cycle through visited steps in 5-second loop
  useEffect(() => {
    if (!isFlashbackOpen) {
      setActiveStepIndex(0);
      setIsPlaying(true);
      return;
    }

    const stepDuration = Math.max(1200, Math.floor(5000 / (visitedSteps.length || 1)));

    if (!isVoiceMuted && loopCount === 0) {
      const summary = visitedSteps
        .map((s, idx) =>
          idx === visitedSteps.length - 1
            ? `Now you are here at ${s.landmarkName}.`
            : `${s.timeAgoLabel} you passed ${s.landmarkName}.`
        )
        .join(' ');
      speakText(`Flashback memory loop: ${summary}`);
    }

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < visitedSteps.length - 1) {
          return prev + 1;
        } else {
          setLoopCount((c) => c + 1);
          return 0; // Loop back
        }
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isFlashbackOpen, isPlaying, visitedSteps.length, isVoiceMuted, loopCount]);

  if (!isFlashbackOpen) return null;

  const currentFlashStep = visitedSteps[activeStepIndex] || visitedSteps[0];
  const isNow = activeStepIndex === visitedSteps.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Breadcrumb flashback modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 transition-all ${
          isHighContrast
            ? 'bg-zinc-950 text-white border-yellow-400'
            : 'bg-white text-slate-900 border-indigo-300'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              <History className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg">Breadcrumb Flashback</h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                5-Second Walking Memory Loop
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              setFlashbackOpen(false);
            }}
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            aria-label="Close flashback"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 5-Second Loop Timeline Bar */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-1.5 px-1">
            <span>START OF WALK</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Step {activeStepIndex + 1} of {visitedSteps.length}</span>
            </span>
            <span>NOW</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {visitedSteps.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  idx === activeStepIndex
                    ? 'bg-indigo-600 ring-2 ring-indigo-300 h-2.5 scale-105'
                    : idx < activeStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-zinc-700'
                }`}
                title={step.landmarkName}
              />
            ))}
          </div>
        </div>

        {/* Active Flashback Card */}
        <div
          className={`rounded-3xl p-5 border-2 shadow-lg transition-all ${
            isNow
              ? 'bg-emerald-50 dark:bg-zinc-900 border-emerald-400'
              : 'bg-indigo-50/70 dark:bg-zinc-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isNow
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {isNow ? 'NOW: YOU ARE HERE' : currentFlashStep.timeAgoLabel}
            </span>

            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {currentFlashStep.turnText}
            </span>
          </div>

          {/* Photo Illustration */}
          <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-200 my-2 border border-slate-300">
            <img
              src={currentFlashStep.photoPlaceholder}
              alt={currentFlashStep.landmarkName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentFlashStep.colorHex }}
              />
              <span>{currentFlashStep.colorName}</span>
            </div>
          </div>

          <h4 className="text-xl font-black mt-2 text-slate-900 dark:text-white">
            {currentFlashStep.landmarkName}
          </h4>
          <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 mt-0.5">
            "{currentFlashStep.text}"
          </p>
        </div>

        {/* Playback Controls & Action */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="min-h-[48px] px-4 rounded-xl border border-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-50"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Loop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-indigo-600" />
                <span>Resume 5s Loop</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              setFlashbackOpen(false);
            }}
            className="min-h-[48px] px-6 rounded-xl font-black text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          >
            Got it, Back to Walk
          </button>
        </div>
      </div>
    </div>
  );
};
