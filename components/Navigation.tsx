import React from 'react';
import { Home, Map, Coffee, Ship, Anchor } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView }) => {
  // Don't show bottom nav on Home screen if we want full immersion, 
  // but for better UX on inner pages, we use it.
  if (currentView === 'HOME') return null;

  const navItems: { view: ViewState; icon: React.ElementType; label: string }[] = [
    { view: 'HOME', icon: Home, label: 'Ana Sayfa' },
    { view: 'PLACES', icon: Map, label: 'Gez' },
    { view: 'DINING', icon: Coffee, label: 'Ye/İç' },
    { view: 'BOAT_RENTAL', icon: Ship, label: 'Tekne' },
    { view: 'SEA_ORDER', icon: Anchor, label: 'Sipariş' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              currentView === item.view ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon size={24} strokeWidth={currentView === item.view ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};