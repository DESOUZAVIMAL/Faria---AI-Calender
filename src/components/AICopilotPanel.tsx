import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Calendar, 
  Check,
  AlertCircle,
  Mic,
  Volume2,
  TrendingUp,
  Gauge
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  type?: "text" | "tool_call" | "suggestion" | "thinking" | "generative_widget";
  toolInfo?: {
    toolName: string;
    params: Record<string, string>;
    status: "pending" | "approved" | "rejected";
  };
  widgetData?: {
    outliers: { name: string; tz: string; diff: number; coefficient: number }[];
    recommendedGap: string;
  };
}

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeammates: string[];
}

export default function AICopilotPanel({ isOpen, onClose, selectedTeammates }: AICopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "ai",
      text: "Hello! I am your Faria AI Assistant. I can scan timezone matrices, analyze team availability, and propose perfect meet-up coordinates.",
      type: "text"
    },
    {
      id: "m2",
      sender: "ai",
      text: "How can I help you sync your remote colleagues today?",
      type: "text"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [overlapThreshold, setOverlapThreshold] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isListening]);

  const suggestionChips = [
    "Find 45m with everyone",
    "Identify tomorrow's outliers",
    "Render timezone outlier chart",
  ];

  // Neural Network Nodes
  const nodes = [
    { id: 'calendar', label: 'GLOBAL CALENDAR', x: 20, y: 35 },
    { id: 'ops', label: 'OPERATIONS', x: 55, y: 20 },
    { id: 'memory', label: 'TEAM MEMORY', x: 85, y: 35 },
    { id: 'velocity', label: 'VELOCITY', x: 25, y: 70 },
    { id: 'crm', label: 'CLIENT CRM', x: 88, y: 75 },
  ];

  // --- DENSE NEURAL WAVES ---
  // We use a large array of paths with varying bezier curves to create a dense, sweeping horizontal web.
  // Using Faria Plum (#37023c), Dark Plum (#391638), Pink (#E837AC), and Yellow (#F7D35F) for depth.
  const denseWaves = [
    // Deep background layer
    { path: "M-10,40 C30,10 70,80 110,40", color: "#552859", opacity: 0.6, width: "0.8", duration: 7, delay: 0 },
    { path: "M-10,60 C20,90 80,10 110,60", color: "#391638", opacity: 0.8, width: "1.2", duration: 8, delay: 1 },
    { path: "M-10,50 C40,20 60,80 110,50", color: "#552859", opacity: 0.7, width: "0.9", duration: 6, delay: 0.5 },
    // Mid layer
    { path: "M-10,30 C30,70 70,30 110,70", color: "#E837AC", opacity: 0.4, width: "0.4", duration: 5, delay: 0.2 },
    { path: "M-10,70 C40,30 60,70 110,30", color: "#E837AC", opacity: 0.3, width: "0.5", duration: 5.5, delay: 1.2 },
    // Core energetic layer
    { path: "M-10,50 C20,40 80,60 110,50", color: "#F78843", opacity: 0.6, width: "0.2", duration: 4, delay: 0.3 },
    { path: "M-10,50 C40,60 60,40 110,50", color: "#F7D35F", opacity: 0.5, width: "0.2", duration: 3.5, delay: 0.7 },
    { path: "M-10,50 C10,10 90,90 110,50", color: "#E837AC", opacity: 0.6, width: "0.25", duration: 4.2, delay: 0.1 },
  ];

  const handleTriggerVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    setVoiceText("Listening...");

    setTimeout(() => {
      setVoiceText("Listening: \"Find optimal gaps with Cole and Liam tomorrow...\"");
      setTimeout(() => {
        setVoiceText("Captured: \"Render timezone outlier chart for the team\"");
        setTimeout(() => {
          setIsListening(false);
          handleSend("Render timezone outlier chart for the team");
        }, 1200);
      }, 1600);
    }, 1400);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: text, type: "text" };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const thinkingMsg: Message = { id: `thinking-${Date.now()}`, sender: "ai", text: "Scanning 7-day teammate rosters...", type: "thinking" };
    setMessages(prev => [...prev, thinkingMsg]);

    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: text, selectedTeammates, currentUserTimezone: localTz })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to receive copilot answer.");
        return res.json();
      })
      .then((data) => {
        setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));
        const aiMsg: Message = { id: `ai-${Date.now()}`, sender: "ai", text: data.reply || "Done.", type: "text" };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      })
      .catch((err) => {
        console.error("Copilot request error:", err);
        setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));
        const aiMsg: Message = { id: `ai-err-${Date.now()}`, sender: "ai", text: `Error: ${err.message}`, type: "text" };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      });
  };

  const handleResolveTool = (msgId: string, finalStatus: "approved" | "rejected") => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.toolInfo) {
        return { ...m, toolInfo: { ...m.toolInfo, status: finalStatus } };
      }
      return m;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-faria-plum border-l border-faria-pink/20 shadow-[0_0_50px_rgba(55,2,60,0.8)] z-50 flex flex-col justify-between overflow-hidden">
      
      {/* --- BACKGROUND NEURAL MESH (Dense horizontal waves) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-faria-darkPlum">
        
        {/* Deep ambient background glows */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-faria-pink/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-faria-orange/10 rounded-full blur-[80px]" />

        {/* Central Core Glow */}
        <motion.div 
          className="absolute w-72 h-72 rounded-full flex items-center justify-center"
          animate={{ scale: isTyping || isListening ? 1.05 : 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <div className={`absolute w-40 h-40 rounded-full blur-[50px] transition-all duration-700 ${isTyping || isListening ? 'bg-faria-pink/40' : 'bg-faria-plum/80'}`} />
        </motion.div>

        {/* Dense Wave SVG Canvas */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="wave-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#E837AC" floodOpacity="0.8" />
            </filter>
          </defs>

          {denseWaves.map((wave, i) => (
            <motion.path
              key={`wave-${i}`}
              d={wave.path}
              fill="transparent"
              stroke={wave.color}
              strokeWidth={wave.width}
              vectorEffect="non-scaling-stroke"
              filter={wave.color === "#E837AC" || wave.color === "#F78843" ? "url(#wave-glow)" : ""}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isTyping || isListening ? wave.opacity + 0.2 : wave.opacity,
                scaleY: isTyping || isListening ? [1, 1.15, 0.9, 1] : [1, 1.05, 0.95, 1],
                y: isTyping || isListening ? [0, -3, 3, 0] : [0, -1, 1, 0]
              }}
              transition={{ 
                opacity: { duration: 1 },
                scaleY: { duration: wave.duration, repeat: Infinity, ease: "easeInOut", delay: wave.delay },
                y: { duration: wave.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: wave.delay }
              }}
            />
          ))}
          
          {/* Traveling Data Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              r="0.25"
              fill={i % 3 === 0 ? "#F7D35F" : "#E837AC"} // Faria Yellow or Pink
              className="opacity-80"
              style={{ filter: `drop-shadow(0px 0px 3px ${i % 3 === 0 ? '#F7D35F' : '#E837AC'})` }}
              animate={{
                cx: ['-5%', '105%'],
                cy: ['45%', '55%', '40%', '60%']
              }}
              transition={{
                cx: { duration: 8 + i * 1.5, repeat: Infinity, ease: "linear", delay: i * 0.5 },
                cy: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
              }}
            />
          ))}
        </svg>

        {/* Floating Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute flex items-center gap-2"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          >
            <div className={`w-2 h-2 rounded-full bg-faria-pink shadow-[0_0_10px_rgba(232,55,172,0.8)] ${isTyping || isListening ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-bold text-faria-paper/90 tracking-widest uppercase border border-faria-pink/20 bg-faria-darkPlum/80 px-2 py-0.5 rounded shadow-lg backdrop-blur-md">
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* --- FOREGROUND CHAT UI --- */}
      {/* Header */}
      <div className="relative z-10 p-4.5 border-b border-faria-pink/10 flex items-center justify-between bg-faria-darkPlum/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center shadow-[0_0_15px_rgba(232,55,172,0.4)]">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
              AI Copilot Assistant
            </h3>
            <span className="text-[10px] text-faria-paper/70 font-mono">Faria Engine v1.0</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-faria-paper/60 hover:text-white transition-all">
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages Scroll View */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4.5 space-y-4.5 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isAI = m.sender === "ai";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {isAI && (
                  <div className="w-7 h-7 rounded-lg bg-faria-pink/20 border border-faria-pink/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(232,55,172,0.2)]">
                    <Bot className="h-4 w-4 text-faria-pink" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  {m.type === "thinking" ? (
                    <div className="p-3 rounded-2xl bg-faria-darkPlum/80 border border-faria-pink/20 text-xs text-faria-paper/80 italic flex items-center gap-2.5 backdrop-blur-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-faria-orange rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-faria-pink rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-faria-yellow rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span>{m.text}</span>
                    </div>
                  ) : m.type === "generative_widget" && m.widgetData ? (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-faria-pink/30 bg-faria-darkPlum/90 p-4 space-y-4 shadow-xl text-xs backdrop-blur-md">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-4 w-4 text-faria-yellow animate-pulse" />
                          <span className="text-[10px] uppercase font-bold text-white">Generative Overlap Engine</span>
                        </div>
                      </div>
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-faria-paper/70">Prune Distance Threshold:</span>
                          <span className="text-faria-yellow font-mono font-bold">&gt; {overlapThreshold} hrs</span>
                        </div>
                        <input type="range" min="1" max="15" value={overlapThreshold} onChange={(e) => setOverlapThreshold(Number(e.target.value))} className="w-full accent-faria-yellow" />
                      </div>
                      <div className="space-y-2">
                        {m.widgetData.outliers.map((o, idx) => {
                          const isHighOutlier = Math.abs(o.diff) > overlapThreshold;
                          return (
                            <div key={idx} className={`p-2 rounded-lg border transition-all ${isHighOutlier ? "bg-faria-orange/20 border-faria-orange/30 text-faria-paper" : "bg-white/5 border-white/5 text-faria-paper/80"}`}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-[11px]">{o.name} <span className="text-[10px] opacity-60">({o.tz})</span></span>
                                <span className="font-mono text-[10px] font-bold">{o.diff > 0 ? `+${o.diff}` : o.diff} hr</span>
                              </div>
                              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${isHighOutlier ? "bg-faria-orange" : "bg-gradient-to-r from-faria-pink to-faria-yellow"}`} style={{ width: `${Math.min(100, Math.max(10, o.coefficient))}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bg-faria-yellow/10 border border-faria-yellow/20 py-1.5 rounded-lg px-2 text-center text-faria-yellow text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Recommended: {m.widgetData.recommendedGap}
                      </div>
                    </motion.div>
                  ) : m.type === "tool_call" && m.toolInfo ? (
                    <div className="rounded-2xl border border-faria-pink/30 bg-faria-darkPlum/90 p-4 space-y-3 shadow-lg backdrop-blur-md">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-faria-pink" />
                          <span className="text-[10px] uppercase font-bold text-white">Google Workspace Sync</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px] text-faria-paper/80">
                        <div><strong className="text-white">Event:</strong> {m.toolInfo.params.Event}</div>
                        <div><strong className="text-white">Date:</strong> {m.toolInfo.params.Date}</div>
                        <div><strong className="text-white">Time:</strong> {m.toolInfo.params.Time}</div>
                      </div>
                      {m.toolInfo.status === "pending" ? (
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleResolveTool(m.id, "approved")} className="flex-1 py-1.5 bg-faria-pink text-white hover:bg-faria-pink/90 font-bold rounded-lg text-xs transition-colors">Approve</button>
                          <button onClick={() => handleResolveTool(m.id, "rejected")} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs transition-colors">Dismiss</button>
                        </div>
                      ) : m.toolInfo.status === "approved" ? (
                        <div className="bg-emerald-400/10 border border-emerald-400/20 py-1.5 rounded-lg text-emerald-400 text-[10px] font-bold flex justify-center gap-1.5"><Check className="h-3.5 w-3.5" /> Approved!</div>
                      ) : (
                        <div className="bg-rose-400/10 border border-rose-400/20 py-1.5 rounded-lg text-rose-400 text-[10px] font-bold flex justify-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Dismissed</div>
                      )}
                    </div>
                  ) : m.text ? (
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed border backdrop-blur-md shadow-lg ${m.sender === "user" ? "bg-gradient-to-tr from-faria-orange to-faria-pink border-faria-pink/50 text-white" : "bg-faria-darkPlum/80 border-white/10 text-faria-paper"}`}>
                      {m.text}
                    </div>
                  ) : null}
                </div>

                {/* User Avatar */}
                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-faria-orange/20 border border-faria-orange/40 flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-faria-orange" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isListening && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-faria-darkPlum/90 border border-faria-pink/30 text-xs text-white space-y-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold flex items-center gap-1.5 tracking-wider text-[10px] uppercase text-faria-yellow">
                <Volume2 className="h-4 w-4 animate-bounce" /> Listening ...
              </span>
            </div>
            <div className="h-10 flex items-center justify-center gap-1 pb-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [12, 38, 12], backgroundColor: ["#F78843", "#E837AC", "#F7D35F"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                  className="w-1.5 rounded-full"
                  style={{ height: "15px" }}
                />
              ))}
            </div>
            <p className="italic font-mono text-[11px] text-faria-paper text-center bg-black/40 py-1.5 px-2 rounded-lg border border-white/10">{voiceText}</p>
          </motion.div>
        )}
      </div>

      {/* Footer Area */}
      <div className="relative z-10 p-4 border-t border-white/10 space-y-3 bg-faria-darkPlum/95 backdrop-blur-xl text-xs">
        <div className="flex flex-wrap gap-1.5">
          {suggestionChips.map((s, idx) => (
            <button key={idx} onClick={() => handleSend(s)} className="text-[10px] font-medium bg-white/5 border border-white/10 hover:bg-faria-pink/20 hover:border-faria-pink/40 hover:text-white text-faria-paper/80 px-2.5 py-1 rounded-full transition-all">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 focus-within:border-faria-pink/50 transition-colors">
          <button onClick={handleTriggerVoice} className={`p-1.5 rounded-lg transition-all ${isListening ? "bg-faria-orange text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"}`}>
            <Mic className="h-3.5 w-3.5" />
          </button>
          <input type="text" placeholder="Type or tap mic..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(inputValue); }} className="flex-1 bg-transparent px-2 text-xs text-white placeholder-white/40 focus:outline-none" />
          <button onClick={() => handleSend(inputValue)} className="p-1.5 bg-gradient-to-tr from-faria-orange to-faria-pink text-white rounded-lg shadow-md hover:brightness-110 transition-all">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
