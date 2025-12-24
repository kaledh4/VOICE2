import React, { useState } from 'react';
import { Character, Behavior, AppState, Screen } from './types';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import ChatScreen from './screens/ChatScreen';
import { CHARACTERS } from './constants';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);

  const handleCharacterSelect = (char: Character) => {
    setSelectedCharacter(char);
    setCurrentScreen(Screen.SETUP);
  };

  const handleBehaviorSelect = (behavior: Behavior) => {
    setSelectedBehavior(behavior);
    setCurrentScreen(Screen.CHAT);
  };

  const handleBack = () => {
    if (currentScreen === Screen.CHAT) setCurrentScreen(Screen.SETUP);
    else if (currentScreen === Screen.SETUP) setCurrentScreen(Screen.HOME);
  };

  const handleEndSession = () => {
    setCurrentScreen(Screen.HOME);
    setSelectedBehavior(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full h-full max-w-md bg-white sm:h-[850px] sm:rounded-3xl sm:shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 z-10 relative w-full h-full">
          {currentScreen === Screen.HOME && (
            <HomeScreen onSelectCharacter={handleCharacterSelect} />
          )}
          
          {currentScreen === Screen.SETUP && (
            <SetupScreen 
              character={selectedCharacter}
              onBack={handleBack}
              onStartChat={handleBehaviorSelect}
            />
          )}

          {currentScreen === Screen.CHAT && selectedBehavior && (
            <ChatScreen 
              character={selectedCharacter}
              behavior={selectedBehavior}
              onEnd={handleEndSession}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;