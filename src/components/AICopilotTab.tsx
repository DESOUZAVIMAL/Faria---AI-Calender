import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, X } from 'lucide-react';

export default function AICopilotTab() {
  const [isListening, setIsListening] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'analyzing' | 'resolved'>('idle');

  const nodes = [
    { id: 'calendar', label: 'GLOBAL CALENDAR', x: 22, y: 32 },
    { id: 'ops', label: 'OPERATIONS', x: 58, y: 18 },
    { id: 'memory', label: 'TEAM MEMORY', x: 82, y: 32 },
    { id: 'velocity', label: 'VELOCITY', x: 28, y: 72 },
    { id: 'crm', label: 'CLIENT CRM', x: 85, y: 78 },
  ];

  // Warm light background + dark flowing waves
  // Deep bg layers use dark coffee/charcoal browns; accent lines use rich dark versions of brand colors
  const waves = [
    // Deep background — dark warm charcoals
    { path: "M-10,40 C 30,70 70,30 110,60", color: "#2D1810", opacity: 0.85, width: "1.8", duration: 8, delay: 0 },
    { path: "M-10,60 C 40,20 60,80 110,40", color: "#3D2210", opacity: 0.75, width: "1.5", duration: 9, delay: 1 },
    { path: "M-10,50 C 20,80 80,20 110,50", color: "#4A2B14", opacity: 0.55, width: "1.2", duration: 7, delay: 0.5 },
    // Mid layer — dark wine/maroon
    { path: "M-10,45 C 30,25 70,75 110,45", color: "#6B1A3A", opacity: 0.35, width: "0.5", duration: 6, delay: 0.2 },
    { path: "M-10,55 C 40,85 60,15 110,55", color: "#6B1A3A", opacity: 0.28, width: "0.4", duration: 6.5, delay: 1.2 },
    // Fine action lines — dark rich tones
    { path: "M-10,50 C 35,35 65,65 110,50", color: "#7A1F40", opacity: 0.75, width: "0.2", duration: 4, delay: 0, glowing: true },
    { path: "M-10,52 C 45,60 55,40 110,48", color: "#6B3508", opacity: 0.65, width: "0.15", duration: 4.5, delay: 0.7 },
    { path: "M-10,50 C 15,30 85,70 110,50", color: "#5C4210", opacity: 0.55, width: "0.15", duration: 5, delay: 0.9 },
  ];

  const handleVoiceToggle = () => {
    if (aiState === 'idle' || aiState === 'resolved') {
      setAiState('listening');
      setIsListening(true);
      setPrompt('');

      setTimeout(() => setPrompt('Sync Design & Engineering...'), 1500);
      setTimeout(() => {
        setPrompt('Sync Design & Engineering for Project Alpha launch across London and NYC.');
        setIsListening(false);
        setAiState('analyzing');
        setTimeout(() => setAiState('resolved'), 3000);
      }, 3000);
    } else {
      setAiState('idle');
      setIsListening(false);
      setPrompt('');
    }
  };

  return (
    <div className="h-full min-h-[550px] w-full bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E6] to-[#FFF8F0] relative overflow-hidden flex flex-col items-center justify-center font-sans border border-stone-200/80 rounded-2xl p-6">

      {/* --- FLUID HORIZONTAL WAVE BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">

        {/* Concentric Rings — dark warm borders on light bg */}
        <motion.div
          className="absolute w-72 h-72 rounded-full border-[0.5px] border-stone-400/20 flex items-center justify-center"
          animate={{ rotate: 360, scale: aiState === 'analyzing' ? 1.05 : 1 }}
          transition={{ rotate: { duration: 50, repeat: Infinity, ease: "linear" }, scale: { duration: 1 } }}
        >
          <div className="w-56 h-56 rounded-full border-[0.5px] border-stone-500/25 border-dashed" />
          <div className="absolute w-32 h-32 rounded-full border-[0.5px] border-[#7A1F40]/15" />
        </motion.div>

        {/* High-Density Horizontal Spline Waves */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="dark-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#7A1F40" floodOpacity="0.5" />
            </filter>
          </defs>

          {waves.map((wave, i) => (
            <motion.path
              key={`wave-${i}`}
              d={wave.path}
              fill="transparent"
              stroke={wave.color}
              strokeWidth={wave.width}
              vectorEffect="non-scaling-stroke"
              filter={wave.glowing ? "url(#dark-glow)" : ""}
              initial={{ opacity: 0 }}
              animate={{
                opacity: aiState === 'analyzing' ? wave.opacity + 0.15 : wave.opacity,
                scaleY: aiState === 'analyzing' ? [1, 1.1, 0.95, 1] : [1, 1.05, 0.98, 1],
                y: aiState === 'analyzing' ? [0, -2, 2, 0] : [0, -1, 1, 0]
              }}
              transition={{
                opacity: { duration: 1 },
                scaleY: { duration: wave.duration, repeat: Infinity, ease: "easeInOut", delay: wave.delay },
                y: { duration: wave.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: wave.delay }
              }}
            />
          ))}

          {/* Animated Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              r="0.2"
              fill={i % 2 === 0 ? "#6B3508" : "#7A1F40"}
              className="opacity-60"
              style={{ filter: 'drop-shadow(0px 0px 2px rgba(107,53,8,0.6))' }}
              animate={{
                cx: ['-5%', '105%'],
                cy: ['45%', '55%', '42%', '58%']
              }}
              transition={{
                cx: { duration: 12 + i * 2, repeat: Infinity, ease: "linear", delay: i * 1.2 },
                cy: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
              }}
            />
          ))}
        </svg>

        {/* Floating Nodes — dark text on warm light chip */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute flex items-center gap-3"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          >
            <div className={`w-2.5 h-2.5 rounded-full bg-[#7A1F40] shadow-[0_0_10px_rgba(122,31,64,0.5)] ${aiState === 'analyzing' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold text-stone-700 tracking-widest uppercase border border-stone-300/60 bg-white/70 px-2.5 py-1 rounded backdrop-blur-md shadow-sm">
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* --- GENERATIVE UI MOCK (Appears when resolved) --- */}
      <AnimatePresence>
        {aiState === 'resolved' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="relative z-10 bg-white/95 border border-stone-200/80 p-6 rounded-2xl w-full max-w-lg shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl mt-[-10%]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#7A1F40] font-bold">Generative Consensus</span>
                <h3 className="text-stone-800 font-bold text-lg leading-tight mt-1">Design & Engineering Sync</h3>
              </div>
              <button onClick={() => setAiState('idle')} className="text-stone-400 hover:text-[#7A1F40] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/70 mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#7A1F40] to-transparent" />
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-stone-700 font-medium">Tomorrow, Oct 24</span>
                <span className="text-[#7A1F40] font-bold">9:30 AM EST / 2:30 PM BST</span>
              </div>
              <div className="w-full bg-stone-200/60 h-2 rounded-full overflow-hidden flex">
                <div className="w-[30%] bg-stone-200/50" />
                <div className="w-[20%] bg-[#7A1F40] shadow-[0_0_10px_rgba(122,31,64,0.4)]" />
                <div className="w-[50%] bg-stone-200/50" />
              </div>
            </div>

            <button className="w-full py-3 bg-[#7A1F40]/12 hover:bg-[#7A1F40]/22 border border-[#7A1F40]/40 text-[#7A1F40] font-bold text-sm rounded-xl transition-all">
              Lock & Inject to Calendar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CENTRAL PROMPT TEXT & VOICE INDICATOR --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-6 text-center z-10 pointer-events-none mt-16">
        <AnimatePresence>
          {prompt && aiState !== 'resolved' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-2xl sm:text-3xl text-stone-800 font-display font-semibold tracking-tight leading-snug drop-shadow-sm">
                "{prompt}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {prompt && aiState !== 'resolved' && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-[#7A1F40]' : 'bg-stone-400'}`}
                animate={{ scale: isListening ? [1, 1.5, 1] : 1, opacity: isListening ? [0.5, 1, 0.5] : 1 }}
                transition={{ duration: 0.6, repeat: isListening ? Infinity : 0, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- INPUT BAR (Bottom Docked) --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20">
        <div className="bg-white/90 border border-stone-300/60 rounded-2xl p-2 flex items-center gap-2 backdrop-blur-xl shadow-lg">
          <button
            onClick={handleVoiceToggle}
            className={`p-3 rounded-xl transition-all ${isListening || aiState === 'analyzing' ? 'bg-[#7A1F40] text-white animate-pulse shadow-[0_0_20px_rgba(122,31,64,0.35)]' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-[#7A1F40]'}`}
          >
            <Mic size={20} />
          </button>
          <input
            type="text"
            placeholder="Ask Copilot to negotiate times, summarize agendas, or build workflows..."
            className="flex-1 bg-transparent border-none outline-none text-stone-800 text-sm font-medium px-2 placeholder:text-stone-400"
            disabled={isListening || aiState === 'analyzing'}
          />
          <button className="p-3 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-[#7A1F40] transition-all">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
