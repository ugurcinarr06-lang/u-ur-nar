import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { findLanguage, placeholderFor } from '../data';
import { SpeakerPanel } from '../components/SpeakerPanel';

interface ConversationProps {
  myLang: string;    // Alt yarı (Kişi A) — sizin diliniz
  otherLang: string; // Üst yarı (Kişi B) — karşı tarafın dili
  onBack: () => void;
}

// Hangi panelin butonunun basılı olduğunu takip eder.
type ActiveSpeaker = 'A' | 'B' | null;

export const Conversation: React.FC<ConversationProps> = ({
  myLang,
  otherLang,
  onBack,
}) => {
  const my = findLanguage(myLang);
  const other = findLanguage(otherLang);
  const [active, setActive] = useState<ActiveSpeaker>(null);

  // NOT: Bu aşamada gerçek ses/çeviri YOK (Adım 11.1).
  // Butona basınca yalnızca "Dinleniyor…" durumu gösterilir.
  // expo-speech / Web Speech API entegrasyonu bir sonraki adımda eklenecek.
  const speak = (code: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(placeholderFor(code));
    utter.lang = code;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ÜST YARI — Kişi B'ye dönük (180° döndürülmüş) */}
      <SpeakerPanel
        language={other}
        text={placeholderFor(otherLang)}
        rotated
        accent="emerald"
        listening={active === 'B'}
        onPressStart={() => setActive('B')}
        onPressEnd={() => setActive(null)}
        onSpeak={() => speak(otherLang)}
      />

      {/* ORTA AYRAÇ — geri butonu + dil çifti göstergesi */}
      <div className="relative z-10 flex items-center justify-between bg-slate-800 text-white px-4 py-2">
        <button
          onClick={onBack}
          aria-label="Geri"
          className="flex items-center gap-1 text-sm font-medium text-slate-200 active:text-white"
        >
          <ChevronLeft size={20} />
          Geri
        </button>
        <span className="text-sm font-semibold tracking-wide">
          {other.code.toUpperCase()} ⇄ {my.code.toUpperCase()}
        </span>
        <span className="w-12" /> {/* dengeleyici boşluk */}
      </div>

      {/* ALT YARI — Kişi A'ya dönük (normal yön) */}
      <SpeakerPanel
        language={my}
        text={placeholderFor(myLang)}
        accent="sky"
        listening={active === 'A'}
        onPressStart={() => setActive('A')}
        onPressEnd={() => setActive(null)}
        onSpeak={() => speak(myLang)}
      />
    </div>
  );
};
