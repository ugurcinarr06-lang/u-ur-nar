import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Peer from 'peerjs';
import { MirrorState, Product } from '../../types';
import { loadModel, MANNEQUIN_KEY } from '../../utils/modelStore';

const ThreeDGarmentViewer = lazy(() => import('./ThreeDGarmentViewer'));
const ThreeDMannequinViewer = lazy(() => import('./ThreeDMannequinViewer'));

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

// ── Gerçek İnsan Figürü ───────────────────────────────────────────────────────
const HumanSilhouette: React.FC<{ rotationDeg: number }> = ({ rotationDeg }) => (
  <svg
    viewBox="0 0 200 480"
    style={{
      width: '100%', height: '100%',
      transform: `rotateY(${rotationDeg}deg)`,
      transition: 'transform 0.6s ease',
      filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6))',
    }}
  >
    <defs>
      {/* Ana cilt tonu — 3D silindir efekti */}
      <linearGradient id="hs-body" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#a0604a" />
        <stop offset="16%"  stopColor="#c8845e" />
        <stop offset="40%"  stopColor="#e0a888" />
        <stop offset="55%"  stopColor="#ecc0a0" />
        <stop offset="82%"  stopColor="#c8845e" />
        <stop offset="100%" stopColor="#a0604a" />
      </linearGradient>
      <linearGradient id="hs-arm-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#8a4a38" />
        <stop offset="55%"  stopColor="#d09878" />
        <stop offset="100%" stopColor="#aa6850" />
      </linearGradient>
      <linearGradient id="hs-arm-r" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#aa6850" />
        <stop offset="45%"  stopColor="#d09878" />
        <stop offset="100%" stopColor="#8a4a38" />
      </linearGradient>
      <linearGradient id="hs-leg-l" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#904a38" />
        <stop offset="50%"  stopColor="#cc8868" />
        <stop offset="100%" stopColor="#a86248" />
      </linearGradient>
      <linearGradient id="hs-leg-r" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#a86248" />
        <stop offset="50%"  stopColor="#cc8868" />
        <stop offset="100%" stopColor="#904a38" />
      </linearGradient>
      <linearGradient id="hs-face" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#b86848" />
        <stop offset="35%"  stopColor="#d8966e" />
        <stop offset="55%"  stopColor="#e8aa88" />
        <stop offset="80%"  stopColor="#d0906a" />
        <stop offset="100%" stopColor="#b86848" />
      </linearGradient>
    </defs>

    {/* Zemin gölgesi */}
    <ellipse cx="100" cy="475" rx="48" ry="7" fill="rgba(0,0,0,0.38)" />

    {/* === AYAKLAR === */}
    <path d="M63 450 C56 452 50 456 46 463 L46 470 Q52 474 76 474 L96 474 Q104 472 104 464 L102 450 Z"
      fill="url(#hs-leg-l)" />
    <path d="M137 450 C144 452 150 456 154 463 L154 470 Q148 474 124 474 L104 474 Q96 472 96 464 L98 450 Z"
      fill="url(#hs-leg-r)" />

    {/* === SOL BACAK === */}
    {/* Uyluk */}
    <path d="M62 302 C56 308 50 325 48 350 L46 412 C46 430 52 444 64 450 L96 452 Q104 448 104 438 L102 302 Q84 296 62 302 Z"
      fill="url(#hs-leg-l)" />
    {/* Diz */}
    <ellipse cx="74" cy="388" rx="20" ry="13" fill="url(#hs-leg-l)" />

    {/* === SAĞ BACAK === */}
    {/* Uyluk */}
    <path d="M138 302 C144 308 150 325 152 350 L154 412 C154 430 148 444 136 450 L104 452 Q96 448 96 438 L98 302 Q116 296 138 302 Z"
      fill="url(#hs-leg-r)" />
    {/* Diz */}
    <ellipse cx="126" cy="388" rx="20" ry="13" fill="url(#hs-leg-r)" />

    {/* === KALÇA === */}
    <path d="M55 270 C45 280 43 298 43 315 L43 322 Q46 334 68 337 L132 337 Q154 334 157 322 L157 315 C157 298 155 280 145 270 L132 262 Q116 270 100 270 Q84 270 68 262 Z"
      fill="url(#hs-body)" />

    {/* === GÖVDE (kum saati — gerçek insan oranları) === */}
    <path d="
      M44 94
      C34 106 31 128 31 154
      L31 188
      C31 216 40 238 53 252
      L64 264
      Q80 272 100 272
      Q120 272 136 264
      L147 252
      C160 238 169 216 169 188
      L169 154
      C169 128 166 106 156 94
      L140 86
      Q122 92 100 92
      Q78 92 60 86
      Z"
      fill="url(#hs-body)" />

    {/* Göğüs hacim çizgisi */}
    <path d="M56 135 Q74 148 92 144 Q100 142 100 142 Q100 142 108 144 Q126 148 144 135"
      stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" fill="none" />
    {/* Bel detayı */}
    <path d="M31 188 C50 206 76 216 100 216 C124 216 150 206 169 188"
      stroke="rgba(0,0,0,0.07)" strokeWidth="1" fill="none" />

    {/* === SOL KOL === */}
    {/* Üst kol */}
    <path d="M44 98 C34 100 23 112 21 135 L18 200 Q17 215 26 219 L42 219 Q51 217 53 207 L57 144 C57 126 55 112 50 102 Z"
      fill="url(#hs-arm-l)" />
    {/* Dirsek */}
    <ellipse cx="30" cy="215" rx="11" ry="8" fill="url(#hs-arm-l)" />
    {/* Ön kol */}
    <path d="M21 214 C18 224 18 242 22 256 L26 265 Q38 270 46 264 L50 252 C52 238 52 222 46 218 L30 215 Z"
      fill="url(#hs-arm-l)" />
    {/* El */}
    <ellipse cx="34" cy="268" rx="13" ry="10" fill="url(#hs-arm-l)" />

    {/* === SAĞ KOL === */}
    {/* Üst kol */}
    <path d="M156 98 C166 100 177 112 179 135 L182 200 Q183 215 174 219 L158 219 Q149 217 147 207 L143 144 C143 126 145 112 150 102 Z"
      fill="url(#hs-arm-r)" />
    {/* Dirsek */}
    <ellipse cx="170" cy="215" rx="11" ry="8" fill="url(#hs-arm-r)" />
    {/* Ön kol */}
    <path d="M179 214 C182 224 182 242 178 256 L174 265 Q162 270 154 264 L150 252 C148 238 148 222 154 218 L170 215 Z"
      fill="url(#hs-arm-r)" />
    {/* El */}
    <ellipse cx="166" cy="268" rx="13" ry="10" fill="url(#hs-arm-r)" />

    {/* === BOYUN === */}
    <path d="M88 66 L88 94 Q94 99 100 99 Q106 99 112 94 L112 66 Q106 61 100 61 Q94 61 88 66 Z"
      fill="url(#hs-face)" />

    {/* === BAŞ === */}
    <ellipse cx="100" cy="38" rx="28" ry="34" fill="url(#hs-face)" />

    {/* SAÇ */}
    <path d="M72 30 C70 8 82 2 100 2 C118 2 130 8 128 30 L122 38 Q116 14 100 14 Q84 14 78 38 Z"
      fill="#1a0e08" />
    <path d="M72 30 C68 40 70 58 74 68" stroke="#1a0e08" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M128 30 C132 40 130 58 126 68" stroke="#1a0e08" strokeWidth="7" strokeLinecap="round" fill="none" />
    {/* Arka saç hacmi */}
    <path d="M72 22 C64 32 64 52 68 64" stroke="#1a0e08" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M128 22 C136 32 136 52 132 64" stroke="#1a0e08" strokeWidth="3" strokeLinecap="round" fill="none" />

    {/* KULAKLAR */}
    <ellipse cx="72" cy="42" rx="5" ry="7" fill="url(#hs-face)" />
    <ellipse cx="128" cy="42" rx="5" ry="7" fill="url(#hs-face)" />

    {/* YÜZ ÖZELLİKLERİ */}
    {/* Kaşlar */}
    <path d="M83 27 C86 25 91 25 94 27" stroke="#2a1208" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M106 27 C109 25 114 25 117 27" stroke="#2a1208" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Gözler */}
    <ellipse cx="88" cy="34" rx="6" ry="4.5" fill="#1e0e06" />
    <ellipse cx="112" cy="34" rx="6" ry="4.5" fill="#1e0e06" />
    {/* Göz ışığı */}
    <circle cx="90" cy="32.5" r="1.5" fill="rgba(255,255,255,0.65)" />
    <circle cx="114" cy="32.5" r="1.5" fill="rgba(255,255,255,0.65)" />
    {/* Burun */}
    <path d="M97 44 Q100 50 103 44" stroke="#9a5838" strokeWidth="1.2" fill="none" />
    <path d="M95 49 Q97.5 51 100 51 Q102.5 51 105 49" stroke="#9a5838" strokeWidth="1" fill="none" />
    {/* Dudaklar */}
    <path d="M91 57 Q100 63 109 57" stroke="#b06050" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M93 57 Q100 54 107 57" stroke="#b06050" strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* Omuz vurgusu */}
    <path d="M60 90 C48 94 40 104 36 115 L44 108 Q74 94 100 93 Q126 94 156 108 L164 115 C160 104 152 94 140 90 Z"
      fill="rgba(255,255,255,0.1)" />
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
  // 3D model varsa → Three.js viewer (lazy-loaded)
  if (product.modelUrl) {
    return (
      <Suspense fallback={<ImageGarmentOverlay product={product} rotationDeg={rotationDeg} />}>
        <ThreeDGarmentViewer product={product} rotationDeg={rotationDeg} />
      </Suspense>
    );
  }
  // Düz görsel varsa → flat-lay overlay
  if (product.imageUrl) {
    return <ImageGarmentOverlay product={product} rotationDeg={rotationDeg} />;
  }
  // SVG fallback
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

// ── Manken Görüntüleyici (3D veya SVG) ───────────────────────────────────────
const MannequinDisplay: React.FC<{ rotationDeg: number; mannequin3dUrl: string }> = ({ rotationDeg, mannequin3dUrl }) => {
  if (mannequin3dUrl) {
    return (
      <Suspense fallback={<HumanSilhouette rotationDeg={rotationDeg} />}>
        <ThreeDMannequinViewer mannequinUrl={mannequin3dUrl} rotationDeg={rotationDeg} />
      </Suspense>
    );
  }
  return <HumanSilhouette rotationDeg={rotationDeg} />;
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
  const [mannequin3dUrl, setMannequin3dUrl] = useState('');

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

  useEffect(() => {
    loadModel(MANNEQUIN_KEY).then(url => { if (url) setMannequin3dUrl(url); }).catch(() => {});
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
              <MannequinDisplay rotationDeg={0} mannequin3dUrl={mannequin3dUrl} />
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
              <MannequinDisplay rotationDeg={rotationDeg} mannequin3dUrl={mannequin3dUrl} />

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
