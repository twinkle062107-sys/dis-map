'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CommunitySpotterEntry } from '@/types/navigation';
import { SEED_SPOTTERS } from '@/data/demo';
import {
  Users,
  Camera,
  Upload,
  Plus,
  ThumbsUp,
  Sparkles,
  MapPin,
  Trophy,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const LOCAL_STORAGE_SPOTTERS_KEY = 'memorybridge_community_spotters_v1';

const COLOR_PRESETS = [
  { name: 'Turquoise Blue', hex: '#06b6d4' },
  { name: 'Lavender Purple', hex: '#9333ea' },
  { name: 'Golden Yellow', hex: '#eab308' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Tangerine Orange', hex: '#ea580c' },
];

export default function SpotterPage() {
  const [entries, setEntries] = useState<CommunitySpotterEntry[]>([]);
  const [landmarkName, setLandmarkName] = useState('');
  const [colorName, setColorName] = useState('Turquoise Blue');
  const [colorHex, setColorHex] = useState('#06b6d4');
  const [statusText, setStatusText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('/landmarks/bike-rack.svg');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Load from localStorage or initialize with SEED_SPOTTERS
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SPOTTERS_KEY);
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        setEntries(SEED_SPOTTERS);
        localStorage.setItem(LOCAL_STORAGE_SPOTTERS_KEY, JSON.stringify(SEED_SPOTTERS));
      }
    } catch {
      setEntries(SEED_SPOTTERS);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!landmarkName.trim() || !statusText.trim()) return;

    const newEntry: CommunitySpotterEntry = {
      id: 'spot-' + Date.now(),
      landmarkName: landmarkName.trim(),
      colorName,
      colorHex,
      statusText: statusText.trim(),
      photoUrl: photoPreview,
      submittedBy: 'You (Local Spotter)',
      submittedAt: 'Just now',
      upvotes: 1,
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SPOTTERS_KEY, JSON.stringify(updated));
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: [colorHex, '#22c55e', '#3b82f6'],
      });
    } catch {
      // ignore
    }

    setSubmittedSuccess(true);
    setLandmarkName('');
    setStatusText('');
    setTimeout(() => setSubmittedSuccess(false), 4000);
  };

  const handleUpvote = (id: string) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, upvotes: entry.upvotes + 1 } : entry
    );
    setEntries(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SPOTTERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Community Landmark Spotters
            </h1>
            <p className="text-xs font-bold text-slate-500">
              Crowdsourcing vibrant color landmarks for safe walking
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

      {/* Submission Form Card */}
      <div className="rounded-3xl p-5 border-2 bg-white dark:bg-zinc-950 border-purple-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Spot & Register a New Landmark
            </h2>
          </div>
          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300">
            +15 Volunteer Pts
          </span>
        </div>

        {submittedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Landmark added to community database and leaderboard!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Landmark Name */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300 mb-1">
              Landmark Name & Type
            </label>
            <input
              type="text"
              required
              value={landmarkName}
              onChange={(e) => setLandmarkName(e.target.value)}
              placeholder="e.g. Bright Turquoise Bicycle Stand, Red Fire Hydrant"
              className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Color Name & Swatch Picker */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300 mb-1.5">
              Landmark Color & Tone
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setColorName(preset.name);
                    setColorHex(preset.hex);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    colorName === preset.name
                      ? 'border-black dark:border-white ring-2 ring-purple-400 bg-slate-100 dark:bg-zinc-800'
                      : 'border-slate-200 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Notes */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300 mb-1">
              Visibility Status & Walking Notes
            </label>
            <input
              type="text"
              required
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="e.g. Clear visibility opposite corner, well-lit at night"
              className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-zinc-300 mb-1.5">
              Photo / Visual Representation
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0">
                <img
                  src={photoPreview}
                  alt="Landmark preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5">
                <label className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload an image from your device or camera
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full min-h-[54px] rounded-2xl font-black text-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>REGISTER LANDMARK TO COMMUNITY DIRECTORY</span>
          </button>
        </form>
      </div>

      {/* Spotter Leaderboard & Verified Landmarks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Community Spotter Leaderboard
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {entries.length} Verified Landmarks
          </span>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-2xl p-4 border bg-white dark:bg-zinc-950 border-slate-200 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {/* Ranking Rank */}
                <span className="w-6 text-center font-black text-sm text-slate-400">
                  #{index + 1}
                </span>

                {/* Photo */}
                <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  <img
                    src={entry.photoUrl}
                    alt={entry.landmarkName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {entry.landmarkName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.colorHex }}
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                      {entry.colorName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    "{entry.statusText}"
                  </p>
                  <p className="text-[10px] text-purple-700 font-bold mt-1">
                    By {entry.submittedBy} • {entry.submittedAt}
                  </p>
                </div>
              </div>

              {/* Upvote Button */}
              <button
                onClick={() => handleUpvote(entry.id)}
                className="min-h-[44px] min-w-[50px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-purple-50 text-purple-700 flex flex-col items-center justify-center font-black text-xs transition-colors"
                title="Upvote helpful landmark"
              >
                <ThumbsUp className="w-4 h-4 mb-0.5" />
                <span>{entry.upvotes}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
