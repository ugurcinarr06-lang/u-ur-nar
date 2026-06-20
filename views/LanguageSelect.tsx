import React, { useState } from 'react';
import { ArrowRightLeft, Languages, MessageCircle } from 'lucide-react';
import { findLanguage, RECENT_PAIRS } from '../data';
import { LanguagePicker } from '../components/LanguagePicker';

interface LanguageSelectProps {
  myLang: string;
  otherLang: string;
  onChangeMyLang: (code: string) => void;
  onChangeOtherLang: (code: string) => void;
  onStart: (from: string, to: string) => void;
}

type Picker = 'mine' | 'other' | null;

// Açılış ekranı: kullanıcı kendi dilini ve karşı tarafın dilini seçer.
export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  myLang,
  otherLang,
  onChangeMyLang,
  onChangeOtherLang,
  onStart,
}) => {
  const [picker, setPicker] = useState<Picker>(null);

  const my = findLanguage(myLang);
  const other = findLanguage(otherLang);

  const swap = () => {
    onChangeMyLang(otherLang);
    onChangeOtherLang(myLang);
  };

  // Tek bir dil seçim kutusu (etiket + bayrak + ad).
  const Selector: React.FC<{
    label: string;
    flag: string;
    name: string;
    onClick: () => void;
  }> = ({ label, flag, name, onClick }) => (
    <button
      onClick={onClick}
      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-5 flex items-center gap-4 text-left shadow-sm active:scale-[0.99] transition-transform"
    >
      <span className="text-4xl leading-none">{flag}</span>
      <span className="flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="block text-2xl font-semibold text-slate-800">
          {name}
        </span>
      </span>
      <Languages size={22} className="text-slate-300" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-50 to-white">
      {/* Başlık */}
      <header className="px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500 text-white shadow-lg mb-4">
          <MessageCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Canlı Çeviri</h1>
        <p className="text-slate-500 mt-1">
          İki kişi, iki dil, tek sohbet
        </p>
      </header>

      <div className="flex-1 px-6 flex flex-col">
        {/* Dil seçiciler + swap */}
        <div className="relative flex flex-col gap-3">
          <Selector
            label="Sizin diliniz"
            flag={my.flag}
            name={my.name}
            onClick={() => setPicker('mine')}
          />

          <button
            onClick={swap}
            aria-label="Dilleri değiştir"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-sky-500 text-white shadow-lg flex items-center justify-center active:rotate-180 transition-transform duration-300"
          >
            <ArrowRightLeft size={22} />
          </button>

          <Selector
            label="Karşı tarafın dili"
            flag={other.flag}
            name={other.name}
            onClick={() => setPicker('other')}
          />
        </div>

        {/* Son kullanılan çiftler */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Son kullanılanlar
          </p>
          <div className="flex flex-wrap gap-2">
            {RECENT_PAIRS.map((pair, i) => {
              const f = findLanguage(pair.fromCode);
              const t = findLanguage(pair.toCode);
              return (
                <button
                  key={i}
                  onClick={() => {
                    onChangeMyLang(pair.fromCode);
                    onChangeOtherLang(pair.toCode);
                  }}
                  className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 active:bg-slate-100"
                >
                  <span>{f.flag}</span>
                  <ArrowRightLeft size={14} className="text-slate-400" />
                  <span>{t.flag}</span>
                  <span className="text-slate-500">
                    {f.code.toUpperCase()} · {t.code.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        {/* Başlat butonu */}
        <button
          onClick={() => onStart(myLang, otherLang)}
          className="mb-8 w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xl font-semibold rounded-2xl py-5 shadow-lg flex items-center justify-center gap-3 transition-colors"
        >
          <MessageCircle size={24} />
          Sohbeti Başlat
        </button>
      </div>

      {/* Dil seçim alt sayfaları */}
      <LanguagePicker
        open={picker === 'mine'}
        title="Sizin diliniz"
        selectedCode={myLang}
        disabledCode={otherLang}
        onSelect={onChangeMyLang}
        onClose={() => setPicker(null)}
      />
      <LanguagePicker
        open={picker === 'other'}
        title="Karşı tarafın dili"
        selectedCode={otherLang}
        disabledCode={myLang}
        onSelect={onChangeOtherLang}
        onClose={() => setPicker(null)}
      />
    </div>
  );
};
