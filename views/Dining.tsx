import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Star } from 'lucide-react';
import { VENUES_DATA } from '../data';

export const Dining: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('TÜMÜ');
  const [priceFilter, setPriceFilter] = useState<string>('TÜMÜ');

  const categories = ['TÜMÜ', 'KAFE', 'RESTORAN', 'BAR', 'PUB'];
  
  const filteredVenues = VENUES_DATA.filter(venue => {
    const catMatch = categoryFilter === 'TÜMÜ' || venue.category === categoryFilter;
    const priceMatch = priceFilter === 'TÜMÜ' || venue.price === priceFilter;
    return catMatch && priceMatch;
  });

  return (
    <div className="h-full bg-slate-50 pb-24 flex flex-col">
      <div className="bg-white px-6 pt-8 pb-4 shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Yeme & İçme</h2>
          <button className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100">
            <Filter size={20} />
          </button>
        </div>

        {/* Horizontal Scrollable Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredVenues.map((venue) => (
          <motion.div
            key={venue.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-4"
          >
            <img 
              src={venue.imageUrl} 
              alt={venue.name} 
              className="w-24 h-24 rounded-xl object-cover flex-shrink-0" 
            />
            <div className="flex flex-col justify-center flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{venue.name}</h3>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{venue.price}</span>
              </div>
              <p className="text-xs text-slate-400 uppercase mt-0.5 font-medium">{venue.category} • {venue.location}</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{venue.description}</p>
            </div>
          </motion.div>
        ))}
        
        {filteredVenues.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>Bu kriterlere uygun mekan bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};