import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Plus, Users, Ruler, MapPin } from 'lucide-react';
import { BOATS_DATA } from '../data';
import { Boat } from '../types';

export const BoatRental: React.FC = () => {
  const [viewMode, setViewMode] = useState<'RENT' | 'LIST'>('RENT');
  const [boats] = useState<Boat[]>(BOATS_DATA); // In real app, fetch from API
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  
  // Form States for Owner
  const [ownerFormSubmitted, setOwnerFormSubmitted] = useState(false);

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => setOwnerFormSubmitted(true), 1000);
  };

  return (
    <div className="h-full bg-slate-50 pb-24 flex flex-col">
      {/* Header Switcher */}
      <div className="bg-white px-6 pt-8 pb-4 shadow-sm z-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tekne Kiralama</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('RENT')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'RENT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Kirala
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'LIST' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Tekneni Listele
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'RENT' ? (
            <motion.div
              key="rent-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {boats.map((boat) => (
                <div key={boat.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <img src={boat.imageUrl} alt={boat.name} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{boat.name}</h3>
                      <span className="text-blue-600 font-bold text-lg">
                        {boat.price} {boat.currency}<span className="text-xs text-slate-400 font-normal">/gün</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-slate-500 text-sm mb-4">
                      <div className="flex items-center gap-1"><Ship size={14} /> {boat.type}</div>
                      <div className="flex items-center gap-1"><Users size={14} /> {boat.capacity} Kişi</div>
                      <div className="flex items-center gap-1"><Ruler size={14} /> {boat.length}m</div>
                      <div className="flex items-center gap-1"><MapPin size={14} /> {boat.location}</div>
                    </div>

                    <button 
                      onClick={() => setSelectedBoat(boat)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Tekne Detayı ve Kiralama
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {ownerFormSubmitted ? (
                <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-100">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ship size={24} />
                  </div>
                  <h3 className="text-green-800 font-bold mb-2">Başarıyla Gönderildi</h3>
                  <p className="text-green-700 text-sm">Tekneniz listeye eklendi. Onay sürecinden sonra kiralama listesinde görünecektir.</p>
                  <button onClick={() => setOwnerFormSubmitted(false)} className="mt-4 text-green-600 font-medium text-sm underline">Yeni Kayıt</button>
                </div>
              ) : (
                <form onSubmit={handleOwnerSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tekne Adı</label>
                    <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                      <select className="w-full p-3 rounded-xl border border-slate-200 bg-white">
                        <option>Gulet</option>
                        <option>Yelkenli</option>
                        <option>Motor Yat</option>
                        <option>Katamaran</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kapasite</label>
                      <input type="number" className="w-full p-3 rounded-xl border border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kalkış Noktası</label>
                    <input type="text" className="w-full p-3 rounded-xl border border-slate-200" placeholder="Örn: D-Marin" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">İletişim (Tel/WhatsApp)</label>
                    <input required type="tel" className="w-full p-3 rounded-xl border border-slate-200" />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 mt-4">
                    Kaydı Gönder
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Simple Modal for Details (Mockup) */}
      {selectedBoat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 relative"
           >
             <button onClick={() => setSelectedBoat(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
             <h3 className="text-xl font-bold mb-2">{selectedBoat.name}</h3>
             <p className="text-slate-600 text-sm mb-4">{selectedBoat.description}</p>
             <form className="space-y-3">
               <input type="text" placeholder="Ad Soyad" className="w-full p-3 border rounded-lg text-sm"/>
               <input type="tel" placeholder="Telefon" className="w-full p-3 border rounded-lg text-sm"/>
               <input type="date" className="w-full p-3 border rounded-lg text-sm"/>
               <button type="button" onClick={() => {alert('Talep Alındı!'); setSelectedBoat(null);}} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
                 Talep Gönder
               </button>
             </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};