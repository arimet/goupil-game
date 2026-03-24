export function sayLetter(letter: string) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(letter);
  utterance.rate = 0.7;
  utterance.pitch = 1.2;
  utterance.lang = 'fr-FR';
  window.speechSynthesis.speak(utterance);
}

export function sayPhrase(text: string) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  utterance.lang = 'fr-FR';
  window.speechSynthesis.speak(utterance);
}
