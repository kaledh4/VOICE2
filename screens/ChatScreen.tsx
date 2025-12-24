import React, { useEffect, useRef, useState } from 'react';
import { Character, Behavior } from '../types';
import { SpeechRecognitionService } from '../services/speechRecognition';
import { TTSService } from '../services/ttsService';
import { GoogleGenAI } from '@google/genai';
import AudioVisualizer from '../components/AudioVisualizer';
import { Mic, MicOff, PhoneOff, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatScreenProps {
  character: Character;
  behavior: Behavior;
  onEnd: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ character, behavior, onEnd }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);

  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const genAIRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Gemini
    genAIRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    // Initialize Speech Recognition
    speechServiceRef.current = new SpeechRecognitionService(
      (text) => {
        handleSendMessage(text);
      },
      () => {
        setIsListening(false);
      },
      (err) => {
        setError(JSON.stringify(err));
        setIsListening(false);
      }
    );

    // Initial greeting
    handleSendMessage("مرحباً! ابدأ المحادثة");

    return () => {
      TTSService.stop();
      if (speechServiceRef.current) speechServiceRef.current.stop();
    };
  }, [character, behavior]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setIsListening(false);

    // Create new messages array for the history
    const isInitial = text === "مرحباً! ابدأ المحادثة";
    const newUserMessage = { role: 'user' as const, text };
    const updatedMessages = isInitial ? messages : [...messages, newUserMessage];

    if (!isInitial) {
      setMessages(updatedMessages);
    }

    try {
      // Manual history management for the SDK
      const history = updatedMessages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const systemInstruction = `
        ${character.systemPromptBase}
        المهمة الحالية: ${behavior.promptContext}
        تعليمات هامة:
        1. تحدث باللغة العربية دائماً.
        2. كن قصيراً في ردودك (جملتين أو ثلاثة كحد أقصى) لتترك مجالاً للطفل ليتحدث.
        3. استخدم كلمات بسيطة ومشجعة.
        4. لا تخرج عن الشخصية أبداً.
        5. ابدأ المحادثة بترحيب حار ومناسب للمهمة.
      `;

      const result = await genAIRef.current.models.generateContent({
        model: "gemini-2.0-flash-exp",
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: history
      });

      const responseText = result.response.candidates[0].content.parts[0].text;

      const newModelMessage = { role: 'model' as const, text: responseText };
      setMessages(prev => [...prev, newModelMessage]);

      // Visual feedback for "speaking"
      startVolumeSimulation();
      await TTSService.speak(responseText);
      stopVolumeSimulation();

    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err);
      console.error("Gemini Error:", errorMsg);
      setError("حدث خطأ في الاتصال بالذكاء الاصطناعي.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      speechServiceRef.current?.stop();
    } else {
      setError(null);
      TTSService.stop(); // Stop any current speaking
      speechServiceRef.current?.start();
      setIsListening(true);
    }
  };

  // Simulated volume for visualizer during TTS
  const volumeInterval = useRef<any>(null);
  const startVolumeSimulation = () => {
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    volumeInterval.current = setInterval(() => {
      setVolume(Math.random() * 50 + 20);
    }, 100);
  };
  const stopVolumeSimulation = () => {
    if (volumeInterval.current) clearInterval(volumeInterval.current);
    setVolume(0);
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b ${character.themeColor.replace('bg-', 'from-').replace('500', '50')} to-white relative`}>

      <div className={`absolute top-0 w-full h-1/2 ${character.themeColor} rounded-b-[40%] shadow-2xl z-0 transition-all duration-1000`}></div>

      <div className="relative z-10 flex justify-between items-center p-6 text-white">
        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
          <span className={`w-2 h-2 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-400'} rounded-full`}></span>
          <span className="text-sm font-bold">{isListening ? 'أسمعك...' : 'متصل'}</span>
        </div>
        <button onClick={onEnd} className="p-3 bg-red-500/20 hover:bg-red-500 rounded-full backdrop-blur-md transition-colors">
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 relative px-6 text-center">
        <motion.div
          animate={isProcessing || volume > 0 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative mb-6"
        >
          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border-8 border-white/30 shadow-2xl overflow-hidden bg-white">
            <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-purple-900 px-6 py-1 rounded-full shadow-lg border border-purple-100 whitespace-nowrap">
            <h3 className="font-bold">{character.name}</h3>
          </div>
        </motion.div>

        <div className="min-h-[120px] flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 bg-white/90 p-4 rounded-xl flex flex-col items-center gap-2 shadow-lg max-w-xs">
                <AlertCircle className="w-6 h-6" />
                <p className="text-xs break-words">{error}</p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-purple-700">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="font-medium">أفكر...</p>
              </motion.div>
            ) : (
              <motion.div key="message" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xs">
                {lastMessage?.role === 'model' && (
                  <p className="text-gray-800 text-lg font-bold leading-relaxed bg-white/60 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
                    "{lastMessage.text}"
                  </p>
                )}
                {isListening && (
                  <p className="mt-4 text-purple-600 font-bold animate-pulse text-lg">أنا أسمعك.. ماذا تريد أن تقول؟</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-24 flex items-center justify-center mt-4">
          {volume > 0 && <AudioVisualizer volume={volume} colorClass={character.themeColor} />}
        </div>
      </div>

      <div className="p-8 pb-12 z-10 flex justify-center gap-6">
        <button
          onClick={toggleMic}
          disabled={isProcessing}
          className={`p-6 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 ${isListening ? 'bg-red-500 text-white' : 'bg-white text-purple-600'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;