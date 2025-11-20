import React, { useState } from 'react';
import { ViewState } from './types';
import { Navigation } from './components/Navigation';
import { Home } from './views/Home';
import { About } from './views/About';
import { Places } from './views/Places';
import { Dining } from './views/Dining';
import { BoatRental } from './views/BoatRental';
import { SeaOrder } from './views/SeaOrder';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');

  const renderView = () => {
    switch (currentView) {
      case 'HOME': return <Home onChangeView={setCurrentView} />;
      case 'ABOUT': return <About onBack={() => setCurrentView('HOME')} />;
      case 'PLACES': return <Places />;
      case 'DINING': return <Dining />;
      case 'BOAT_RENTAL': return <BoatRental />;
      case 'SEA_ORDER': return <SeaOrder />;
      default: return <Home onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent Navigation (Hidden on Home) */}
      <Navigation currentView={currentView} onChangeView={setCurrentView} />
    </div>
  );
};

export default App;