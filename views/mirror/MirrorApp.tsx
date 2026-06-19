import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MirrorState, Product } from '../../types';
import { PRODUCTS, CATEGORIES } from '../../data';

interface Props {
  sharedProduct: Product | null;
  sharedColor: string | null;
  sharedSize: string | null;
  onSessionStart: () => void;
  sessionActive: boolean;
}

const QR_PIXELS = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
  [1,0,1,1,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1],
  [0,1,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0],
  [1,0,1,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0,1],
  [0,1,0,1,0,1,0,0,1,1,0,1,0,0,1,0,1,1,0],
  [0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,1,0,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,0,1,1,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,0,1,1,0,0],
  [1,0,1,1,1,0,1,0,1,0,0,1,0,1,0,0,0,1,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,1,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,0,1,1,0],
];

const QRCode: React.FC = () => (
  <div className="inline-block p-3 rounded-xl" style={{ background: 'white' }}>
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${QR_PIXELS[0].length}, 8px)` }}>
      {QR_PIXELS.flat().map((px, i) => (
        <div key={i} style={{ width: 8, height: 8, background: px ? '#000' : 'transparent' }} />
      ))}
    </div>
  </div>
);

const BodyTrackOverlay: React.FC<{ product: Product; colorHex: string }> = ({ product, colorHex }) => {
  const landmarks = [
    { x: 50, y: 18, label: 'head' },
    { x: 50, y: 30, label: 'neck' },
    { x: 35, y: 37, label: 'l-shoulder' },
    { x: 65, y: 37, label: 'r-shoulder' },
    { x: 28, y: 52, label: 'l-elbow' },
    { x: 72, y: 52, label: 'r-elbow' },
    { x: 25, y: 67, label: 'l-wrist' },
    { x: 75, y: 67, label: 'r-wrist' },
    { x: 42, y: 62, label: 'l-hip' },
    { x: 58, y: 62, label: 'r-hip' },
    { x: 40, y: 80, label: 'l-knee' },
    { x: 60, y: 80, label: 'r-knee' },
    { x: 38, y: 96, label: 'l-ankle' },
    { x: 62, y: 96, label: 'r-ankle' },
  ];
  const skeleton = [
    [1,2],[2,3],[2,4],[3,5],[4,6],[5,7],[6,8],[2,9],[2,10],[9,11],[10,12],[11,13],[12,14]
  ];

  const isUpper = ['cat-1','cat-2','cat-4','cat-5'].includes(product.categoryId);
  const isLower = ['cat-3','cat-6'].includes(product.categoryId);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Skeleton lines */}
        {skeleton.map(([a, b], i) => {
          const la = landmarks[a]; const lb = landmarks[b];
          return (
            <line key={i}
              x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}
              stroke="rgba(59,130,246,0.4)" strokeWidth="0.4"
            />
          );
        })}
        {/* Landmarks */}
        {landmarks.map((lm, i) => (
          <circle key={i} cx={lm.x} cy={lm.y} r="0.8"
            fill="#3b82f6" opacity="0.7"
            className="animate-body-track"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </svg>

      {/* Garment overlay */}
      {isUpper && (
        <div
          className="absolute animate-float"
          style={{
            top: '28%', left: '25%', width: '50%', height: '38%',
            background: `radial-gradient(ellipse, ${colorHex}88 0%, ${colorHex}44 50%, transparent 100%)`,
            filter: 'blur(2px)',
            mixBlendMode: 'color-dodge',
          }}
        />
      )}
      {isLower && (
        <div
          className="absolute animate-float"
          style={{
            top: '55%', left: '30%', width: '40%', height: '40%',
            background: `radial-gradient(ellipse, ${colorHex}88 0%, ${colorHex}44 50%, transparent 100%)`,
            filter: 'blur(2px)',
            mixBlendMode: 'color-dodge',
            animationDelay: '0.5s',
          }}
        />
      )}

      {/* AI processing indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-mono text-green-400 opacity-80">AI TRACKING</span>
      </div>

      {/* Body metrics */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1">
        {[
          { label: 'POSE', value: '98.2%' },
          { label: 'BODY', value: 'DETECTED' },
          { label: 'FPS', value: '60' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'rgba(59,130,246,0.7)', minWidth: 48 }}>{m.label}</span>
            <span className="text-xs font-mono text-green-400">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MirrorApp: React.FC<Props> = ({
  sharedProduct, sharedColor, sharedSize, onSessionStart, sessionActive
}) => {
  const [mirrorState, setMirrorState] = useState<MirrorState>('IDLE');
  const [time, setTime] = useState(new Date());
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; dur: number }[]>([]);
  const [scanLine, setScanLine] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setParticles(Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      delay: Math.random() * 6, dur: 6 + Math.random() * 8
    })));
  }, []);

  useEffect(() => {
    if (mirrorState === 'IDLE') {
      const t = setTimeout(() => setMirrorState('QR_DISPLAYED'), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (sessionActive && mirrorState === 'QR_DISPLAYED') {
      setMirrorState('SESSION_CONNECTING');
      setTimeout(() => { setMirrorState('SESSION_ACTIVE'); onSessionStart(); }, 1800);
    }
  }, [sessionActive]);

  useEffect(() => {
    if (sharedProduct && mirrorState === 'SESSION_ACTIVE') {
      setMirrorState('TRYON_ACTIVE');
      setAiProgress(0);
      let p = 0;
      const t = setInterval(() => {
        p += Math.random() * 15 + 8;
        setAiProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(t);
      }, 120);
      return () => clearInterval(t);
    }
  }, [sharedProduct]);

  const selectedColor = sharedProduct?.colors.find(c => c.id === sharedColor)
    ?? sharedProduct?.colors[0];

  return (
    <div className="relative w-full h-full overflow-hidden mirror-frame flex flex-col items-center justify-center select-none"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #070b14 0%, #0d1829 50%, #060e1f 100%)' }}
    >
      {/* Ambient particles */}
      {particles.map(p => (
        <div key={p.id}
          className="absolute w-px rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`, bottom: '-20px', height: `${20 + Math.random() * 60}px`,
            background: `linear-gradient(transparent, rgba(59,130,246,${0.1 + Math.random() * 0.3}), transparent)`,
            animation: `particle-float ${p.dur}s ${p.delay}s infinite linear`,
          }}
        />
      ))}

      {/* Corner decorations */}
      {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`}>
          <div className={`absolute w-6 h-0.5 bg-blue-500 opacity-60 ${i % 2 === 0 ? 'left-0' : 'right-0'}`} />
          <div className={`absolute h-6 w-0.5 bg-blue-500 opacity-60 ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'}`} />
        </div>
      ))}

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-10"
        style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-mono text-blue-400 opacity-80">SIRIUS MIRROR v3.2.1</span>
        </div>
        <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-green-400 opacity-80">ONLINE</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {mirrorState === 'IDLE' && (
          <motion.div key="idle" className="flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-rotate-slow"
                style={{ background: 'conic-gradient(from 0deg, transparent, rgba(59,130,246,0.3), transparent)', width: 200, height: 200, margin: -20 }} />
              <div className="text-8xl animate-float">🪞</div>
            </div>
            <div className="text-center">
              <h1 className="text-6xl font-bold tracking-tight gradient-text">SIRIUS MIRROR</h1>
              <p className="text-lg mt-2 font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Initializing AI System...</p>
            </div>
          </motion.div>
        )}

        {/* QR DISPLAYED */}
        {mirrorState === 'QR_DISPLAYED' && (
          <motion.div key="qr" className="flex flex-col items-center justify-center gap-10 text-center px-8"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div>
              <h1 className="text-5xl font-bold tracking-tight gradient-text mb-2">SIRIUS MIRROR</h1>
              <p className="text-xl font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
                See products on yourself <span className="text-blue-400 font-medium">instantly</span>
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl animate-pulse-ring"
                style={{ background: 'rgba(59,130,246,0.12)', borderRadius: 24 }} />
              <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4"
                style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
                <QRCode />
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-sm font-medium text-blue-400">Scan to begin try-on</p>
                </div>
                <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Session: SM-{Math.random().toString(36).slice(2,8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              {[{ icon: '📱', label: 'Scan QR' }, { icon: '👗', label: 'Browse' }, { icon: '🪞', label: 'Try On' }].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>{s.icon}</div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <p className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.25)' }}>
              LUXE Fashion Group · Fifth Avenue Flagship
            </p>
          </motion.div>
        )}

        {/* CONNECTING */}
        {mirrorState === 'SESSION_CONNECTING' && (
          <motion.div key="connecting" className="flex flex-col items-center gap-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full animate-spin"
                style={{ border: '2px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#8b5cf6' }} />
              <div className="absolute inset-3 rounded-full animate-spin"
                style={{ border: '2px solid transparent', borderBottomColor: '#3b82f6', animationDirection: 'reverse', animationDuration: '0.8s' }} />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">📱</div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-400">Connecting</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Pairing your device...</p>
            </div>
          </motion.div>
        )}

        {/* SESSION ACTIVE — waiting for product */}
        {mirrorState === 'SESSION_ACTIVE' && (
          <motion.div key="active" className="flex flex-col items-center gap-8 text-center px-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-full"
              style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-400">Mobile Connected</span>
            </div>

            {/* Silhouette placeholder */}
            <div className="relative w-48 h-80">
              <div className="absolute inset-0 rounded-3xl"
                style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(59,130,246,0.1)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 80 180" className="w-32 h-64 opacity-20">
                  <ellipse cx="40" cy="18" rx="12" ry="14" fill="rgba(59,130,246,0.5)" />
                  <rect x="24" y="32" width="32" height="50" rx="8" fill="rgba(59,130,246,0.3)" />
                  <rect x="10" y="34" width="16" height="40" rx="6" fill="rgba(59,130,246,0.2)" />
                  <rect x="54" y="34" width="16" height="40" rx="6" fill="rgba(59,130,246,0.2)" />
                  <rect x="26" y="80" width="12" height="52" rx="4" fill="rgba(59,130,246,0.2)" />
                  <rect x="42" y="80" width="12" height="52" rx="4" fill="rgba(59,130,246,0.2)" />
                </svg>
              </div>
              {/* Scan line */}
              <div className="absolute left-0 right-0 h-0.5 animate-scan pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)' }} />
            </div>

            <div className="text-center">
              <p className="text-xl font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Browse on your phone
              </p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Select a product to see it on the mirror
              </p>
            </div>
          </motion.div>
        )}

        {/* TRYON ACTIVE */}
        {mirrorState === 'TRYON_ACTIVE' && sharedProduct && (
          <motion.div key="tryon" className="relative w-full h-full flex flex-col items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Full-body silhouette with overlay */}
            <div className="relative w-56 h-[480px] mx-auto">
              {/* Camera feed simulation */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #0d1829 0%, #111827 100%)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <svg viewBox="0 0 80 180" className="w-full h-full opacity-30">
                  <ellipse cx="40" cy="18" rx="12" ry="14" fill="rgba(255,255,255,0.4)" />
                  <rect x="24" y="32" width="32" height="50" rx="8" fill="rgba(255,255,255,0.2)" />
                  <rect x="10" y="34" width="16" height="40" rx="6" fill="rgba(255,255,255,0.15)" />
                  <rect x="54" y="34" width="16" height="40" rx="6" fill="rgba(255,255,255,0.15)" />
                  <rect x="26" y="80" width="12" height="52" rx="4" fill="rgba(255,255,255,0.15)" />
                  <rect x="42" y="80" width="12" height="52" rx="4" fill="rgba(255,255,255,0.15)" />
                </svg>
              </div>

              {/* Garment color overlay */}
              {aiProgress > 60 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${selectedColor?.hex ?? '#3b82f6'}55 0%, transparent 80%)`,
                    mixBlendMode: 'screen',
                  }}
                />
              )}

              {/* Body tracking */}
              {aiProgress > 40 && <BodyTrackOverlay product={sharedProduct} colorHex={selectedColor?.hex ?? '#3b82f6'} />}

              {/* AI loading bar */}
              {aiProgress < 100 && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                      animate={{ width: `${aiProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Product info panel */}
            <motion.div
              className="absolute bottom-16 left-4 right-4 glass-strong rounded-2xl p-4"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium opacity-50 uppercase tracking-wider">{sharedProduct.brand}</p>
                  <p className="text-lg font-bold mt-0.5">{sharedProduct.name}</p>
                  <p className="text-sm mt-0.5 opacity-60">{sharedProduct.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-400">{sharedProduct.currency}{sharedProduct.price.toLocaleString()}</p>
                  {sharedProduct.originalPrice && (
                    <p className="text-sm line-through opacity-40">{sharedProduct.currency}{sharedProduct.originalPrice}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                {selectedColor && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: selectedColor.hex }} />
                    <span className="text-xs opacity-60">{selectedColor.name}</span>
                  </div>
                )}
                {sharedSize && (
                  <div className="glass px-2 py-0.5 rounded-md">
                    <span className="text-xs font-semibold">{sharedSize}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session info bottom bar */}
      {(mirrorState === 'SESSION_ACTIVE' || mirrorState === 'TRYON_ACTIVE') && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid rgba(59,130,246,0.12)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-green-400">SESSION ACTIVE</span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Latency: {Math.floor(80 + Math.random() * 60)}ms
          </span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            LUXE · 5th Ave
          </span>
        </div>
      )}
    </div>
  );
};
