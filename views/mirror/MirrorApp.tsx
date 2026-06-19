import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Peer from 'peerjs';
import { MirrorState, Product } from '../../types';

interface Props {
  sharedProduct: Product | null;
  sharedColor: string | null;
  sharedSize: string | null;
  onSessionStart: () => void;
  sessionActive: boolean;
  rotation?: number; // -1 left, 0 center, 1 right
}

// ── Gerçek QR Kod Bileşeni ────────────────────────────────────────────────────
const RealQRCode: React.FC<{ url: string }> = ({ url }) => {
  if (!url) {
    return (
      <div className="rounded-xl flex items-center justify-center"
        style={{ width: 180, height: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-blue-400">Hazırlanıyor...</span>
        </div>
      </div>
    );
  }
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&color=000000&bgcolor=FFFFFF&margin=2`;
  return (
    <div className="p-2 rounded-xl" style={{ background: 'white' }}>
      <img src={qrSrc} alt="QR Kod" width={180} height={180} className="rounded-lg block" />
    </div>
  );
};

// ── Gerçekçi Manken Silüeti ───────────────────────────────────────────────────
const MannequinSilhouette: React.FC<{ rotationDeg: number }> = ({ rotationDeg }) => (
  <svg
    viewBox="0 0 200 480"
    style={{
      width: '100%', height: '100%',
      transform: `rotateY(${rotationDeg}deg)`,
      transition: 'transform 0.6s ease',
      filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.55))',
    }}
  >
    <defs>
      <linearGradient id="mg-torso" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#5a4c3e" />
        <stop offset="18%"  stopColor="#9e8c78" />
        <stop offset="44%"  stopColor="#c8b89e" />
        <stop offset="58%"  stopColor="#d8c8b0" />
        <stop offset="82%"  stopColor="#9e8c78" />
        <stop offset="100%" stopColor="#5a4c3e" />
      </linearGradient>
      <linearGradient id="mg-arm-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#483c30" />
        <stop offset="52%"  stopColor="#b0a088" />
        <stop offset="100%" stopColor="#7a6a58" />
      </linearGradient>
      <linearGradient id="mg-arm-r" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#7a6a58" />
        <stop offset="48%"  stopColor="#b0a088" />
        <stop offset="100%" stopColor="#483c30" />
      </linearGradient>
      <linearGradient id="mg-leg-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#5a4c3e" />
        <stop offset="48%"  stopColor="#bca890" />
        <stop offset="100%" stopColor="#7a6858" />
      </linearGradient>
      <linearGradient id="mg-leg-r" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#7a6858" />
        <stop offset="52%"  stopColor="#bca890" />
        <stop offset="100%" stopColor="#5a4c3e" />
      </linearGradient>
    </defs>

    {/* Zemin gölgesi */}
    <ellipse cx="100" cy="474" rx="44" ry="6" fill="rgba(0,0,0,0.4)" />

    {/* === SOL BACAK === */}
    <path d="M66 310 C60 314 54 328 52 350 L50 448 Q50 462 64 466 L90 466 Q100 464 100 452 L100 310 Q84 306 66 310 Z"
      fill="url(#mg-leg-l)" />

    {/* === SAĞ BACAK === */}
    <path d="M134 310 C140 314 146 328 148 350 L150 448 Q150 462 136 466 L110 466 Q100 464 100 452 L100 310 Q116 306 134 310 Z"
      fill="url(#mg-leg-r)" />

    {/* === KALÇA / PELVİS === */}
    <path d="M52 268 C44 278 42 295 42 313 L42 320 Q44 332 66 335 L134 335 Q156 332 158 320 L158 313 C158 295 156 278 148 268 L134 260 Q118 268 100 268 Q82 268 66 260 Z"
      fill="url(#mg-torso)" />

    {/* === GÖVDE (omuzdan bele — kum saati şekli) === */}
    <path d="M42 102 C33 112 31 132 31 158 L31 192 C31 218 40 238 52 252 L62 262 Q78 270 100 270 Q122 270 138 262 L148 252 C160 238 169 218 169 192 L169 158 C169 132 167 112 158 102 L140 93 Q122 98 100 98 Q78 98 60 93 Z"
      fill="url(#mg-torso)" />

    {/* === SOL KOL === */}
    <path d="M42 106 C33 108 23 118 21 140 L19 206 Q18 220 27 224 L41 224 Q50 222 52 212 L56 148 C56 130 54 116 50 108 Z"
      fill="url(#mg-arm-l)" />
    {/* Sol el */}
    <ellipse cx="30" cy="230" rx="9" ry="11" fill="url(#mg-arm-l)" />

    {/* === SAĞ KOL === */}
    <path d="M158 106 C167 108 177 118 179 140 L181 206 Q182 220 173 224 L159 224 Q150 222 148 212 L144 148 C144 130 146 116 150 108 Z"
      fill="url(#mg-arm-r)" />
    {/* Sağ el */}
    <ellipse cx="170" cy="230" rx="9" ry="11" fill="url(#mg-arm-r)" />

    {/* === BOYUN === */}
    <path d="M88 68 L88 100 Q94 105 100 105 Q106 105 112 100 L112 68 Q106 63 100 63 Q94 63 88 68 Z"
      fill="url(#mg-torso)" />

    {/* === BAŞ (özelliksiz klasik manken başı) === */}
    <ellipse cx="100" cy="43" rx="22" ry="27" fill="url(#mg-torso)" />
    <ellipse cx="92" cy="36" rx="8" ry="10" fill="rgba(255,255,255,0.1)" />

    {/* Omuz vurgusu */}
    <path d="M60 96 C48 100 40 108 36 118 L42 112 Q74 98 100 98 Q126 98 158 112 L164 118 C160 108 152 100 140 96 Z"
      fill="rgba(255,255,255,0.12)" />

    {/* Bel darlığı detayı */}
    <path d="M31 192 C48 210 74 220 100 220 C126 220 152 210 169 192"
      stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" fill="none" />

    {/* === STAND TABAN === */}
    <rect x="87" y="466" width="26" height="6" rx="2" fill="#2a2018" />
    <ellipse cx="100" cy="476" rx="34" ry="5" fill="#2a2018" />
    <ellipse cx="100" cy="479" rx="40" ry="4" fill="#1a1410" />
  </svg>
);

// ── Kıyafet Overlay'leri ──────────────────────────────────────────────────────
const TShirtOverlay: React.FC<{ color: string; rotationDeg: number }> = ({ color, rotationDeg }) => (
  <svg viewBox="0 0 200 480" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transform: `rotateY(${rotationDeg}deg)`,
    transition: 'transform 0.6s ease',
    filter: `drop-shadow(0 4px 16px ${color}55)`,
  }}>
    <defs>
      <linearGradient id="tshirt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="50%" stopColor={color} stopOpacity="0.85" />
        <stop offset="100%" stopColor={color} stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="tshirt-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0,0,0,0.3)" stopOpacity="1" />
        <stop offset="30%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
        <stop offset="70%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.3)" stopOpacity="1" />
      </linearGradient>
    </defs>
    {/* Ana tişört gövdesi */}
    <path d="M57 100 Q42 112 40 148 L40 258 Q40 268 57 270 L143 270 Q160 268 160 258 L160 148 Q158 112 143 100 L125 96 Q112 108 100 108 Q88 108 75 96 Z"
      fill="url(#tshirt-grad)" />
    {/* Sol kol */}
    <path d="M57 100 L75 96 Q64 120 58 148 L42 160 Q35 155 32 148 Q30 128 38 112 Z"
      fill="url(#tshirt-grad)" opacity="0.9" />
    {/* Sağ kol */}
    <path d="M143 100 L125 96 Q136 120 142 148 L158 160 Q165 155 168 148 Q170 128 162 112 Z"
      fill="url(#tshirt-grad)" opacity="0.9" />
    {/* Yaka */}
    <path d="M75 96 Q88 108 100 108 Q112 108 125 96 Q112 90 100 90 Q88 90 75 96 Z"
      fill={color} opacity="0.7" />
    {/* Gölge & derinlik */}
    <path d="M57 100 Q42 112 40 148 L40 258 Q40 268 57 270 L143 270 Q160 268 160 258 L160 148 Q158 112 143 100 L125 96 Q112 108 100 108 Q88 108 75 96 Z"
      fill="url(#tshirt-shadow)" />
    {/* Kıvrım çizgileri */}
    <path d="M100 108 L100 270" stroke="rgba(0,0,0,0.08)" strokeWidth="1" fill="none" />
    <path d="M75 140 Q100 145 125 140" stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none" />
    <path d="M72 180 Q100 186 128 180" stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
    <path d="M70 220 Q100 226 130 220" stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
  </svg>
);

const ShirtOverlay: React.FC<{ color: string; rotationDeg: number }> = ({ color, rotationDeg }) => (
  <svg viewBox="0 0 200 480" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transform: `rotateY(${rotationDeg}deg)`, transition: 'transform 0.6s ease',
    filter: `drop-shadow(0 4px 16px ${color}55)`,
  }}>
    <defs>
      <linearGradient id="shirt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="100%" stopColor={color} stopOpacity="0.75" />
      </linearGradient>
    </defs>
    {/* Gövde */}
    <path d="M57 98 Q42 112 40 148 L40 268 Q40 272 57 274 L143 274 Q160 272 160 268 L160 148 Q158 112 143 98 L128 94 Q118 104 100 104 Q82 104 72 94 Z"
      fill="url(#shirt-grad)" />
    {/* Sol kol (uzun) */}
    <path d="M57 98 L72 94 Q60 124 52 155 L30 210 Q24 218 26 225 L38 225 Q44 218 48 210 L56 158 Q62 128 66 108 Z"
      fill="url(#shirt-grad)" opacity="0.9" />
    {/* Sağ kol (uzun) */}
    <path d="M143 98 L128 94 Q140 124 148 155 L170 210 Q176 218 174 225 L162 225 Q156 218 152 210 L144 158 Q138 128 134 108 Z"
      fill="url(#shirt-grad)" opacity="0.9" />
    {/* Yaka & düğme bandı */}
    <path d="M82 94 Q91 102 100 102 Q109 102 118 94" fill="none" stroke={color} strokeWidth="3" opacity="0.6" />
    <line x1="100" y1="104" x2="100" y2="274" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
    {[130,155,180,205,230].map((y,i) => (
      <circle key={i} cx="100" cy={y} r="3" fill="rgba(0,0,0,0.2)" />
    ))}
    {/* Manşet */}
    <line x1="26" y1="218" x2="38" y2="220" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
    <line x1="162" y1="220" x2="174" y2="218" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
    <path d="M57 98 Q42 112 40 148 L40 268 Q40 272 57 274 L143 274 Q160 272 160 268 L160 148 Q158 112 143 98 L128 94 Q118 104 100 104 Q82 104 72 94 Z"
      fill="linear-gradient(180deg, rgba(0,0,0,0.15), transparent)" opacity="0.3" />
  </svg>
);

const DressOverlay: React.FC<{ color: string; rotationDeg: number }> = ({ color, rotationDeg }) => (
  <svg viewBox="0 0 200 480" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transform: `rotateY(${rotationDeg}deg)`, transition: 'transform 0.6s ease',
    filter: `drop-shadow(0 4px 20px ${color}55)`,
  }}>
    <defs>
      <linearGradient id="dress-grad" x1="0%" y1="0%" x2="30%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="60%" stopColor={color} stopOpacity="0.88" />
        <stop offset="100%" stopColor={color} stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {/* Elbise gövdesi - A-line */}
    <path d="M72 92 Q58 104 52 130 L48 200 Q45 230 42 270 L30 430 Q28 445 50 448 L150 448 Q172 445 170 430 L158 270 Q155 230 152 200 L148 130 Q142 104 128 92 Q114 102 100 102 Q86 102 72 92 Z"
      fill="url(#dress-grad)" />
    {/* İnce askılar */}
    <path d="M84 92 L78 70" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
    <path d="M116 92 L122 70" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
    {/* Bel çizgisi */}
    <path d="M50 200 Q100 210 150 200" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    {/* Etek dalgalanması */}
    <path d="M42 320 Q60 310 80 322 Q100 334 120 322 Q140 310 158 320" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    <path d="M38 370 Q60 358 85 372 Q110 386 135 372 Q158 358 162 370" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    {/* Işık/gölge */}
    <path d="M72 92 Q58 104 52 130 L48 200 L55 200 L60 130 Q66 105 78 94 Z" fill="rgba(255,255,255,0.08)" />
    <path d="M128 92 Q142 104 148 130 L152 200 L145 200 L140 130 Q134 105 122 94 Z" fill="rgba(0,0,0,0.08)" />
  </svg>
);

const JacketOverlay: React.FC<{ color: string; rotationDeg: number }> = ({ color, rotationDeg }) => (
  <svg viewBox="0 0 200 480" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transform: `rotateY(${rotationDeg}deg)`, transition: 'transform 0.6s ease',
    filter: `drop-shadow(0 4px 20px ${color}66)`,
  }}>
    <defs>
      <linearGradient id="jacket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="100%" stopColor={color} stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {/* Sol dış panel */}
    <path d="M57 96 Q42 110 38 148 L38 270 L95 270 L95 105 Q86 103 72 96 Z"
      fill={color} opacity="0.92" />
    {/* Sağ dış panel */}
    <path d="M143 96 Q158 110 162 148 L162 270 L105 270 L105 105 Q114 103 128 96 Z"
      fill={color} opacity="0.85" />
    {/* Sol kol */}
    <path d="M57 96 L72 96 Q60 126 54 158 L32 215 Q26 224 28 230 L40 230 Q46 222 50 215 L58 160 Q64 128 68 110 Z"
      fill={color} opacity="0.9" />
    {/* Sağ kol */}
    <path d="M143 96 L128 96 Q140 126 146 158 L168 215 Q174 224 172 230 L160 230 Q154 222 150 215 L142 160 Q136 128 132 110 Z"
      fill={color} opacity="0.85" />
    {/* Yaka sol */}
    <path d="M72 96 Q84 104 100 108 L95 270 L90 270 L85 160 Q76 128 72 96 Z"
      fill="rgba(255,255,255,0.07)" />
    {/* Revers/yakalar */}
    <path d="M100 108 L85 130 L80 270 L95 270 Z" fill="rgba(255,255,255,0.1)" />
    <path d="M100 108 L115 130 L120 270 L105 270 Z" fill="rgba(0,0,0,0.08)" />
    {/* Orta dikiş */}
    <line x1="100" y1="108" x2="100" y2="270" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
    {/* Düğmeler */}
    {[150,175,200,225].map((y,i) => (
      <circle key={i} cx="100" cy={y} r="3.5" fill="rgba(0,0,0,0.3)" />
    ))}
    {/* Manşetler */}
    <rect x="26" y="222" width="14" height="10" rx="2" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    <rect x="160" y="222" width="14" height="10" rx="2" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    {/* Cep */}
    <rect x="55" y="210" width="22" height="14" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    <rect x="123" y="210" width="22" height="14" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
  </svg>
);

const SuitOverlay: React.FC<{ color: string; rotationDeg: number }> = ({ color, rotationDeg }) => (
  <svg viewBox="0 0 200 480" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transform: `rotateY(${rotationDeg}deg)`, transition: 'transform 0.6s ease',
    filter: `drop-shadow(0 4px 20px ${color}66)`,
  }}>
    {/* Takım alt (pantolon) */}
    <path d="M52 270 L48 435 Q47 445 58 448 L82 448 Q90 446 90 435 L88 338 L100 338 L112 435 Q112 446 118 448 L142 448 Q153 445 152 435 L148 270 Z"
      fill={color} opacity="0.82" />
    {/* Ceket sol */}
    <path d="M57 96 Q42 110 38 148 L38 275 L95 275 L95 105 Q86 103 72 96 Z"
      fill={color} opacity="0.95" />
    {/* Ceket sağ */}
    <path d="M143 96 Q158 110 162 148 L162 275 L105 275 L105 105 Q114 103 128 96 Z"
      fill={color} opacity="0.88" />
    {/* Sol kol */}
    <path d="M57 96 L72 96 Q58 128 52 160 L30 215 Q24 224 26 230 L38 230 Q44 222 48 215 L56 162 Q62 130 66 110 Z"
      fill={color} opacity="0.9" />
    {/* Sağ kol */}
    <path d="M143 96 L128 96 Q142 128 148 160 L170 215 Q176 224 174 230 L162 230 Q156 222 152 215 L144 162 Q138 130 134 110 Z"
      fill={color} opacity="0.85" />
    {/* Göğüs cepleri */}
    <rect x="60" y="130" width="20" height="12" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    {/* Revers */}
    <path d="M100 108 L82 135 L78 275 L95 275 Z" fill="rgba(255,255,255,0.06)" />
    <path d="M100 108 L118 135 L122 275 L105 275 Z" fill="rgba(0,0,0,0.06)" />
    {/* Kravat */}
    <path d="M97 110 L100 120 L103 110 L101 140 L100 270 L99 140 Z" fill="#b91c1c" opacity="0.85" />
    <path d="M97 110 L100 120 L103 110 Z" fill="#7f1d1d" opacity="0.9" />
    {/* Ceket dikişi */}
    <line x1="100" y1="108" x2="100" y2="275" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
    {/* Düğmeler */}
    {[155,180].map((y,i) => (
      <circle key={i} cx="100" cy={y} r="3.5" fill="rgba(0,0,0,0.35)" />
    ))}
  </svg>
);

// Kategori bazlı overlay seçimi
// Kategori bazlı konum & boyut (container: 240x420px üzerinden %)
function getGarmentLayout(categoryId: string) {
  switch (categoryId) {
    case 'cat-1': return { top: '19%', left: '14%', width: '72%', height: '36%' };  // T-shirt
    case 'cat-2': return { top: '19%', left: '11%', width: '78%', height: '44%' };  // Gömlek
    case 'cat-3': return { top: '19%', left: '8%',  width: '84%', height: '66%' };  // Elbise
    case 'cat-4': return { top: '17%', left: '6%',  width: '88%', height: '50%' };  // Ceket
    case 'cat-5': return { top: '16%', left: '4%',  width: '92%', height: '80%' };  // Takım
    case 'cat-6': return { top: '80%', left: '14%', width: '72%', height: '16%' };  // Ayakkabı
    case 'cat-7': return { top: '12%', left: '22%', width: '56%', height: '22%' };  // Aksesuar
    default:      return { top: '19%', left: '14%', width: '72%', height: '36%' };
  }
}

// Resimli Kıyafet Overlay — düz yatay (flat-lay) ürün fotoğrafı manken üzerinde
const ImageGarmentOverlay: React.FC<{ product: Product; rotationDeg: number }> = ({ product, rotationDeg }) => {
  const layout = getGarmentLayout(product.categoryId);
  return (
    <div style={{
      position: 'absolute',
      ...layout,
      transform: `rotateY(${rotationDeg}deg)`,
      transition: 'transform 0.6s ease',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <img
        src={product.imageUrl}
        alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
};

const GarmentOverlay: React.FC<{ product: Product; colorHex: string; rotationDeg: number }> = ({ product, colorHex, rotationDeg }) => {
  // Gerçek resim varsa → resimli overlay
  if (product.imageUrl) {
    return <ImageGarmentOverlay product={product} rotationDeg={rotationDeg} />;
  }
  // Yoksa → SVG garment fallback
  switch (product.categoryId) {
    case 'cat-1': return <TShirtOverlay color={colorHex} rotationDeg={rotationDeg} />;
    case 'cat-2': return <ShirtOverlay color={colorHex} rotationDeg={rotationDeg} />;
    case 'cat-3': return <DressOverlay color={colorHex} rotationDeg={rotationDeg} />;
    case 'cat-4': return <JacketOverlay color={colorHex} rotationDeg={rotationDeg} />;
    case 'cat-5': return <SuitOverlay color={colorHex} rotationDeg={rotationDeg} />;
    default: return <TShirtOverlay color={colorHex} rotationDeg={rotationDeg} />;
  }
};

// ── Body Tracking Noktaları ───────────────────────────────────────────────────
const TrackingOverlay: React.FC = () => {
  const points = [
    { x: 100, y: 43 },  // Baş
    { x: 100, y: 88 },  // Boyun
    { x: 42,  y: 102 }, // Sol omuz
    { x: 158, y: 102 }, // Sağ omuz
    { x: 22,  y: 170 }, // Sol dirsek
    { x: 178, y: 170 }, // Sağ dirsek
    { x: 30,  y: 230 }, // Sol el
    { x: 170, y: 230 }, // Sağ el
    { x: 72,  y: 268 }, // Sol kalça
    { x: 128, y: 268 }, // Sağ kalça
    { x: 66,  y: 380 }, // Sol diz
    { x: 134, y: 380 }, // Sağ diz
    { x: 72,  y: 458 }, // Sol ayak
    { x: 128, y: 458 }, // Sağ ayak
  ];
  const bones = [
    [0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,7],[2,8],[3,9],[8,10],[9,11],[10,12],[11,13]
  ];
  return (
    <svg viewBox="0 0 200 480" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {bones.map(([a,b], i) => (
        <line key={i}
          x1={points[a].x} y1={points[a].y}
          x2={points[b].x} y2={points[b].y}
          stroke="rgba(59,130,246,0.35)" strokeWidth="0.8"
        />
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5"
          fill="#3b82f6" opacity="0.7"
          style={{ animation: `body-track 1.5s ${i * 0.08}s ease-in-out infinite` }}
        />
      ))}
    </svg>
  );
};

// ── Ana Mirror App ─────────────────────────────────────────────────────────────
export const MirrorApp: React.FC<Props> = ({
  sharedProduct, sharedColor, sharedSize, onSessionStart, sessionActive, rotation = 0
}) => {
  const [mirrorState, setMirrorState] = useState<MirrorState>('IDLE');
  const [time, setTime] = useState(new Date());
  const [aiProgress, setAiProgress] = useState(0);
  const [showTracking, setShowTracking] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);

  // PeerJS state
  const [peerId, setPeerId] = useState('');
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerProduct, setPeerProduct] = useState<Product | null>(null);
  const [peerColor, setPeerColor] = useState<string | null>(null);
  const [peerSize, setPeerSize] = useState<string | null>(null);
  const peerRef = useRef<InstanceType<typeof Peer> | null>(null);

  // Gerçek ürün: peer'den gelen öncelikli, demo modunda props
  const effectiveProduct = peerProduct ?? sharedProduct;
  const effectiveColor = peerColor ?? sharedColor;
  const effectiveSize = peerSize ?? sharedSize;

  // QR URL
  const mobileUrl = peerId
    ? `${window.location.origin}/?m=1&p=${peerId}`
    : '';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // PeerJS: aynanın peer bağlantısı
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));

    peer.on('connection', (conn) => {
      setPeerConnected(true);
      setMirrorState('SESSION_CONNECTING');
      setTimeout(() => { setMirrorState('SESSION_ACTIVE'); onSessionStart(); }, 1600);

      conn.on('data', (raw: unknown) => {
        const data = raw as { type: string; product?: Product; colorId?: string; size?: string; rotation?: number };
        if (data.type === 'SELECT' && data.product) {
          setPeerProduct(data.product);
          setPeerColor(data.colorId ?? null);
          setPeerSize(data.size ?? null);
        }
        if (data.type === 'ROTATE' && typeof data.rotation === 'number') {
          setRotationDeg(data.rotation * 20);
        }
      });

      conn.on('close', () => {
        setPeerConnected(false);
        setMirrorState('QR_DISPLAYED');
        setPeerProduct(null);
        setPeerColor(null);
        setPeerSize(null);
      });
    });

    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (mirrorState === 'IDLE') {
      const t = setTimeout(() => setMirrorState('QR_DISPLAYED'), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  // Demo modu: props ile bağlantı (dual-pane simülasyon)
  useEffect(() => {
    if (sessionActive && !peerConnected && mirrorState === 'QR_DISPLAYED') {
      setMirrorState('SESSION_CONNECTING');
      setTimeout(() => { setMirrorState('SESSION_ACTIVE'); onSessionStart(); }, 1600);
    }
  }, [sessionActive]);

  // Ürün seçimi (peer veya demo)
  useEffect(() => {
    if (effectiveProduct && (mirrorState === 'SESSION_ACTIVE' || mirrorState === 'TRYON_ACTIVE')) {
      setMirrorState('TRYON_ACTIVE');
      setAiProgress(0);
      setShowTracking(false);
      let p = 0;
      const t = setInterval(() => {
        p += Math.random() * 18 + 10;
        setAiProgress(Math.min(p, 100));
        if (p > 35) setShowTracking(true);
        if (p >= 100) clearInterval(t);
      }, 80);
      return () => clearInterval(t);
    }
  }, [peerProduct, sharedProduct, peerColor, sharedColor]);

  // Demo modunda rotation prop'u kullan (peer bağlı değilse)
  useEffect(() => {
    if (!peerConnected) {
      setRotationDeg(rotation * 20);
    }
  }, [rotation, peerConnected]);

  const selectedColor = effectiveProduct?.colors.find(c => c.id === effectiveColor)
    ?? effectiveProduct?.colors[0];

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #050912 0%, #0a1428 50%, #050810 100%)', minHeight: '100vh' }}>

      {/* Ambient arka plan ışıkları */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', transform: 'translate(50%,50%)' }} />
      </div>

      {/* Köşe dekorasyonları */}
      {[
        'top-3 left-3 border-t-2 border-l-2',
        'top-3 right-3 border-t-2 border-r-2',
        'bottom-3 left-3 border-b-2 border-l-2',
        'bottom-3 right-3 border-b-2 border-r-2'
      ].map((cls, i) => (
        <div key={i} className={`absolute w-8 h-8 ${cls} pointer-events-none`}
          style={{ borderColor: 'rgba(59,130,246,0.4)' }} />
      ))}

      {/* Üst durum çubuğu */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-2.5 z-20"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-mono" style={{ color: 'rgba(59,130,246,0.8)' }}>SIRIUS MIRROR v3.2.1</span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-green-400">ONLINE</span>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {mirrorState === 'IDLE' && (
          <motion.div key="idle" className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-7xl animate-float">🪞</div>
            <h1 className="text-5xl font-bold gradient-text">SIRIUS MIRROR</h1>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>Sistem başlatılıyor...</p>
          </motion.div>
        )}

        {/* ── QR GÖSTER ── */}
        {mirrorState === 'QR_DISPLAYED' && (
          <motion.div key="qr" className="flex flex-col items-center gap-8 text-center px-8"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div>
              <h1 className="text-5xl font-bold gradient-text mb-2">SIRIUS MIRROR</h1>
              <p className="text-xl font-light" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Ürünleri kendinizde <span className="text-blue-400 font-semibold">anında</span> görün
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-5 rounded-3xl animate-pulse"
                style={{ background: 'rgba(59,130,246,0.08)' }} />
              <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4"
                style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
                <RealQRCode url={mobileUrl} />
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-sm font-medium text-blue-400">
                    {peerId ? 'Kameranızla okutun' : 'QR hazırlanıyor...'}
                  </p>
                </div>
                {peerId && (
                  <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    ID: {peerId.slice(0, 12)}...
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-8">
              {[{ icon: '📱', label: 'QR Okut' }, { icon: '👗', label: 'Seçin' }, { icon: '🪞', label: 'Görün' }].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>{s.icon}</div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>LUXE Fashion · Fifth Avenue</p>
          </motion.div>
        )}

        {/* ── BAĞLANIYOR ── */}
        {mirrorState === 'SESSION_CONNECTING' && (
          <motion.div key="conn" className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full animate-spin"
                style={{ border: '2px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#8b5cf6' }} />
              <div className="absolute inset-3 rounded-full animate-spin"
                style={{ border: '2px solid transparent', borderBottomColor: '#3b82f6', animationDirection: 'reverse', animationDuration: '0.7s' }} />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">📱</div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-400">Bağlanıyor</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Cihazınızla eşleşiliyor...</p>
            </div>
          </motion.div>
        )}

        {/* ── OTURUM AKTİF — ürün bekleniyor ── */}
        {mirrorState === 'SESSION_ACTIVE' && (
          <motion.div key="active" className="flex flex-col items-center gap-6 text-center px-6 w-full"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-full"
              style={{ border: '1px solid rgba(34,197,94,0.35)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-400">Telefon Bağlandı</span>
            </div>
            {/* Siluet bekleme animasyonu */}
            <div className="relative" style={{ width: 220, height: 380 }}>
              <div className="absolute inset-0 rounded-3xl"
                style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }} />
              <MannequinSilhouette rotationDeg={0} />
              {/* Tarama çizgisi */}
              <div className="absolute left-0 right-0 h-0.5 animate-scan"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent)', pointerEvents: 'none' }} />
            </div>
            <div>
              <p className="text-lg font-light" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Telefondaki katalogdan ürün seçin
              </p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Seçtiğiniz kıyafet burada görünecek
              </p>
            </div>
          </motion.div>
        )}

        {/* ── TRY-ON AKTİF ── */}
        {mirrorState === 'TRYON_ACTIVE' && effectiveProduct && (
          <motion.div key="tryon" className="relative flex flex-col items-center w-full h-full justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* AI İlerleme çubuğu */}
            <AnimatePresence>
              {aiProgress < 100 && (
                <motion.div key="progress"
                  className="absolute top-14 left-6 right-6 z-30"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-blue-400">AI İşleniyor...</span>
                    <span className="text-xs font-mono text-blue-400">{Math.round(aiProgress)}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }}
                      animate={{ width: `${aiProgress}%` }} transition={{ duration: 0.15 }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body + Kıyafet */}
            <div className="relative" style={{ width: 240, height: 420 }}>
              {/* Zemin ışığı */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-6 rounded-full"
                style={{ background: `radial-gradient(ellipse, ${selectedColor?.hex ?? '#3b82f6'}22, transparent)` }} />

              {/* Siluet */}
              <MannequinSilhouette rotationDeg={rotationDeg} />

              {/* Kıyafet overlay — AI yüklenince göster */}
              <AnimatePresence>
                {aiProgress > 55 && (
                  <motion.div key="garment" className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}>
                    <GarmentOverlay
                      product={effectiveProduct}
                      colorHex={selectedColor?.hex ?? '#3b82f6'}
                      rotationDeg={rotationDeg}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body tracking noktaları */}
              {showTracking && aiProgress < 100 && <TrackingOverlay />}

              {/* AI durumu */}
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1.5 glass px-2 py-1 rounded-full"
                  style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-green-400">
                    {aiProgress < 100 ? 'İşleniyor' : 'Canlı'}
                  </span>
                </div>
              </div>

              {/* Döndürme ipu */}
              {aiProgress >= 100 && (
                <motion.div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>← Telefonda döndürün →</span>
                </motion.div>
              )}
            </div>

            {/* Ürün bilgi paneli */}
            <motion.div
              className="absolute bottom-12 left-4 right-4 glass-strong rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>{effectiveProduct.brand}</p>
                  <p className="text-lg font-bold mt-0.5">{effectiveProduct.name}</p>
                  <p className="text-xs mt-1" style={{ color: '#666' }}>{effectiveProduct.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-400">{effectiveProduct.currency}{effectiveProduct.price.toLocaleString()}</p>
                  {effectiveProduct.originalPrice && (
                    <p className="text-sm line-through" style={{ color: '#555' }}>{effectiveProduct.currency}{effectiveProduct.originalPrice}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {selectedColor && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2" style={{ background: selectedColor.hex, borderColor: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs font-medium" style={{ color: '#aaa' }}>{selectedColor.name}</span>
                  </div>
                )}
                {effectiveSize && (
                  <div className="glass px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-bold text-blue-400">{effectiveSize}</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: '#444' }}>★</span>
                  <span className="text-xs font-semibold">{effectiveProduct.rating}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Alt durum çubuğu */}
      {(mirrorState === 'SESSION_ACTIVE' || mirrorState === 'TRYON_ACTIVE') && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-2"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-green-400">OTURUM AKTİF</span>
          </div>
          <span className="text-xs font-mono" style={{ color: '#333' }}>
            {Math.floor(80 + Math.random() * 40)}ms
          </span>
          <span className="text-xs font-mono" style={{ color: '#333' }}>LUXE · 5th Ave</span>
        </div>
      )}
    </div>
  );
};
