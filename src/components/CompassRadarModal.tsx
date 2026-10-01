'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { RADAR_LANDMARKS } from '@/data/demo';
import { RadarLandmark } from '@/types/navigation';
import { speakText } from '@/utils/speech';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Check,
  X,
  MapPin,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const CompassRadarModal: React.FC = () => {
  const {
    isRadarOpen,
    setRadarOpen,
    jumpToStep,
    setSafeHavenOpen,
    isHighContrast,
    isVoiceMuted,
  } = useNavigation();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [isUsingRealCompass, setIsUsingRealCompass] = useState<boolean>(false);
  const [isReanchored, setIsReanchored] = useState<boolean>(false);
  const [reanchorSuccessText, setReanchorSuccessText] = useState<string>('');

  const currentItem: RadarLandmark = RADAR_LANDMARKS[currentIndex] || RADAR_LANDMARKS[0];

  // Device orientation listener with fallback
  useEffect(() => {
    if (!isRadarOpen) {
      setIsReanchored(false);
      setCurrentIndex(0);
      return;
    }

    // Speak initial question
    if (!isVoiceMuted) {
      speakText(`${currentItem.question}`);
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setIsUsingRealCompass(true);
        setHeading(Math.round(e.alpha));
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [isRadarOpen, currentIndex, isVoiceMuted, currentItem.question]);

  // Target needle angle based on direction
  const getDirectionAngle = (dir: RadarLandmark['direction']) => {
    switch (dir) {
      case 'left':
        return 270;
      case 'right':
        return 90;
      case 'behind':
        return 180;
      case 'straight':
      default:
        return 0;
    }
  };

  const handleYesFound = () => {
    setIsReanchored(true);
    setReanchorSuccessText(`Position verified at ${currentItem.landmarkName}!`);

    if (!isVoiceMuted) {
      speakText(`Great job! Position confirmed at ${currentItem.landmarkName}. Resuming your route.`);
    }

    setTimeout(() => {
      jumpToStep(currentItem.stepIndex);
      setIsReanchored(false);
      setRadarOpen(false);
    }, 2200);
  };

  const handleNoNotFound = () => {
    if (currentIndex < RADAR_LANDMARKS.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (!isVoiceMuted) {
        speakText(RADAR_LANDMARKS[nextIdx].question);
      }
    } else {
      // Reached end of radar choices
      setCurrentIndex(0);
      if (!isVoiceMuted) {
        speakText('No landmarks spotted? You can rest safely at the nearest Safe Haven.');
      }
    }
  };

  if (!isRadarOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compass radar I am lost assistance"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 transition-all ${
          isHighContrast
            ? 'bg-zinc-950 text-white border-yellow-400'
            : 'bg-white text-slate-900 border-amber-300'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              <Compass className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-lg">Compass Radar</h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Orientation Anchor #{currentIndex + 1} of {RADAR_LANDMARKS.length}
              </p>
            </div>
          </div>

          <button
            onClick={() => setRadarOpen(false)}
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            aria-label="Close compass radar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Re-anchor Success Overlay */}
        {isReanchored ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h4 className="text-2xl font-black text-emerald-600">
              YOU ARE HERE!
            </h4>
            <p className="text-base font-bold text-slate-700 dark:text-zinc-200">
              {reanchorSuccessText}
            </p>
            <p className="text-xs text-slate-500">
              Re-anchoring route back to this landmark...
            </p>
          </div>
        ) : (
          /* Active Question & Compass Dial */
          <div className="py-4 space-y-5 text-center">
            {/* Visual Compass Dial */}
            <div className="relative w-40 h-40 mx-auto rounded-full border-4 border-dashed border-amber-300 flex items-center justify-center bg-amber-50/50 dark:bg-zinc-900">
              {/* Compass Needle */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out"
                style={{
                  transform: `rotate(${getDirectionAngle(currentItem.direction) - heading}deg)`,
                }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[38px] drop-shadow-md"
                    style={{ borderBottomColor: currentItem.colorHex }}
                  />
                  <div className="w-3 h-3 rounded-full bg-slate-800 -my-1.5 z-10" />
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[38px] border-t-slate-400" />
                </div>
              </div>

              {/* Cardinal Labels */}
              <span className="absolute top-1 text-[10px] font-black text-slate-400">N</span>
              <span className="absolute bottom-1 text-[10px] font-black text-slate-400">S</span>
              <span className="absolute left-2 text-[10px] font-black text-slate-400">W</span>
              <span className="absolute right-2 text-[10px] font-black text-slate-400">E</span>
            </div>

            {/* Direction Text Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-zinc-900 border-2 border-amber-200 dark:border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Direction check
              </span>
              <h4 className="text-xl font-black mt-1 leading-snug text-slate-900 dark:text-white">
                "{currentItem.question}"
              </h4>

              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: currentItem.colorHex }}
                />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {currentItem.colorName} • {currentItem.landmarkName}
                </span>
              </div>
            </div>

            {/* YES / NO Action Buttons (56px+ touch target) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleNoNotFound}
                className="min-h-[58px] rounded-2xl font-black text-base border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <X className="w-6 h-6 stroke-[3]" />
                <span>NO, NEXT</span>
              </button>

              <button
                onClick={handleYesFound}
                className={`min-h-[58px] rounded-2xl font-black text-base border-2 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                  isHighContrast
                    ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300'
                    : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                }`}
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>YES, I SEE IT!</span>
              </button>
            </div>

            {/* Still Lost Link to Safe Haven */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setRadarOpen(false);
                  setSafeHavenOpen(true);
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center justify-center gap-1.5 mx-auto p-1"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Still feeling lost? Open Safe Haven shelter</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
