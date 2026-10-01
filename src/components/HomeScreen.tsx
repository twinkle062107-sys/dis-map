'use client';

import React, { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { DEMO_DESTINATIONS } from '@/data/demo';
import { VoiceSearchModal } from '@/components/VoiceSearchModal';
import {
  Mic,
  Navigation,
  Compass,
  Sparkles,
  MapPin,
  Coffee,
  Pizza,
  Train,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const DESTINATION_ICONS: Record<string, React.ElementType> = {
  Coffee,
  Pizza,
  Train,
};

export const HomeScreen: React.FC = () => {
  const { isHighContrast } = useNavigation();
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [selectedPresetQuery, setSelectedPresetQuery] = useState<string>('');

  const handleOpenVoiceWithPreset = (query: string) => {
    setSelectedPresetQuery(query);
    setIsVoiceOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-80px)] px-4 py-6 max-w-md mx-auto">
      {/* Calm Welcome Header */}
      <div className="w-full text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ZERO NUMERIC DISTANCES • ONLY LANDMARKS</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
          Where would you like to walk today?
        </h1>
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400 max-w-xs mx-auto">
          Clear visual signs, vibrant colors, and calm spoken guidance at every turn.
        </p>
      </div>

      {/* Hero Giant Mic Button "Where to?" */}
      <div className="my-8 flex flex-col items-center">
        <div className="relative group">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse" />

          <button
            onClick={() => {
              setSelectedPresetQuery('');
              setIsVoiceOpen(true);
            }}
            className={`relative min-h-[160px] min-w-[160px] w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-4 focus:outline-none focus:ring-4 focus:ring-blue-400 ${
              isHighContrast
                ? 'bg-yellow-400 border-white text-black ring-4 ring-yellow-200'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 border-white text-white'
            }`}
            aria-label="Tap microphone to speak destination"
          >
            <Mic className="w-16 h-16 stroke-[2.5] mb-2 drop-shadow" />
            <span className="font-black text-xl tracking-tight">"Where to?"</span>
            <span className="text-[11px] font-bold opacity-90 mt-0.5">
              Tap & Speak
            </span>
          </button>
        </div>

        <p className="mt-4 text-xs font-bold text-slate-500 dark:text-zinc-400">
          Microphone or one-tap chips below
        </p>
      </div>

      {/* 3 Example Destination Chips */}
      <div className="w-full space-y-3 pb-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Or choose a destination:
          </span>
          <span className="text-[11px] font-bold text-blue-600">
            Demo Routes
          </span>
        </div>

        <div className="space-y-2.5">
          {DEMO_DESTINATIONS.map((dest) => {
            const Icon = DESTINATION_ICONS[dest.icon] || MapPin;
            return (
              <button
                key={dest.id}
                onClick={() => handleOpenVoiceWithPreset(dest.name)}
                className={`w-full min-h-[58px] p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all hover:scale-[1.02] active:scale-98 shadow-sm ${
                  isHighContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white hover:bg-zinc-800'
                    : 'bg-white border-slate-200 hover:border-blue-400 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow"
                    style={{ backgroundColor: dest.colorHex }}
                  >
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">
                      {dest.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: dest.colorHex }}
                      />
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                        {dest.colorName} landmark
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        initialQuery={selectedPresetQuery}
      />
    </div>
  );
};
