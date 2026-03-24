let preferredVoice: SpeechSynthesisVoice | null = null;

function findBestFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer natural-sounding fr-FR voices on macOS
  const preferredNames = ['Thomas', 'Jacques'];
  for (const name of preferredNames) {
    const v = voices.find((v) => v.name === name && v.lang === 'fr-FR');
    if (v) return v;
  }
  // Any fr-FR voice
  const frFR = voices.find((v) => v.lang === 'fr-FR');
  if (frFR) return frFR;
  // Any French voice
  return voices.find((v) => v.lang.startsWith('fr')) ?? null;
}

function getVoice(): SpeechSynthesisVoice | null {
  if (!preferredVoice) {
    preferredVoice = findBestFrenchVoice();
  }
  return preferredVoice;
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    preferredVoice = null; // re-detect on next call
  };
}

export function sayLetter(letter: string) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
  const voice = getVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'fr-FR';
  }
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
