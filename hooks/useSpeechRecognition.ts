import { useCallback, useRef } from 'react';

// Web Speech API tarayıcı tip tanımlarında olmadığından gevşek tipler kullanıyoruz.
type SpeechRecognitionInstance = any;

interface StartHandlers {
  onInterim?: (text: string) => void;        // Konuşma sürerken canlı metin
  onResult: (text: string) => void;          // Bırakınca nihai metin
  onError: (code: string) => void;           // Hata kodu (ör. 'not-allowed')
}

export interface UseSpeechRecognition {
  supported: boolean;
  start: (lang: string, handlers: StartHandlers) => void;
  stop: () => void;
}

// Bas-konuş mantığı: start(lang) ile dinlemeye başlar, stop() ile durur.
// Durduğunda biriken nihai metni onResult ile döndürür.
export function useSpeechRecognition(): UseSpeechRecognition {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');
  const handlersRef = useRef<StartHandlers | null>(null);
  const deliveredRef = useRef<boolean>(false);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;

  const supported = Boolean(SpeechRecognitionCtor);

  const start = useCallback(
    (lang: string, handlers: StartHandlers) => {
      if (!supported) {
        handlers.onError('unsupported');
        return;
      }

      // Önceki bir oturum varsa iptal et.
      try {
        recognitionRef.current?.abort();
      } catch {
        /* yoksay */
      }

      const rec: SpeechRecognitionInstance = new SpeechRecognitionCtor();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;

      transcriptRef.current = '';
      deliveredRef.current = false;
      handlersRef.current = handlers;

      rec.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        transcriptRef.current = text;
        handlers.onInterim?.(text.trim());
      };

      rec.onerror = (event: any) => {
        handlersRef.current?.onError(event.error || 'error');
      };

      rec.onend = () => {
        if (deliveredRef.current) return;
        deliveredRef.current = true;
        const finalText = transcriptRef.current.trim();
        if (finalText) handlersRef.current?.onResult(finalText);
        else handlersRef.current?.onError('no-speech');
      };

      try {
        rec.start();
        recognitionRef.current = rec;
      } catch {
        handlers.onError('start-failed');
      }
    },
    [supported]
  );

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* yoksay */
    }
  }, []);

  return { supported, start, stop };
}
