import React, { useEffect, useRef, useState } from 'react';
import { Character, Behavior } from '../types';
import { LiveSessionManager } from '../services/liveClient';
import AudioVisualizer from '../components/AudioVisualizer';
import { Mic, MicOff, PhoneOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatScreenProps {
  character: Character;
  behavior: Behavior;
  onEnd: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ character, behavior, onEnd }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const sessionRef = useRef<LiveSessionManager | null>(null);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        if (!process.env.API_KEY) {
          throw new Error("API Key Missing");
        }

        const systemInstruction = `
          ${character.systemPromptBase}
          المهمة الحالية: ${behavior.promptContext}
          تعليمات هامة:
          1. تحدث باللغة العربية دائماً.
          2. كن قصيراً في ردودك (جملتين أو ثلاثة كحد أقصى) لتترك مجالاً للطفل ليتحدث.
          3. استخدم كلمات بسيطة ومشجعة.
          4. لا تخرج عن الشخصية أبداً.
          5. إذا قاطعك الطفل، توقف واستمع له.
        `;

        sessionRef.current = new LiveSessionManager(process.env.API_KEY, (vol) => {
          if (mounted) setVolume(vol);
        });

        await sessionRef.current.connect(systemInstruction, character.voiceName);
        if (mounted) setIsConnected(true);

      } catch (err: any) {
        const errorText = err.toString() || err.message || "";
        let errorMessage = "فشل الاتصال. تأكد من إعداد مفتاح API والسماح باستخدام الميكروفون.";
        let isKnownError = false;

        // Handle specific error messages
        if (errorText.includes("Requested device not found") || errorText.includes("NotFoundError")) {
          errorMessage = "لم يتم العثور على ميكروفون. يرجى التأكد من توصيل الميكروفون والسماح للمتصفح باستخدامه.";
          isKnownError = true;
        } else if (errorText.includes("Permission denied") || errorText.includes("NotAllowedError")) {
          errorMessage = "تم رفض إذن الوصول للميكروفون. يرجى السماح بالتسجيل الصوتي من إعدادات المتصفح.";
          isKnownError = true;
        } else if (errorText.includes("API Key Missing")) {
          errorMessage = "مفتاح API مفقود. يرجى التأكد من إضافة GEMINI_API_KEY في ملف .env";
          isKnownError = true;
        }

        // Only log unexpected errors to console to avoid noise
        if (!isKnownError) {
          console.error("Connection failed", err);
        }

        if (mounted) setError(errorMessage);
      }
    };

    initSession();

    return () => {
      mounted = false;
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, behavior]);

  const toggleMic = () => {
    // Note: The simple Live Client implementation above assumes constant streaming. 
    // Muting in a real app would involve suspending the context or setting Gain to 0.
    // For visual feedback here:
    setIsMicMuted(!isMicMuted);
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b ${character.themeColor.replace('bg-', 'from-').replace('500', '50')} to-white relative`}>

      {/* Background decoration specific to character theme */}
      <div className={`absolute top-0 w-full h-1/2 ${character.themeColor} rounded-b-[40%] shadow-2xl z-0 transition-all duration-1000`} style={{ opacity: isConnected ? 0.9 : 0.7 }}></div>

      {/* Header Actions */}
      <div className="relative z-10 flex justify-between items-center p-6 text-white">
        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold">مباشر</span>
        </div>
        <button
          onClick={onEnd}
          className="p-3 bg-red-500/20 hover:bg-red-500 rounded-full backdrop-blur-md transition-colors"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Main Avatar Area */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-8 border-white/30 shadow-2xl overflow-hidden bg-white">
            <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-purple-900 px-6 py-2 rounded-full shadow-lg border border-purple-100 whitespace-nowrap">
            <h3 className="font-bold text-lg">{character.name}</h3>
          </div>
        </motion.div>

        {/* Visualizer / Connection State */}
        <div className="h-48 flex items-center justify-center">
          {error ? (
            <div className="text-red-500 bg-white/80 p-6 rounded-xl flex flex-col items-center gap-2 max-w-xs text-center shadow-lg">
              <AlertCircle className="w-8 h-8" />
              <p>{error}</p>
            </div>
          ) : !isConnected ? (
            <div className="flex flex-col items-center text-purple-700 animate-pulse">
              <p className="text-lg font-bold">جاري الاتصال...</p>
              <p className="text-sm">نجهز المركبة الفضائية 🚀</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <AudioVisualizer volume={volume} colorClass={character.themeColor} />
              <p className="mt-4 text-gray-500 font-medium animate-pulse">تحدث الآن، أنا أسمعك...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-8 pb-12 z-10 flex justify-center gap-6">
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`p-6 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 ${isMicMuted ? 'bg-gray-200 text-gray-500' : 'bg-white text-purple-600'
            }`}
        >
          {isMicMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

    </div>
  );
};

export default ChatScreen;