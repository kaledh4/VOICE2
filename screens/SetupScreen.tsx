import React from 'react';
import { Character, Behavior } from '../types';
import { BEHAVIORS } from '../constants';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

interface SetupScreenProps {
  character: Character;
  onBack: () => void;
  onStartChat: (behavior: Behavior) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ character, onBack, onStartChat }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Character */}
      <div className={`relative pt-12 pb-8 px-6 rounded-b-[3rem] ${character.themeColor} shadow-lg text-white`}>
        <button 
          onClick={onBack}
          className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
        >
          <ArrowRight className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex items-center gap-4">
          <img 
            src={character.avatarUrl} 
            alt={character.name} 
            className="w-20 h-20 rounded-full border-4 border-white/40 bg-white" 
          />
          <div>
            <h2 className="text-2xl font-bold">أهلاً يا صديقي!</h2>
            <p className="text-white/90 text-sm">أنا {character.name}، عن ماذا سنتحدث اليوم؟</p>
          </div>
        </div>
      </div>

      {/* Behaviors List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        <h3 className="text-xl font-bold text-gray-800 mb-4">اختر المهمة:</h3>
        
        {BEHAVIORS.map((behavior, index) => (
          <motion.button
            key={behavior.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartChat(behavior)}
            className="w-full bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-all text-right shadow-sm"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
              {behavior.emoji}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">{behavior.title}</h4>
              <p className="text-xs text-gray-500">{behavior.description}</p>
            </div>
            <Star className="w-5 h-5 text-gray-300 fill-current" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SetupScreen;