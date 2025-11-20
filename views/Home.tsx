import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Info, Map, Utensils, Ship, Anchor } from 'lucide-react';
import { ViewState } from '../types';

interface HomeProps {
  onChangeView: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ onChangeView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  
  // Parallax effect for background
  const yBg = useTransform(scrollY, [0, 500], [0, 200]);
  const smoothYBg = useSpring(yBg, { stiffness: 100, damping: 20 });

  const menuItems = [
    { id: 'ABOUT', label: 'Göcek Hakkında', sub: 'Doğayı Keşfet', icon: Info, color: 'bg-cyan-600' },
    { id: 'PLACES', label: 'Gezilecek Yerler', sub: 'Koylar & Rotalar', icon: Map, color: 'bg-teal-600' },
    { id: 'DINING', label: 'Yeme & İçme', sub: 'Restoranlar & Cafeler', icon: Utensils, color: 'bg-orange-500' },
    { id: 'BOAT_RENTAL', label: 'Tekne Kiralama', sub: 'Kirala veya Listele', icon: Ship, color: 'bg-blue-600' },
    { id: 'SEA_ORDER', label: 'Deniz Üstü Sipariş', sub: 'Tekneye Servis', icon: Anchor, color: 'bg-indigo-600' },
  ];

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto overflow-x-hidden bg-slate-900">
      {/* Parallax Background */}
      <motion.div 
        style={{ y: smoothYBg }}
        className="absolute top-0 left-0 w-full h-[120%] z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=1000" 
          alt="Göcek Aerial View" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-slate-900/40 to-slate-900/90" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-6 pt-16 pb-10 flex flex-col min-h-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Göcek Rehberi</h1>
          <p className="text-cyan-100 text-sm font-light tracking-wide uppercase">Doğal Güzellikler & Deniz Hizmetleri</p>
        </motion.div>

        <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileTap={{ scale: 0.96 }}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 flex items-center gap-5 hover:bg-white/20 transition-all"
            >
              <div className={`p-3 rounded-full ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon size={24} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-semibold text-white">{item.label}</h3>
                <p className="text-slate-300 text-xs">{item.sub}</p>
              </div>
              <div className="text-white/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </motion.button>
          ))}
        </div>
        
        <div className="mt-auto pt-10 text-center text-slate-500 text-xs">
          <p>© 2024 Göcek Rehberi</p>
        </div>
      </div>
    </div>
  );
};