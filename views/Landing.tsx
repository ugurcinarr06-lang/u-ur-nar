import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppModule } from '../types';

interface Props {
  onSelectModule: (m: AppModule) => void;
}

const MODULES = [
  {
    id: 'MIRROR' as AppModule,
    icon: '🪞',
    title: 'Smart Mirror',
    subtitle: 'Mirror Client Demo',
    description: 'Full-screen AI mirror experience. See the QR session flow, body tracking, and virtual try-on overlay in action.',
    color: '#3b82f6',
    gradient: 'from-blue-950 to-blue-900',
    badge: 'Kiosk Display',
    stats: [{ icon: '⚡', label: '<200ms latency' }, { icon: '🤖', label: 'AI overlay' }, { icon: '📡', label: 'Real-time sync' }],
  },
  {
    id: 'MOBILE' as AppModule,
    icon: '📱',
    title: 'Mobile App',
    subtitle: 'Customer PWA Demo',
    description: 'Browse products, select colors and sizes, and send them to the mirror in real time — all from your phone.',
    color: '#8b5cf6',
    gradient: 'from-violet-950 to-violet-900',
    badge: 'Mobile PWA',
    stats: [{ icon: '👗', label: '8 products' }, { icon: '🎨', label: 'Color picker' }, { icon: '❤️', label: 'Favorites' }],
  },
  {
    id: 'ADMIN' as AppModule,
    icon: '⚙️',
    title: 'Admin Panel',
    subtitle: 'Management Dashboard',
    description: 'Full multi-tenant SaaS dashboard with analytics, store management, mirror fleet overview, and subscription billing.',
    color: '#f59e0b',
    gradient: 'from-amber-950 to-amber-900',
    badge: 'SaaS Backend',
    stats: [{ icon: '📊', label: 'Live analytics' }, { icon: '🏪', label: 'Store fleet' }, { icon: '💳', label: 'Subscriptions' }],
  },
  {
    id: 'ARCHITECTURE' as AppModule,
    icon: '🏗️',
    title: 'Architecture',
    subtitle: 'System Design',
    description: 'Full system architecture, database schema, REST API docs, WebSocket events, and DevOps pipeline.',
    color: '#22c55e',
    gradient: 'from-emerald-950 to-emerald-900',
    badge: 'Technical Docs',
    stats: [{ icon: '🗄️', label: 'DB schema' }, { icon: '🔌', label: 'API docs' }, { icon: '🚀', label: 'CI/CD guide' }],
  },
];

export const Landing: React.FC<Props> = ({ onSelectModule }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; dur: number; delay: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      dur: 4 + Math.random() * 8,
      delay: Math.random() * 6,
    })));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #04060e 0%, #080c1a 50%, #040608 100%)' }}>

      {/* Background particles */}
      {particles.map(p => (
        <div key={p.id}
          className="absolute rounded-full pointer-events-none animate-float"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: `rgba(59,130,246,${0.1 + Math.random() * 0.3})`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', transform: 'translate(50%,50%)' }} />

      {/* Hero */}
      <motion.div className="text-center mb-14 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-pulse"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)', transform: 'scale(2)' }} />
            <span className="text-5xl relative">🪞</span>
          </div>
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-3">
          <span className="gradient-text">SIRIUS</span>
          <span className="text-white"> MIRROR</span>
        </h1>
        <p className="text-xl font-light mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          AI-Powered Smart Mirror Platform for Retail
        </p>
        <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Virtual try-on technology that connects the physical store to the digital world.
          Scales from 1 boutique to 10,000+ stores globally.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {[
            { label: '94 Companies', color: '#3b82f6' },
            { label: '312 Active Mirrors', color: '#8b5cf6' },
            { label: '48K Sessions/mo', color: '#22c55e' },
            { label: '23.4% CVR', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="glass px-4 py-2 rounded-full text-sm font-medium"
              style={{ border: `1px solid ${s.color}33`, color: s.color }}>
              {s.label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl z-10">
        {MODULES.map((mod, i) => (
          <motion.button
            key={mod.id}
            onClick={() => onSelectModule(mod.id)}
            className="text-left group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${mod.color}08, ${mod.color}04)`,
              border: `1px solid ${mod.color}22`,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.02, borderColor: `${mod.color}55` }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 30% 30%, ${mod.color}08, transparent 60%)` }} />

            {/* Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${mod.color}18`, border: `1px solid ${mod.color}33` }}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{mod.title}</h3>
                  <p className="text-xs" style={{ color: '#666' }}>{mod.subtitle}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}33` }}>
                {mod.badge}
              </span>
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {mod.description}
            </p>

            {/* Stats */}
            <div className="flex gap-3 mb-4">
              {mod.stats.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-xs" style={{ color: '#666' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: mod.color }}>
              <span>Open Demo</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <motion.div className="mt-14 text-center z-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Sirius Mirror Platform · Production-grade SaaS Architecture · Built with React, Node.js, PostgreSQL, AI
        </p>
        <div className="flex justify-center gap-4 mt-2">
          {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'PyTorch', 'Docker', 'K8s'].map(t => (
            <span key={t} className="text-xs" style={{ color: 'rgba(255,255,255,0.12)' }}>{t}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
