import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Anchor } from 'lucide-react';

export const SeaOrder: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset after animation view (optional, but here we keep success screen)
  };

  return (
    <div className="h-full bg-gradient-to-b from-indigo-50 to-blue-100 pb-24 flex flex-col relative overflow-hidden">
      {/* Background Wave Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-blue-500/10 rounded-t-[50%] transform scale-150"></div>
      
      <div className="px-6 pt-8 z-10">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Deniz Üstü Sipariş</h2>
        <p className="text-indigo-700 text-sm mb-6">Koydasınız ve eksiğiniz mi var? Sipariş verin, teknenize getirelim.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 z-10">
        {!submitted ? (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Tekne Adı</label>
              <input required type="text" className="w-full p-3 rounded-xl bg-white border border-indigo-100 focus:border-indigo-400 outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Konum / Koy</label>
              <select className="w-full p-3 rounded-xl bg-white border border-indigo-100 outline-none text-slate-700">
                <option>Bedri Rahmi Koyu</option>
                <option>Sarsala Koyu</option>
                <option>Yassıca Adaları</option>
                <option>Göbün Koyu</option>
                <option>Tersane Adası</option>
                <option>Göcek Adası</option>
                <option>Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">Telefon</label>
              <input required type="tel" className="w-full p-3 rounded-xl bg-white border border-indigo-100 focus:border-indigo-400 outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">İhtiyaç Listesi</label>
              <textarea 
                required 
                rows={4} 
                placeholder="Örn: 2 paket buz, ekmek, su, balık yemi..."
                className="w-full p-3 rounded-xl bg-white border border-indigo-100 focus:border-indigo-400 outline-none transition-colors resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-300 hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Siparişi Gönder
            </button>
          </motion.form>
        ) : (
          <SuccessView onReset={() => setSubmitted(false)} />
        )}
      </div>
    </div>
  );
};

const SuccessView: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="relative w-full h-40 mb-8 overflow-hidden">
         {/* Animated Boat */}
         <motion.div
           initial={{ x: -100, rotate: 5 }}
           animate={{ x: 400, rotate: [5, -5, 5, -5] }}
           transition={{ 
             x: { duration: 3, ease: "easeInOut" },
             rotate: { duration: 3, repeat: Infinity } 
           }}
           className="absolute bottom-4 left-0 text-indigo-600"
         >
           <Anchor size={48} className="transform -rotate-45" />
           <div className="w-16 h-2 bg-indigo-600 rounded-full mt-1"></div>
         </motion.div>
         
         {/* Waves */}
         <motion.div 
            className="absolute bottom-0 w-full flex gap-1"
            initial={{ x: 0 }}
            animate={{ x: -20 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
         >
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="w-8 h-4 bg-blue-300 rounded-t-full flex-shrink-0"></div>
            ))}
         </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-3xl font-bold text-indigo-900 mb-3">Talebiniz Alındı!</h3>
        <p className="text-indigo-700 max-w-xs mx-auto mb-8">
          Konumunuza en yakın tedarikçi birazdan sizinle iletişime geçecek.
        </p>
        <button 
          onClick={onReset}
          className="text-indigo-500 text-sm font-semibold hover:text-indigo-700"
        >
          Yeni Sipariş Oluştur
        </button>
      </motion.div>
    </div>
  );
};