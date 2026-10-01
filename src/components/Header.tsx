'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import { Compass, Eye, Volume2, VolumeX, Shield, HeartHandshake, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isHighContrast,
    toggleHighContrast,
    isVoiceMuted,
    toggleVoiceMute,
    score,
    unlockedBadges,
    status,
    isNavigating,
    stopNavigation,
  } = useNavigation();

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors border-b ${
        isHighContrast
          ? 'bg-black border-yellow-400 text-yellow-400'
          : 'bg-white/95 backdrop-blur border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-blue-500 rounded-lg p-1"
          aria-label="MemoryBridge Home"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${
              isHighContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
            }`}
          >
            <Compass className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-extrabold text-lg leading-tight tracking-tight flex items-center gap-1.5">
              <span>MemoryBridge</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-yellow-300">
              Landmark Walking
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Badge & Points Chip */}
          {score > 0 && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-2 border-white'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title={`${unlockedBadges.length} badges unlocked!`}
            >
              <span>⭐</span>
              <span>{score} pts</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleVoiceMute}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isHighContrast
                ? 'border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black'
                : isVoiceMuted
                ? 'border-slate-300 bg-slate-100 text-slate-400 hover:bg-slate-200'
                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
            aria-label={isVoiceMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
            title={isVoiceMuted ? 'Unmute Voice' : 'Mute Voice'}
          >
            {isVoiceMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* High Contrast Mode Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isHighContrast
                ? 'border-yellow-400 bg-yellow-400 text-black font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            title="High Contrast Theme"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Caregiver Portal Link */}
          <Link
            href="/caregiver"
            className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
              isHighContrast
                ? 'border-yellow-400 bg-black text-yellow-400'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title="Caregiver Live View"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Caregiver</span>
          </Link>

          {/* Community Spotter Link */}
          <Link
            href="/spotter"
            className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
              isHighContrast
                ? 'border-yellow-400 bg-black text-yellow-400'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title="Community Spotters"
          >
            <span className="text-purple-600 font-black">📍</span>
            <span className="hidden sm:inline">Spotter</span>
          </Link>
        </div>
      </div>

      {/* Off-Route Alert Banner if Active */}
      {status === 'off_route' && isNavigating && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold animate-pulse flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>OFF DESIGNATED ROUTE — Tap "I am lost" or "Safe Haven"</span>
        </div>
      )}
    </header>
  );
};
