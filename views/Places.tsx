import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Anchor, MapPin } from 'lucide-react';
import { PLACES_DATA } from '../data';

export const Places: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEA' | 'LAND'>('SEA');

  const filteredPlaces = PLACES_DATA.filter(p => p.type === activeTab);

  return (
    <div className="h-full bg-slate-50 pb-24 flex flex-col">
      <div className="bg-white px-6 pt-8 pb-4 shadow-sm z-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Gezilecek Yerler</h2>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('SEA')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'SEA' 
                ? 'bg-white text-cyan-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Anchor size={16} />
            Denizde
          </button>
          <button
            onClick={() => setActiveTab('LAND')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'LAND' 
                ? 'bg-white text-cyan-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin size={16} />
            Karada
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredPlaces.map((place) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
          >
            <div className="h-40 relative">
              <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 flex gap-2">
                {place.tags?.map(tag => (
                  <span key={tag} className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-slate-800 mb-1">{place.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{place.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};