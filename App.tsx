import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppModule, Product } from './types';
import { Landing } from './views/Landing';
import { MirrorApp } from './views/mirror/MirrorApp';
import { MobileApp } from './views/mobile/MobileApp';
import { AdminApp } from './views/admin/AdminApp';
import { ArchitectureView } from './views/ArchitectureView';

// Shared real-time session state — simulates WebSocket sync between Mirror & Mobile
interface SharedSession {
  active: boolean;
  product: Product | null;
  colorId: string | null;
  size: string | null;
}

const App: React.FC = () => {
  const [module, setModule] = useState<AppModule>('LANDING');
  const [session, setSession] = useState<SharedSession>({
    active: false, product: null, colorId: null, size: null,
  });

  const handleSelectProduct = useCallback((product: Product, colorId: string, size: string) => {
    setSession(s => ({ ...s, product, colorId, size }));
  }, []);

  const handleSessionConnect = useCallback(() => {
    setSession(s => ({ ...s, active: true }));
  }, []);

  const handleSessionStart = useCallback(() => {
    // mirror acknowledges session
  }, []);

  const goBack = () => {
    setModule('LANDING');
    setSession({ active: false, product: null, colorId: null, size: null });
  };

  // Dual-pane layout for Mirror + Mobile (simulates real-world side-by-side usage)
  const renderDualPane = () => (
    <div className="flex h-screen overflow-hidden" style={{ background: '#040408' }}>
      {/* Mirror (large display) */}
      <div className="flex-1 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <MirrorApp
          sharedProduct={session.product}
          sharedColor={session.colorId}
          sharedSize={session.size}
          onSessionStart={handleSessionStart}
          sessionActive={session.active}
        />
      </div>

      {/* Mobile (phone panel) */}
      <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#888' }}>📱 Mobile App</span>
            {session.active && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
            )}
          </div>
          {session.product && (
            <div className="text-xs" style={{ color: '#555' }}>Syncing → Mirror</div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <MobileApp
            onProductSelect={handleSelectProduct}
            onSessionConnect={handleSessionConnect}
            sessionActive={session.active}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen overflow-hidden" style={{ background: '#080808' }}>
      <AnimatePresence mode="wait">
        {module === 'LANDING' && (
          <motion.div key="landing" className="min-h-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Landing onSelectModule={setModule} />
          </motion.div>
        )}

        {(module === 'MIRROR' || module === 'MOBILE') && (
          <motion.div key="dual" className="h-screen"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="h-full relative">
              <button
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 hover:scale-105 transition-transform"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                onClick={goBack}
              >
                ← Back to Modules
              </button>
              {session.product && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 glass px-3 py-1.5 rounded-full text-xs flex items-center gap-2"
                  style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-mono">⚡ Real-time sync active</span>
                </div>
              )}
              {renderDualPane()}
            </div>
          </motion.div>
        )}

        {module === 'ADMIN' && (
          <motion.div key="admin" className="h-screen flex flex-col"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2"
              style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <button onClick={goBack}
                className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                ← Modules
              </button>
              <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Sirius Mirror Admin Panel</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <AdminApp />
            </div>
          </motion.div>
        )}

        {module === 'ARCHITECTURE' && (
          <motion.div key="arch" className="h-screen flex flex-col"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2"
              style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <button onClick={goBack}
                className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                ← Modules
              </button>
              <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>System Architecture Documentation</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ArchitectureView />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
