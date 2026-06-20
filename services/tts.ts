import { bcp47 } from '../data';

// Cihazın yerel seslendirme motorunu (Web Speech API) kullanarak
// verilen metni ilgili dilde sesli okur.
export function speak(text: string, code: string, rate = 1): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text.trim()) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = bcp47(code);
  utter.rate = rate;

  // Mümkünse hedef dile en uygun sesi seç.
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
  if (match) utter.voice = match;

  // Önceki konuşmayı kesip yenisini başlat (akıcı sıra için).
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export const ttsSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;
