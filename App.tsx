import React, { useState } from 'react';
import { ViewState } from './types';
import { LanguageSelect } from './views/LanguageSelect';
import { Conversation } from './views/Conversation';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('SELECT');

  // "Sizin diliniz" (alt yarı, Kişi A) ve "Karşı tarafın dili" (üst yarı, Kişi B).
  const [myLang, setMyLang] = useState<string>('tr');
  const [otherLang, setOtherLang] = useState<string>('en');

  const startConversation = (from: string, to: string) => {
    setMyLang(from);
    setOtherLang(to);
    setCurrentView('CONVERSATION');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {currentView === 'SELECT' ? (
        <LanguageSelect
          myLang={myLang}
          otherLang={otherLang}
          onChangeMyLang={setMyLang}
          onChangeOtherLang={setOtherLang}
          onStart={startConversation}
        />
      ) : (
        <Conversation
          myLang={myLang}
          otherLang={otherLang}
          onBack={() => setCurrentView('SELECT')}
        />
      )}
    </div>
  );
};

export default App;
