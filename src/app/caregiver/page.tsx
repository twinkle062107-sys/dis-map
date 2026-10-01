'use client';

import React from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { RouteStrip } from '@/components/RouteStrip';
import Link from 'next/link';
import {
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Clock,
  ShieldAlert,
  MapPin,
  RefreshCw,
  BellRing,
  ArrowLeft,
  Volume2,
  Radio,
  Flame,
} from 'lucide-react';
import { speakText } from '@/utils/speech';

export default function CaregiverPage() {
  const {
    activeRoute,
    currentStepIndex,
    currentStep,
    status,
    alerts,
    resolveOffRoute,
    collectedLandmarks,
    score,
    isNavigating,
    resetAll,
    isHighContrast,
  } = useNavigation();

  const handleSendPing = () => {
    speakText('Caregiver check-in ping: Are you doing alright on your walk?');
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'off_route':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 text-white font-black text-sm shadow-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>OFF ROUTE (DEVIATION DETECTED)</span>
          </div>
        );
      case 'stopped':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>WALK STOPPED / PAUSED</span>
          </div>
        );
      case 'on_route':
      default:
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>ON ROUTE (SAFE & MOVING)</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Caregiver Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Caregiver Guardian Portal
            </h1>
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Real-Time Broadcast Sync Active</span>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>User App</span>
        </Link>
      </div>

      {/* Demo Multi-tab notice banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 shadow-sm">
        <span className="text-base">💡</span>
        <div>
          <span className="font-extrabold">Hackathon Demo Tip:</span> Keep this tab open alongside the User App tab. Tap{' '}
          <strong className="underline">"Simulate Off-Route"</strong> in the user app to see the instant live warning trigger here!
        </div>
      </div>

      {/* Live Status Hero Section */}
      <div className="rounded-3xl p-5 border-2 bg-white dark:bg-zinc-950 border-slate-200 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase text-slate-700">
              Walker Live Status
            </span>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>

          {status === 'off_route' && (
            <button
              onClick={resolveOffRoute}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Deviation Resolved</span>
            </button>
          )}
        </div>

        {/* Current Landmark Context */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow"
              style={{ backgroundColor: currentStep.colorHex }}
            >
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Current Position</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {currentStep.landmarkName}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                Landmark Color: {currentStep.colorName} • {currentStep.timeAgoLabel}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
              ⭐ {score} pts ({collectedLandmarks.length}/6)
            </span>
          </div>
        </div>

        {/* Live Route Strip */}
        <div className="pt-1">
          <RouteStrip
            steps={activeRoute}
            currentStepIndex={currentStepIndex}
            isHighContrast={isHighContrast}
          />
        </div>

        {/* Quick Guardian Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => (window.location.href = 'tel:112')}
            className="min-h-[50px] rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-extrabold text-xs flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Walker (Demo)</span>
          </button>

          <button
            onClick={handleSendPing}
            className="min-h-[50px] rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Send Check-in Voice Ping</span>
          </button>
        </div>
      </div>

      {/* Alert Feed Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Live Alert Activity Feed ({alerts.length})
            </h2>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={resetAll}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 text-center text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <p className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">
              All quiet and safe
            </p>
            <p className="text-xs">No deviations or SOS alerts logged yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-3 shadow-sm transition-all ${
                  alert.type === 'off_route'
                    ? 'bg-red-50 border-red-300 text-red-950 dark:bg-red-950/40 dark:text-red-200'
                    : alert.type === 'safe_haven'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'
                    : 'bg-white border-slate-200 text-slate-900 dark:bg-zinc-900 dark:text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      alert.type === 'off_route'
                        ? 'bg-red-600 text-white'
                        : alert.type === 'safe_haven'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {alert.type === 'off_route' ? (
                      <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    ) : alert.type === 'safe_haven' ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">{alert.message}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                      Near: {alert.landmarkContext} • {alert.timestamp}
                    </p>
                  </div>
                </div>

                {!alert.resolved && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white">
                    ACTIVE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
