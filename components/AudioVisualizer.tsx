import React from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  volume: number; // 0 to ~100+
  colorClass: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, colorClass }) => {
  // Normalize volume for visual scaling
  const scale = 1 + Math.min(volume / 50, 1.5);

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
       {/* Outer Ripple */}
      <motion.div
        animate={{
          scale: [1, scale * 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute w-full h-full rounded-full opacity-20 ${colorClass}`}
      />
       {/* Inner Pulse */}
      <motion.div
        animate={{
          scale: scale,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-32 h-32 rounded-full ${colorClass} bg-opacity-80 flex items-center justify-center shadow-lg backdrop-blur-sm border-4 border-white/30`}
      >
        <span className="text-4xl">🎙️</span>
      </motion.div>
    </div>
  );
};

export default AudioVisualizer;