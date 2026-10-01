'use client';

import React, { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { SAFE_HAVENS } from '@/data/demo';
import { SafeHaven } from '@/types/navigation';
import {
  ShieldAlert,
  PhoneCall,
  BellRing,
  X,
  Cross,
  ShieldCheck,
  Building,
  HeartPulse,
  Heart,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { speakText } from '@/utils/speech';

const HAVEN_ICONS: Record<string, React.ElementType> = {
  Cross,
  ShieldCheck,
  Building,
  HeartPulse,
};

export const SafeHavenModal: React.FC = () => {
  const {
    isSafeHavenOpen,
    setSafeHavenOpen,
    currentStepIndex,
    isHighContrast,
    sendCaregiverAlert,
    isVoiceMuted,
  } = useNavigation();

  // Pick nearest safe haven relative to route progress
  const defaultHavenIndex = Math.min(
    Math.floor((currentStepIndex / 6) * SAFE_HAVENS.length),
    SAFE_HAVENS.length - 1
  );

  const [selectedHavenIdx, setSelectedHavenIdx] = useState<number>(defaultHavenIndex);
  const [alertSent, setAlertSent] = useState<boolean>(false);

  const activeHaven: SafeHaven = SAFE_HAVENS[selectedHavenIdx] || SAFE_HAVENS[0];
  const ActiveIcon = HAVEN_ICONS[activeHaven.iconName] || ShieldCheck;

  const handleAlertCaregiver = () => {
    sendCaregiverAlert(
      'safe_haven',
      `User requested Safe Haven assistance near ${activeHaven.name}!`,
      'high'
    );
    setAlertSent(true);

    if (!isVoiceMuted) {
      speakText(`Your caregiver has been notified of your location near ${activeHaven.name}. Help is on the way.`);
    }

    setTimeout(() => {
      setAlertSent(false);
    }, 8000);
  };

  const handleCallEmergency = () => {
    sendCaregiverAlert(
      'sos',
      `Emergency call initiated from Safe Haven screen near ${activeHaven.name}.`,
      'critical'
    );
    window.location.href = `tel:${activeHaven.phone}`;
  };

  return (
    <>
      {/* Floating Red Safe Haven Trigger Button (Always Visible) */}
      {!isSafeHavenOpen && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => {
              setSelectedHavenIdx(defaultHavenIndex);
              setSafeHavenOpen(true);
              if (!isVoiceMuted) {
                speakText(`Safe Haven opened. Nearest shelter is ${activeHaven.name}. ${activeHaven.landmarkDirection}`);
              }
            }}
            className={`min-h-[56px] px-5 py-3.5 rounded-full font-black text-base shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border-2 ${
              isHighContrast
                ? 'bg-red-600 border-white text-white'
                : 'bg-red-600 hover:bg-red-700 border-red-300 text-white ring-4 ring-red-200'
            }`}
            aria-label="Open Safe Haven and emergency help"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span>SAFE HAVEN</span>
          </button>
        </div>
      )}

      {/* Full-Screen Calm Modal */}
      {isSafeHavenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Safe Haven calming shelter panel"
          className={`fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between transition-colors ${
            isHighContrast
              ? 'bg-black text-white'
              : 'bg-emerald-950/95 text-slate-100 backdrop-blur-md'
          }`}
        >
          <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between pb-8">
            {/* Top Calm Bar */}
            <div className="flex items-center justify-between pt-2 pb-4 border-b border-emerald-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Heart className="w-6 h-6 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Safe Haven Mode</h2>
                  <p className="text-xs text-emerald-300 font-semibold">
                    Take a slow breath. You are safe.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSafeHavenOpen(false)}
                className="min-h-[48px] min-w-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Close Safe Haven and return"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Haven Switcher Chips */}
            <div className="my-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SAFE_HAVENS.map((haven, idx) => (
                <button
                  key={haven.id}
                  onClick={() => setSelectedHavenIdx(idx)}
                  className={`min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition-all ${
                    selectedHavenIdx === idx
                      ? 'bg-white text-emerald-950 border-white shadow-lg'
                      : 'bg-emerald-900/40 text-emerald-200 border-emerald-700/60 hover:bg-emerald-800/50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: haven.colorHex }}
                  />
                  <span>{haven.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Nearest Safe Haven Hero Card */}
            <div
              className={`rounded-3xl p-5 border-2 shadow-2xl my-auto transition-all ${
                isHighContrast
                  ? 'bg-zinc-900 border-yellow-400 text-white'
                  : 'bg-emerald-900/60 border-emerald-400/40 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Nearest Safe Haven
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  {activeHaven.openHours}
                </span>
              </div>

              <div className="flex items-start gap-3 my-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
                  style={{ backgroundColor: activeHaven.colorHex }}
                >
                  <ActiveIcon className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold leading-snug">{activeHaven.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: activeHaven.colorHex }}
                    />
                    <span className="text-xs font-bold text-emerald-200">
                      Look for: {activeHaven.colorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Landmark Direction Instruction */}
              <div className="mt-4 p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Landmark Directions
                </p>
                <p className="text-lg font-bold leading-relaxed text-yellow-300">
                  {activeHaven.landmarkDirection}
                </p>
                <p className="text-xs font-medium text-emerald-200">
                  Relative location: {activeHaven.distanceDescription}
                </p>
                <p className="text-xs text-slate-300 italic pt-1">
                  "{activeHaven.instruction}"
                </p>
              </div>
            </div>

            {/* Big Action Buttons (56px+ touch target) */}
            <div className="space-y-3 pt-4">
              {/* Alert Caregiver Button */}
              <button
                onClick={handleAlertCaregiver}
                disabled={alertSent}
                className={`w-full min-h-[58px] px-6 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl border-2 ${
                  alertSent
                    ? 'bg-emerald-600 border-white text-white'
                    : isHighContrast
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 border-emerald-300'
                }`}
              >
                <BellRing className="w-6 h-6 stroke-[2.5]" />
                <span>
                  {alertSent ? '✓ CAREGIVER ALERTED WITH LOCATION' : 'ALERT MY CAREGIVER'}
                </span>
              </button>

              {/* Call 112 Emergency Button */}
              <button
                onClick={handleCallEmergency}
                className="w-full min-h-[58px] px-6 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl bg-red-600 hover:bg-red-700 text-white border-2 border-red-400"
              >
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                <span>CALL EMERGENCY (112)</span>
              </button>

              {/* Return Button */}
              <button
                onClick={() => setSafeHavenOpen(false)}
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-2"
              >
                <span>I feel safe now, return to route</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
