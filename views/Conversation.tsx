import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, History } from 'lucide-react';
import { HistoryEntry, PanelStatus } from '../types';
import { bcp47, findLanguage } from '../data';
import { SpeakerPanel } from '../components/SpeakerPanel';
import { HistoryModal } from '../components/HistoryModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { translate } from '../services/translation';
import { speak } from '../services/tts';

interface ConversationProps {
  myLang: string;    // Alt yarı (Kişi A) — sizin diliniz
  otherLang: string; // Üst yarı (Kişi B) — karşı tarafın dili
  onBack: () => void;
}

type Side = 'A' | 'B';

// Hata kodunu kullanıcı dostu Türkçe mesaja çevirir.
function describeError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofona izin verin.';
    case 'no-speech':
      return 'Ses algılanmadı. Lütfen butona basılı tutarak tekrar konuşun.';
    case 'audio-capture':
      return 'Mikrofon bulunamadı. Cihazınızı kontrol edin.';
    case 'network':
      return 'Ağ hatası. Ses tanıma için internet bağlantısı gerekir.';
    case 'unsupported':
      return 'Tarayıcınız ses tanımayı desteklemiyor (Chrome veya Edge önerilir).';
    case 'NO_API_KEY':
      return 'Çeviri sunucusunda API anahtarı tanımlı değil (ANTHROPIC_API_KEY).';
    case 'NETWORK':
      return 'Çeviri sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edin.';
    case 'TRANSLATE_FAILED':
    case 'EMPTY':
      return 'Çeviri başarısız oldu. Lütfen tekrar deneyin.';
    case 'aborted':
      return '';
    default:
      return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
}

export const Conversation: React.FC<ConversationProps> = ({
  myLang,
  otherLang,
  onBack,
}) => {
  const my = findLanguage(myLang);
  const other = findLanguage(otherLang);

  const sr = useSpeechRecognition();

  const [active, setActive] = useState<Side | null>(null);      // dinlenen taraf
  const [processing, setProcessing] = useState<Side | null>(null); // çeviren konuşmacı
  const [topText, setTopText] = useState('');     // Kişi B'nin okuduğu (otherLang)
  const [bottomText, setBottomText] = useState(''); // Kişi A'nın okuduğu (myLang)
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // A konuşur → myLang→otherLang → sonuç üst panelde (B okur).
  // B konuşur → otherLang→myLang → sonuç alt panelde (A okur).
  const handleResult = async (side: Side, transcript: string) => {
    setActive(null);
    const fromCode = side === 'A' ? myLang : otherLang;
    const toCode = side === 'A' ? otherLang : myLang;

    setProcessing(side);
    try {
      const translation = await translate(transcript, fromCode, toCode);
      if (side === 'A') setTopText(translation);
      else setBottomText(translation);

      setHistory((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          side,
          fromCode,
          toCode,
          original: transcript,
          translation,
          ts: Date.now(),
        },
      ]);

      // Otomatik seslendirme (hedef dilde).
      speak(translation, toCode);
    } catch (e: any) {
      setError(describeError(e?.message || 'error'));
    } finally {
      setProcessing(null);
    }
  };

  const handlePressStart = (side: Side) => {
    if (active || processing) return; // tek seferde tek kişi
    setError('');
    setActive(side);
    const lang = side === 'A' ? myLang : otherLang;
    sr.start(bcp47(lang), {
      onResult: (text) => handleResult(side, text),
      onError: (code) => {
        setActive(null);
        const msg = describeError(code);
        if (msg) setError(msg);
      },
    });
  };

  const handlePressEnd = (side: Side) => {
    if (active === side) sr.stop();
  };

  const replay = (entry: HistoryEntry) => speak(entry.translation, entry.toCode);

  // Panel durumlarını hesapla.
  const topStatus: PanelStatus =
    active === 'B' ? 'listening' : processing === 'A' ? 'translating' : 'idle';
  const bottomStatus: PanelStatus =
    active === 'A' ? 'listening' : processing === 'B' ? 'translating' : 'idle';

  const busy = active !== null || processing !== null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ÜST YARI — Kişi B'ye dönük (180° döndürülmüş) */}
      <SpeakerPanel
        language={other}
        text={topText}
        status={topStatus}
        rotated
        accent="emerald"
        disabled={busy && active !== 'B'}
        onPressStart={() => handlePressStart('B')}
        onPressEnd={() => handlePressEnd('B')}
        onSpeak={() => topText && speak(topText, otherLang)}
      />

      {/* ORTA AYRAÇ — geri, dil çifti, geçmiş */}
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
        <button
          onClick={() => setShowHistory(true)}
          aria-label="Konuşma geçmişi"
          className="flex items-center gap-1 text-sm font-medium text-slate-200 active:text-white"
        >
          <History size={18} />
          {history.length > 0 && <span>{history.length}</span>}
        </button>
      </div>

      {/* ALT YARI — Kişi A'ya dönük (normal yön) */}
      <SpeakerPanel
        language={my}
        text={bottomText}
        status={bottomStatus}
        accent="sky"
        disabled={busy && active !== 'A'}
        onPressStart={() => handlePressStart('A')}
        onPressEnd={() => handlePressEnd('A')}
        onSpeak={() => bottomText && speak(bottomText, myLang)}
      />

      {/* Hata bildirimi (orta üstte, kısa süreli) */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[85%] max-w-sm bg-white border border-amber-200 rounded-2xl shadow-xl p-4 flex items-start gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-slate-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-sm font-semibold text-sky-600 active:text-sky-800"
            >
              Tamam
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryModal
        open={showHistory}
        entries={history}
        onClose={() => setShowHistory(false)}
        onReplay={replay}
      />
    </div>
  );
};
