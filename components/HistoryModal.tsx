import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';
import { HistoryEntry } from '../types';
import { findLanguage } from '../data';

interface HistoryModalProps {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
  onReplay: (entry: HistoryEntry) => void;
}

// WhatsApp benzeri sohbet baloncukları: kim, orijinal ve çeviri.
// Baloncuğa dokununca çeviri tekrar sesli okunur.
export const HistoryModal: React.FC<HistoryModalProps> = ({
  open,
  entries,
  onClose,
  onReplay,
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
            className="bg-slate-50 rounded-t-3xl h-[80%] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                Konuşma Geçmişi
              </h2>
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 active:bg-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {entries.length === 0 && (
                <p className="text-center text-slate-400 mt-10">
                  Henüz konuşma yok. Bas-konuş butonuyla başlayın.
                </p>
              )}

              {entries.map((entry) => {
                const from = findLanguage(entry.fromCode);
                const to = findLanguage(entry.toCode);
                // Kişi A solda, Kişi B sağda hizalanır.
                const isA = entry.side === 'A';
                return (
                  <button
                    key={entry.id}
                    onClick={() => onReplay(entry)}
                    className={`w-full flex ${isA ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-left shadow-sm ${
                        isA
                          ? 'bg-white rounded-bl-sm'
                          : 'bg-emerald-100 rounded-br-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                        <span>{from.flag}</span>
                        <span>→</span>
                        <span>{to.flag}</span>
                        <Volume2 size={14} className="ml-auto text-slate-400" />
                      </div>
                      <p
                        dir={from.rtl ? 'rtl' : 'ltr'}
                        className="text-sm text-slate-500"
                      >
                        {entry.original}
                      </p>
                      <p
                        dir={to.rtl ? 'rtl' : 'ltr'}
                        className="text-base font-medium text-slate-800 mt-0.5"
                      >
                        {entry.translation}
                      </p>
                    </div>
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
