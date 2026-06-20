import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { LANGUAGES } from '../data';

interface LanguagePickerProps {
  open: boolean;
  title: string;
  selectedCode: string;
  // Seçilemeyecek dil (diğer tarafta zaten seçili olan); aynı dil iki tarafta olmasın.
  disabledCode?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

// Tam ekran alt sayfa (bottom sheet) şeklinde dil seçici.
// Büyük dokunma hedefleri ile yaşlı/acele eden kullanıcıya uygun.
export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  open,
  title,
  selectedCode,
  disabledCode,
  onSelect,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-t-3xl max-h-[80%] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 active:bg-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar p-3">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedCode;
                const isDisabled = lang.code === disabledCode;
                return (
                  <button
                    key={lang.code}
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(lang.code);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-50 ring-2 ring-sky-400'
                        : 'hover:bg-slate-50 active:bg-slate-100'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-3xl leading-none">{lang.flag}</span>
                    <span className="flex-1">
                      <span className="block text-lg font-medium text-slate-800">
                        {lang.name}
                      </span>
                      <span className="block text-sm text-slate-400">
                        {lang.nativeName}
                      </span>
                    </span>
                    {isSelected && <Check size={22} className="text-sky-500" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
