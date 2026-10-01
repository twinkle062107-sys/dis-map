'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { matchDestination, speakText, stopSpeaking } from '@/utils/speech';
import { DEMO_DESTINATIONS } from '@/data/demo';
import { Mic, MicOff, Search, Check, X, Sparkles, Volume2 } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const { startNavigation, isHighContrast, isVoiceMuted } = useNavigation();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [candidateDestination, setCandidateDestination] = useState<typeof DEMO_DESTINATIONS[0] | null>(null);
  const [hasConfirmedQuestion, setHasConfirmedQuestion] = useState<boolean>(false);
  const [micSupported, setMicSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setCandidateDestination(null);
      setHasConfirmedQuestion(false);
      return;
    }

    if (initialQuery) {
      handleMatchQuery(initialQuery);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
        if (event.results[0].isFinal) {
          handleMatchQuery(text);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      setMicSupported(false);
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, initialQuery]);

  const handleMatchQuery = (queryText: string) => {
    const matched = matchDestination(queryText);
    setCandidateDestination(matched);
    setHasConfirmedQuestion(true);
    setIsListening(false);

    if (!isVoiceMuted) {
      speakText(`Did you mean: ${matched.name}?`);
    }
  };

  const handleStartWalk = () => {
    if (candidateDestination) {
      startNavigation(candidateDestination.id);
      onClose();
    }
  };

  const handleRejectCandidate = () => {
    stopSpeaking();
    setCandidateDestination(null);
    setHasConfirmedQuestion(false);
    setTranscript('');
    setTypedInput('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice search modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 transition-all ${
          isHighContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white text-slate-900 border-blue-200'
        }`}
      >
        {/* Close Button Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-lg">Voice Destination</h3>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            aria-label="Close voice search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Confirmation Stage */}
        {hasConfirmedQuestion && candidateDestination ? (
          <div className="py-6 space-y-6 text-center">
            <div className="inline-block p-4 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-900">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                Destination Matched
              </span>
              <h4 className="text-2xl font-black mt-1 leading-snug">
                {candidateDestination.name}
              </h4>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: candidateDestination.colorHex }}
                />
                <span className="text-xs font-bold text-amber-800">
                  Landmark Color: {candidateDestination.colorName}
                </span>
              </div>
            </div>

            <p className="text-lg font-bold text-slate-700 dark:text-zinc-200">
              Would you like landmark directions to this place?
            </p>

            {/* Huge YES / NO Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleRejectCandidate}
                className="min-h-[58px] rounded-2xl font-black text-base border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2"
              >
                <X className="w-6 h-6 stroke-[3]" />
                <span>NO, RETRY</span>
              </button>

              <button
                onClick={handleStartWalk}
                className={`min-h-[58px] rounded-2xl font-black text-base border-2 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                  isHighContrast
                    ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300'
                    : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                }`}
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>YES, START</span>
              </button>
            </div>
          </div>
        ) : (
          /* Listening / Input Stage */
          <div className="py-5 space-y-5 text-center">
            {/* Animated Mic Ring */}
            <div className="flex justify-center py-2">
              <div className="relative">
                {isListening && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                )}
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl ${
                    isListening ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-12 h-12 stroke-[2.5]" />
                  ) : (
                    <MicOff className="w-10 h-10" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xl font-black text-slate-800 dark:text-white">
                {isListening ? 'Listening for your destination...' : 'Say your destination'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Say: "Cafe Aroma" or "the new cafe near the market"
              </p>
            </div>

            {/* Transcript Preview */}
            {transcript && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm">
                "{transcript}"
              </div>
            )}

            {/* Typed Fallback Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typedInput.trim()) {
                  handleMatchQuery(typedInput);
                }
              }}
              className="pt-1 flex gap-2"
            >
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type destination here..."
                className="flex-1 min-h-[48px] px-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="min-h-[48px] px-4 rounded-xl font-bold bg-blue-600 text-white flex items-center justify-center"
              >
                Go
              </button>
            </form>

            {/* Stage Demo Quick Tap Phrases */}
            <div className="pt-2 text-left">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Stage fallback chips (tap to test):
              </span>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {[
                  'the new cafe near the market',
                  "red Domino's pizza sign",
                  'Metro station Gate 2',
                ].map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => handleMatchQuery(phrase)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between"
                  >
                    <span>"{phrase}"</span>
                    <span className="text-[10px] text-blue-600 font-black uppercase">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
