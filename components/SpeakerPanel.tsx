import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mic, Volume2 } from 'lucide-react';
import { Language, PanelStatus } from '../types';

interface SpeakerPanelProps {
  language: Language;     // Bu panelin sahibinin okuduğu dil
  text: string;          // Gösterilecek çeviri metni
  status: PanelStatus;   // idle | listening | translating
  rotated?: boolean;     // Üst yarı için 180° döndürme
  disabled?: boolean;    // Karşı taraf konuşurken kilitle
  accent: 'sky' | 'emerald';
  onPressStart: () => void;
  onPressEnd: () => void;
  onSpeak: () => void;
}

// Renk temaları (Tailwind sınıflarının statik kalması için sabit eşleme).
const THEME = {
  sky: {
    bg: 'bg-sky-50',
    chip: 'bg-sky-100 text-sky-700',
    button: 'bg-sky-500 active:bg-sky-700',
    buttonListening: 'bg-sky-700',
    wave: 'bg-sky-500',
    icon: 'text-sky-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    chip: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-500 active:bg-emerald-700',
    buttonListening: 'bg-emerald-700',
    wave: 'bg-emerald-500',
    icon: 'text-emerald-500',
  },
} as const;

// Konuşurken gösterilen basit ses dalgası animasyonu.
const Wave: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex items-end gap-1.5 h-10">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.span
        key={i}
        className={`w-2 rounded-full ${color}`}
        animate={{ height: ['20%', '100%', '40%', '90%', '30%'] }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.1,
        }}
        style={{ height: '40%' }}
      />
    ))}
  </div>
);

export const SpeakerPanel: React.FC<SpeakerPanelProps> = ({
  language,
  text,
  status,
  rotated = false,
  disabled = false,
  accent,
  onPressStart,
  onPressEnd,
  onSpeak,
}) => {
  const t = THEME[accent];
  const listening = status === 'listening';

  return (
    <div
      className={`flex-1 ${t.bg} flex flex-col items-center justify-between p-5 select-none`}
      style={rotated ? { transform: 'rotate(180deg)' } : undefined}
    >
      {/* Üst satır: dil etiketi + sesli oku */}
      <div className="w-full flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-2 ${t.chip} rounded-full px-3 py-1.5 text-sm font-semibold`}
        >
          <span className="text-lg leading-none">{language.flag}</span>
          {language.name}
        </span>
        <button
          onClick={onSpeak}
          aria-label="Sesli oku"
          className="p-2 rounded-full text-slate-400 hover:bg-white/60 active:bg-white"
        >
          <Volume2 size={22} className={t.icon} />
        </button>
      </div>

      {/* Orta: çeviri metni ya da durum göstergesi */}
      <div className="flex-1 w-full flex flex-col items-center justify-center text-center px-2">
        {status === 'listening' && (
          <div className="flex flex-col items-center gap-3">
            <Wave color={t.wave} />
            <span className="text-slate-500 font-medium">Dinleniyor…</span>
          </div>
        )}
        {status === 'translating' && (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 size={32} className={`animate-spin ${t.icon}`} />
            <span className="font-medium">Çevriliyor…</span>
          </div>
        )}
        {status === 'idle' && (
          <p
            dir={language.rtl ? 'rtl' : 'ltr'}
            className={`text-3xl font-semibold leading-snug ${
              text ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            {text || 'Konuşmak için aşağıdaki butona basılı tutun'}
          </p>
        )}
      </div>

      {/* Alt: bas-konuş butonu */}
      <button
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          if (!disabled) onPressStart();
        }}
        onPointerUp={onPressEnd}
        onPointerLeave={() => listening && onPressEnd()}
        onPointerCancel={onPressEnd}
        className={`w-full ${
          listening ? t.buttonListening : t.button
        } text-white rounded-2xl py-5 flex items-center justify-center gap-3 text-lg font-semibold shadow-md touch-none transition-transform ${
          listening ? 'scale-[1.02]' : ''
        } ${disabled ? 'opacity-40' : ''}`}
      >
        <Mic size={26} />
        {listening ? 'Bırakınca durur' : 'Konuşmak için basılı tut'}
      </button>
    </div>
  );
};
