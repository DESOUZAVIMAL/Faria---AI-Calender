import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Calendar, 
  ArrowRight,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  Mic,
  MicOff,
  Volume2,
  Sliders,
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
  const [overlapThreshold, setOverlapThreshold] = useState(4); // Editable slider inside Generative UI
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll
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

  // Siri Voice activation simulator
  const handleTriggerVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    setVoiceText("Listening...");

    // Stage 1: Simulating voice stream
    setTimeout(() => {
      setVoiceText("Listening: \"Find optimal gaps with Cole and Liam tomorrow...\"");
      
      // Stage 2: Capture voice successfully
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
    
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text,
      type: "text"
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const thinkingMsg: Message = {
      id: `thinking-${Date.now()}`,
      sender: "ai",
      text: "Scanning 7-day teammate rosters & evaluating cross-clock overlap coefficients...",
      type: "thinking"
    };
    
    setMessages(prev => [...prev, thinkingMsg]);

    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    fetch("/api/copilot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userMessage: text,
        selectedTeammates: selectedTeammates,
        currentUserTimezone: localTz
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to receive copilot answer.");
        }
        return res.json();
      })
      .then((data) => {
        setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));
        
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply || "I parsed your query against active calendars. Faria is fully configured with persistent storage and domain filtration to keep event data private.",
          type: "text"
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      })
      .catch((err) => {
        console.error("Copilot request error:", err);
        setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));
        
        const aiMsg: Message = {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `Failed to connect with Faria AI services: ${err.message || "Unknown error"}. Check key configuration.`,
          type: "text"
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      });
  };

  const handleResolveTool = (msgId: string, finalStatus: "approved" | "rejected") => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.toolInfo) {
        return {
          ...m,
          toolInfo: {
            ...m.toolInfo,
            status: finalStatus
          }
        };
      }
      return m;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-[#070a14]/95 border-l border-white/8 backdrop-blur-xl shadow-2xl z-50 flex flex-col justify-between">
      {/* Header */}
      <div className="p-4.5 border-b border-white/5 flex items-center justify-between bg-[#141b30]/65">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center pulse-glow">
            <Sparkles className="h-4.5 w-4.5 text-[#5EEAD4]" />
          </div>
          <div>
            <h3 className="font-display text-xs font-bold text-[#EAF0FF] uppercase tracking-wider">
              AI Copilot Assistant
            </h3>
            <span className="text-[10px] text-teal-300 font-mono">Faria Engine v1.0 &bull; Generative UI inside</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages Scroll View */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4.5 space-y-4.5 no-scrollbar bg-slate-950/20"
      >
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
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-[#A78BFA]" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  {/* Chat Bubbles */}
                  {m.type === "thinking" ? (
                    <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-xs text-[#AEB9D6] italic flex items-center gap-2.5">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#6D8BFF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#5EEAD4] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span>{m.text}</span>
                    </div>
                  ) : m.type === "generative_widget" && m.widgetData ? (
                    /* --- GENERATIVE UI COMPONENT WIDGET --- */
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-4 shadow-xl text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-teal-500/10 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-4 w-4 text-[#5EEAD4] animate-pulse" />
                          <span className="text-[10px] uppercase font-bold text-[#EAF0FF]">Generative UI Overlap Engine</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-400/20 text-[#5EEAD4] uppercase font-mono tracking-wider font-semibold">
                          Figma Sync Token Render
                        </span>
                      </div>

                      {/* Interactive Slider inside Chat Bubble */}
                      <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Prune Distance Threshold:</span>
                          <span className="text-[#5EEAD4] font-mono font-bold">&gt; {overlapThreshold} hrs diff</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="15" 
                          value={overlapThreshold}
                          onChange={(e) => setOverlapThreshold(Number(e.target.value))}
                          className="w-full accent-[#5EEAD4]"
                        />
                      </div>

                      {/* Outlier Bars List */}
                      <div className="space-y-2">
                        {m.widgetData.outliers.map((o, idx) => {
                          const isHighOutlier = Math.abs(o.diff) > overlapThreshold;
                          return (
                            <div 
                              key={idx} 
                              className={`p-2 rounded-lg border transition-all ${
                                isHighOutlier 
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-200" 
                                  : "bg-[#141b30]/60 border-white/5 text-[#AEB9D6]"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-[11px]">{o.name} <span className="text-[10px] opacity-60">({o.tz})</span></span>
                                <span className="font-mono text-[10px] font-bold">
                                  {o.diff > 0 ? `+${o.diff}` : o.diff} hr shift
                                </span>
                              </div>
                              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${isHighOutlier ? "bg-rose-400" : "bg-gradient-to-r from-teal-400 to-indigo-400"}`} 
                                  style={{ width: `${Math.min(100, Math.max(10, o.coefficient))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-teal-500/10 border border-teal-500/15 py-1.5 rounded-lg px-2 text-center text-[#5EEAD4] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-teal-300" /> Recommended: {m.widgetData.recommendedGap}
                      </div>
                    </motion.div>
                  ) : m.type === "tool_call" && m.toolInfo ? (
                    /* Tool Call Card */
                    <div className="rounded-2xl border border-[#6D8BFF]/30 bg-indigo-500/5 p-4 space-y-3 shadow-lg">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-[#6D8BFF]" />
                          <span className="text-[10px] uppercase font-bold text-[#EAF0FF]">Google Workspace Sync</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-200 uppercase font-mono tracking-wider font-semibold">
                          Tool Authorization
                        </span>
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px] text-[#AEB9D6]">
                        <div><strong className="text-[#EAF0FF]">Event:</strong> {m.toolInfo.params.Event}</div>
                        <div><strong className="text-[#EAF0FF]">Target Date:</strong> {m.toolInfo.params.Date}</div>
                        <div><strong className="text-[#EAF0FF]">Time:</strong> {m.toolInfo.params.Time}</div>
                        <div><strong className="text-[#EAF0FF]">Guests:</strong> {m.toolInfo.params.Participants}</div>
                      </div>

                      {m.toolInfo.status === "pending" ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleResolveTool(m.id, "approved")}
                            className="flex-1 py-1.5 bg-[#34D399] text-black hover:bg-[#34D399]/90 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Approve Schedule
                          </button>
                          <button
                            onClick={() => handleResolveTool(m.id, "rejected")}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : m.toolInfo.status === "approved" ? (
                        <div className="bg-emerald-400/5 border border-emerald-400/15 py-1.5 rounded-lg px-2 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Approved & Synthesized with Calendar!
                        </div>
                      ) : (
                        <div className="bg-red-400/5 border border-red-400/15 py-1.5 rounded-lg px-2 text-red-300 text-[10px] font-bold flex items-center justify-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" /> Authorization Dismissed
                        </div>
                      )}
                    </div>
                  ) : m.text ? (
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                        m.sender === "user"
                          ? "bg-gradient-to-tr from-indigo-500/80 to-purple-500/80 border-white/5 text-[#EAF0FF]"
                          : "bg-[#141b30]/55 border-white/8 text-[#AEB9D6]"
                      }`}
                    >
                      {m.text}
                    </div>
                  ) : null}
                </div>

                {/* User Avatar */}
                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[#6D8BFF]/10 border border-[#6D8BFF]/20 flex items-center justify-center shrink-0">
                    <UserIcon className="h-4 w-4 text-[#6D8BFF]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-teal-400/25 border border-teal-400/30 text-xs text-[#EAF0FF] space-y-3 shadow-lg relative overflow-hidden"
          >
            {/* Siri Wave Lines animation */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-bold flex items-center gap-1.5 tracking-wider text-[10px] uppercase text-teal-300">
                <Volume2 className="h-4 w-4 text-emerald-350 animate-bounce" /> Listening with Siri voice ...
              </span>
              <span className="text-[10px] font-mono text-[#AEB9D6]">Active Audio Level</span>
            </div>

            {/* Siri Animated Waveform visualizer */}
            <div className="h-10 flex items-center justify-center gap-1 pb-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [12, 38, 12],
                    backgroundColor: ["#A78BFA", "#34D399", "#A78BFA"]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.05, 
                    ease: "easeInOut" 
                  }}
                  className="w-1.5 rounded-full"
                  style={{ height: "15px" }}
                />
              ))}
            </div>

            <p className="italic font-mono text-[11px] text-teal-200 text-center bg-black/35 py-1.5 px-2 rounded-lg border border-white/5">
              {voiceText}
            </p>
          </motion.div>
        )}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[#A78BFA]" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-xs text-[#AEB9D6] italic flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#6D8BFF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[#5EEAD4] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Synthesizing dynamic charts...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Area with suggestions and trigger buttons */}
      <div className="p-4 border-t border-white/5 space-y-3 bg-[#141b30]/65 text-xs">
        {/* Rapid Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {suggestionChips.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[10px] font-medium bg-white/5 border border-white/8 hover:bg-[#6D8BFF]/10 hover:border-[#6D8BFF]/30 hover:text-white px-2.5 py-1 rounded-full transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="flex gap-2 bg-[#070a14] border border-white/10 rounded-xl p-1.5 focus-within:border-[#6D8BFF]/50 transition-colors">
          
          {/* Audio trigger microphone (Siri mode) */}
          <button
            onClick={handleTriggerVoice}
            className={`p-1.5 rounded-lg cursor-pointer transition-all ${
              isListening 
                ? "bg-rose-500 text-white animate-pulse" 
                : "bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/5"
            }`}
            title="Start Siri Voice Sync input"
          >
            <Mic className="h-3.5 w-3.5" />
          </button>

          <input
            type="text"
            placeholder="Type or tap mic to tell Copilot..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(inputValue);
            }}
            className="flex-1 bg-transparent px-2 text-xs text-[#EAF0FF] placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend(inputValue)}
            className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-650 hover:to-purple-650 text-white rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

