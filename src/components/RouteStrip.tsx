'use client';

import React from 'react';
import { RouteStep } from '@/types/navigation';
import {
  Train,
  Building2,
  CreditCard,
  Pizza,
  Store,
  Coffee,
  Check,
  MapPin,
  Footprints,
} from 'lucide-react';

interface RouteStripProps {
  steps: RouteStep[];
  currentStepIndex: number;
  onStepSelect?: (index: number) => void;
  isHighContrast?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Train,
  Building2,
  CreditCard,
  Pizza,
  Store,
  Coffee,
};

export const RouteStrip: React.FC<RouteStripProps> = ({
  steps,
  currentStepIndex,
  onStepSelect,
  isHighContrast = false,
}) => {
  return (
    <div
      className={`w-full rounded-2xl p-4 transition-all shadow-sm ${
        isHighContrast
          ? 'bg-zinc-950 border-2 border-yellow-400 text-yellow-300'
          : 'bg-white border border-slate-200'
      }`}
      aria-label="Route strip map"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
          Visual Route Strip
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Stylized SVG Map Strip */}
      <div className="relative py-2 overflow-x-auto scrollbar-none">
        <div className="min-w-[340px] flex items-center justify-between relative px-2">
          {/* Background Connecting Line */}
          <div
            className={`absolute left-6 right-6 top-6 h-2 -translate-y-1/2 rounded-full transition-all ${
              isHighContrast ? 'bg-zinc-800' : 'bg-slate-200'
            }`}
          />

          {/* Active Progress Completed Line */}
          <div
            className="absolute left-6 top-6 h-2 -translate-y-1/2 rounded-full transition-all duration-500 bg-emerald-500"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 88}%`,
            }}
          />

          {/* Landmark Step Nodes */}
          {steps.map((step, idx) => {
            const IconComponent = ICON_MAP[step.iconName] || MapPin;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={step.id}
                onClick={() => onStepSelect && onStepSelect(idx)}
                className={`relative z-10 flex flex-col items-center group transition-transform focus:outline-none focus:scale-110 ${
                  isCurrent ? 'scale-110' : 'hover:scale-105'
                }`}
                aria-label={`Step ${idx + 1}: ${step.landmarkName}${isCurrent ? ' (Current)' : ''}`}
              >
                {/* Node Circle */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all relative ${
                    isCurrent
                      ? isHighContrast
                        ? 'bg-yellow-400 border-white text-black ring-4 ring-yellow-300/60 shadow-lg'
                        : 'bg-blue-600 border-white text-white ring-4 ring-blue-300 shadow-md animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-500 border-white text-white'
                      : isHighContrast
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-400'
                      : 'bg-slate-100 border-slate-300 text-slate-400'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? step.colorHex : undefined,
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}

                  {/* Pulsing Dot on Current */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                    </span>
                  )}
                </div>

                {/* Color Swatch Dot */}
                <div
                  className="w-3.5 h-3.5 rounded-full mt-1.5 border border-white shadow-sm"
                  style={{ backgroundColor: step.colorHex }}
                  title={step.colorName}
                />

                {/* Landmark Label */}
                <span
                  className={`text-[10px] font-bold mt-1 text-center max-w-[55px] truncate ${
                    isCurrent
                      ? isHighContrast
                        ? 'text-yellow-300 font-extrabold underline'
                        : 'text-blue-700 font-extrabold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.landmarkName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
