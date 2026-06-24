import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, X } from 'lucide-react';

export default function AICopilotTab() {
  const [isListening, setIsListening] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'analyzing' | 'resolved'>('idle');

  // Floating Nodes (Restored to the exact layout from your preferred screenshot)
  const nodes = [
    { id: 'calendar', label: 'GLOBAL CALENDAR', x: 22, y: 32 },
    { id: 'ops', label: 'OPERATIONS', x: 58, y: 18 },
    { id: 'memory', label: 'TEAM MEMORY', x: 82, y: 32 },
    { id: 'velocity', label: 'VELOCITY', x: 28, y: 72 },
    { id: 'crm', label: 'CLIENT CRM', x: 85, y: 78 },
  ];

  // DENSE HORIZONTAL WAVES
  // Every path flows strictly from left (x=-10) to right (x=110) to maintain the horizontal Spline aesthetic.
  // Darker, thicker lines in the back; thinner, glowing lines in the front.
  const waves = [
    // --- Deep, Dark Background Layer (High density, very thick) ---
    { path: "M-10,40 C 30,70 70,30 110,60", color: "#1d0020", opacity: 0.9, width: "1.8", duration: 8, delay: 0 },
    { path: "M-10,60 C 40,20 60,80 110,40", color: "#2a002e", opacity: 0.8, width: "1.5", duration: 9, delay: 1 },
    { path: "M-10,50 C 20,80 80,20 110,50", color: "#4c0552", opacity: 0.6, width: "1.2", duration: 7, delay: 0.5 },
    { path: "M-10,30 C 50,60 50,40 110,70", color: "#1d0020", opacity: 0.9, width: "2.0", duration: 8.5, delay: 2 },
    { path: "M-10,70 C 50,40 50,60 110,30", color: "#2a002e", opacity: 0.7, width: "1.4", duration: 7.5, delay: 1.5 },
    { path: "M-10,20 C 40,70 80,40 110,80", color: "#4c0552", opacity: 0.5, width: "1.0", duration: 9.5, delay: 0.8 },
    
    // --- Mid Layer (Subtle Faria Pink & Plum hints) ---
    { path: "M-10,45 C 30,25 70,75 110,45", color: "#E837AC", opacity: 0.25, width: "0.4", duration: 6, delay: 0.2 },
    { path: "M-10,55 C 40,85 60,15 110,55", color: "#E837AC", opacity: 0.2, width: "0.3", duration: 6.5, delay: 1.2 },
    { path: "M-10,35 C 20,55 80,45 110,65", color: "#F6AFDE", opacity: 0.15, width: "0.25", duration: 5.5, delay: 0.8 },
    { path: "M-10,65 C 20,45 80,55 110,35", color: "#E837AC", opacity: 0.2, width: "0.4", duration: 7, delay: 1.8 },
    { path: "M-10,48 C 30,48 70,52 110,52", color: "#F6AFDE", opacity: 0.15, width: "0.3", duration: 5, delay: 0.5 },
    
    // --- Fine, Bright Action Lines (Electric Data Paths) ---
    { path: "M-10,50 C 35,35 65,65 110,50", color: "#E837AC", opacity: 0.6, width: "0.15", duration: 4, delay: 0, glowing: true },
    { path: "M-10,52 C 45,60 55,40 110,48", color: "#F78843", opacity: 0.5, width: "0.1", duration: 4.5, delay: 0.7 },
    { path: "M-10,48 C 25,65 75,35 110,52", color: "#E837AC", opacity: 0.7, width: "0.12", duration: 3.5, delay: 0.3, glowing: true },
    { path: "M-10,50 C 15,30 85,70 110,50", color: "#F7D35F", opacity: 0.4, width: "0.1", duration: 5, delay: 0.9 },
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
    <div className="h-full min-h-[550px] w-full bg-[#37023c] relative overflow-hidden flex flex-col items-center justify-center font-sans border border-white/10 rounded-2xl p-6">
      
      {/* --- FLUID HORIZONTAL WAVE BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        
        {/* Faint Concentric Rings (Restored from your preferred screenshot) */}
        <motion.div 
          className="absolute w-72 h-72 rounded-full border-[0.5px] border-white/5 flex items-center justify-center"
          animate={{ rotate: 360, scale: aiState === 'analyzing' ? 1.05 : 1 }}
          transition={{ rotate: { duration: 50, repeat: Infinity, ease: "linear" }, scale: { duration: 1 } }}
        >
          <div className="w-56 h-56 rounded-full border-[0.5px] border-white/10 border-dashed" />
          <div className="absolute w-32 h-32 rounded-full border-[0.5px] border-faria-pink/10" />
        </motion.div>

        {/* High-Density Horizontal Spline Waves */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#E837AC" floodOpacity="0.8" />
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
              filter={wave.glowing ? "url(#neon-glow)" : ""}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: aiState === 'analyzing' ? wave.opacity + 0.2 : wave.opacity,
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
          
          {/* Animated Particles flowing horizontally along the waves */}
          {[...Array(12)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              r="0.2"
              fill={i % 2 === 0 ? "#F7D35F" : "#fff"}
              className="opacity-70"
              style={{ filter: 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))' }}
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

        {/* Floating Nodes (Restored to simple dots & labels) */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute flex items-center gap-3"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          >
            <div className={`w-2.5 h-2.5 rounded-full bg-faria-pink shadow-[0_0_12px_rgba(232,55,172,0.8)] ${aiState === 'analyzing' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold text-faria-paper/80 tracking-widest uppercase border border-white/5 bg-white/5 px-2.5 py-1 rounded backdrop-blur-md">
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
            className="relative z-10 bg-[#230727]/95 border border-faria-pink/30 p-6 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(232,55,172,0.15)] backdrop-blur-xl mt-[-10%]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-faria-pink font-bold">Generative Consensus</span>
                <h3 className="text-white font-bold text-lg leading-tight mt-1">Design & Engineering Sync</h3>
              </div>
              <button onClick={() => setAiState('idle')} className="text-faria-paper/50 hover:text-faria-pink transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-faria-pink to-[#37023c]" />
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-faria-paper font-medium">Tomorrow, Oct 24</span>
                <span className="text-faria-pink font-bold">9:30 AM EST / 2:30 PM BST</span>
              </div>
              <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden flex">
                <div className="w-[30%] bg-white/10" />
                <div className="w-[20%] bg-faria-pink shadow-[0_0_10px_rgba(232,55,172,0.5)]" />
                <div className="w-[50%] bg-white/10" />
              </div>
            </div>

            <button className="w-full py-3 bg-faria-pink/20 hover:bg-faria-pink/40 border border-faria-pink/50 text-white font-bold text-sm rounded-xl transition-all">
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
              <p className="text-2xl sm:text-3xl text-white font-display font-semibold tracking-tight leading-snug drop-shadow-lg">
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
                className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-faria-pink' : 'bg-faria-paper/30'}`}
                animate={{ scale: isListening ? [1, 1.5, 1] : 1, opacity: isListening ? [0.5, 1, 0.5] : 1 }}
                transition={{ duration: 0.6, repeat: isListening ? Infinity : 0, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- INPUT BAR (Bottom Docked) --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20">
        <div className="bg-[#230727]/90 border border-faria-pink/20 rounded-2xl p-2 flex items-center gap-2 backdrop-blur-xl shadow-2xl">
          <button 
            onClick={handleVoiceToggle}
            className={`p-3 rounded-xl transition-all ${isListening || aiState === 'analyzing' ? 'bg-faria-pink text-white animate-pulse shadow-[0_0_20px_rgba(232,55,172,0.4)]' : 'bg-white/5 text-faria-paper/70 hover:bg-white/10 hover:text-faria-pink'}`}
          >
            <Mic size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Ask Copilot to negotiate times, summarize agendas, or build workflows..."
            className="flex-1 bg-transparent border-none outline-none text-faria-paper text-sm font-medium px-2 placeholder:text-faria-paper/30"
            disabled={isListening || aiState === 'analyzing'}
          />
          <button className="p-3 rounded-xl bg-white/5 text-faria-paper/70 hover:bg-white/10 hover:text-white transition-all">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
