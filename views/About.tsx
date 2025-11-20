import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ViewState } from '../types';

export const About: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="h-full overflow-y-auto bg-white pb-24">
      <div className="relative h-64">
        <img 
          src="https://images.unsplash.com/photo-1566379677576-14918b874b1d?q=80&w=1200" 
          alt="Göcek Marina ve Yaşam" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="absolute bottom-6 left-6 text-3xl font-bold text-white">Göcek'in Büyüsü</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6 text-slate-700 leading-relaxed"
      >
        <p>
          Göcek, Fethiye Körfezi'nin en korunaklı köşesinde, çam ormanlarının denizle kucaklaştığı eşsiz bir cennettir. 
          Muğla'nın incisi olarak bilinen bu belde, özellikle yatçılık ve mavi yolculuk tutkunlarının dünyadaki en önemli uğrak noktalarından biridir.
        </p>
        
        <div className="bg-cyan-50 p-4 rounded-xl border-l-4 border-cyan-500">
          <h3 className="text-cyan-900 font-bold mb-2">Mavi Yolculuğun Başkenti</h3>
          <p className="text-sm text-cyan-800">
            12 Adalar olarak bilinen bölgeye yakınlığı, sayısız koyu ve sakin denizi ile Göcek, deniz severlere huzur dolu bir kaçış sunar.
          </p>
        </div>

        <p>
          Dalaman Havalimanı'na sadece 20 dakika uzaklıkta olması, Göcek'i ulaşım açısından da cazip kılar. 
          Sakin atmosferi, yüksek kalitedeki marinaları ve doğayla iç içe yapısı, burayı kitle turizminden uzak, seçkin bir tatil beldesi haline getirmiştir.
        </p>

        <p>
          Burada hayat yavaştır. Sabahları turkuaz sulara uyanır, gün boyu zeytin ve çam kokuları eşliğinde dinlenir, 
          akşamları ise kordon boyundaki şık restoranlarda Ege mutfağının tadını çıkarırsınız.
        </p>
      </motion.div>
    </div>
  );
};