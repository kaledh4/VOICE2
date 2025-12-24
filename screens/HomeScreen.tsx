import React, { useState } from 'react';
import { CHARACTERS } from '../constants';
import { Character } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info, ChevronDown, ChevronUp, UserCircle2 } from 'lucide-react';

interface HomeScreenProps {
  onSelectCharacter: (char: Character) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectCharacter }) => {
  const [showParentInfo, setShowParentInfo] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50 via-purple-50 to-white overflow-y-auto no-scrollbar relative">
      
      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-purple-100 shadow-sm">
         <div className="p-6 pb-4">
            <h1 className="text-3xl font-black text-purple-900 mb-2 font-['Tajawal'] flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-500 fill-current" />
              رحلة الأبطال
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              مرحباً بك في رحلة الأبطال! <br/>
              <span className="text-sm text-gray-500">استعد لمغامرة تعليمية ممتعة مع أبطالك المفضلين!</span>
            </p>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const element = document.getElementById('characters-grid');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition"
            >
              ابدأ المغامرة الآن
            </motion.button>
         </div>
      </div>

      <div className="p-6 space-y-8 pb-24">
        
        {/* Parents Info Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 transition-all">
          <button 
            onClick={() => setShowParentInfo(!showParentInfo)}
            className="flex items-center justify-between w-full text-blue-800 font-bold"
          >
            <div className="flex items-center gap-2">
              <UserCircle2 className="w-6 h-6" />
              <span>معلومات للآباء والأمهات</span>
            </div>
            {showParentInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showParentInfo && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 text-blue-900/80 text-sm leading-relaxed border-t border-blue-200 mt-3">
                  <p className="mb-2">هذا التطبيق مصمم لتعزيز السلوكيات الإيجابية لدى الأطفال بطريقة تفاعلية وآمنة باستخدام الذكاء الاصطناعي.</p>
                  <p>نوصي بالمراقبة الأبوية أثناء الاستخدام لضمان تجربة مثمرة.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Characters Grid */}
        <div id="characters-grid">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
             <span>اختر بطلك المفضل</span>
             <span className="text-2xl animate-bounce">👇</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {CHARACTERS.map((char, index) => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCharacter(char)}
                className="group flex flex-col items-center bg-white rounded-3xl shadow-md border-2 border-transparent hover:border-purple-300 transition-all overflow-hidden"
              >
                <div className={`w-full h-32 ${char.themeColor} relative overflow-hidden`}>
                   <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover mix-blend-overlay opacity-50 group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 flex items-center justify-center mt-2">
                      <img src={char.avatarUrl} alt={char.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                   </div>
                </div>
                
                <div className="p-4 text-center w-full">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{char.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{char.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeScreen;