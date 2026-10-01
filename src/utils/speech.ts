import { DEMO_DESTINATIONS } from '@/data/demo';

export function speakText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower, calm and very clear
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    // Try selecting a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function matchDestination(input: string) {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return DEMO_DESTINATIONS[0];

  // Direct phrase match
  for (const dest of DEMO_DESTINATIONS) {
    for (const phrase of dest.matchPhrases) {
      if (normalized.includes(phrase) || phrase.includes(normalized)) {
        return dest;
      }
    }
  }

  // Token overlap check
  const inputWords = normalized.split(/\s+/);
  let bestDest = DEMO_DESTINATIONS[0];
  let highestScore = 0;

  for (const dest of DEMO_DESTINATIONS) {
    let score = 0;
    for (const phrase of dest.matchPhrases) {
      const phraseWords = phrase.split(/\s+/);
      const overlap = inputWords.filter((w) => phraseWords.includes(w)).length;
      if (overlap > score) {
        score = overlap;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestDest = dest;
    }
  }

  return highestScore > 0 ? bestDest : DEMO_DESTINATIONS[0];
}
