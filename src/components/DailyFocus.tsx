import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Video,
  CheckSquare,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";

// Premium High-Density Mock Data for Daily Agenda
const MOCK_DAILY_EVENTS = [
  {
    id: "d1",
    title: "Global Architecture Alignment",
    time: "09:30 AM - 10:30 AM",
    type: "meeting",
    platform: "Google Meet",
    location: "https://meet.google.com/abc-defg-hij",
    description: "Aligning on schema updates for timezone caching layer and finalizing the cross-team availability payload contracts.",
    attendees: [
      { name: "Vimal De Souza", role: "Lead Dev", status: "accepted" },
      { name: "Chloe Chen", role: "Product Designer", status: "accepted" },
      { name: "Marcus Vance", role: "Infra Architect", status: "tentative" }
    ],
    notes: [
      "Review DB connections bottlenecks under heavy load simulation.",
      "Finalize OAuth write scopes for premium tier onboarding workflows."
    ],
    tags: ["Core Engine", "Sync"],
    status: "past"
  },
  {
    id: "d2",
    title: "Deep Work: Generative AI Co-Pilot Widget",
    time: "11:00 AM - 01:30 PM",
    type: "focus",
    description: "Uninterrupted engineering session implementing the real-time websocket layer for the AI chat stream.",
    attendees: [],
    notes: [
      "Connect the Gemini 2.5 Flash API directly into the server routing pipeline.",
      "Ensure Framer Motion text animations remain smooth under 60fps."
    ],
    tags: ["Engineering", "AI-Dashboard"],
    status: "active"
  },
  {
    id: "d3",
    title: "Stitch UI Polish & Review Session",
    time: "03:00 PM - 04:00 PM",
    type: "meeting",
    platform: "Google Meet",
    location: "https://meet.google.com/xyz-123",
    description: "Evaluating the glassmorphic aesthetic across multiple screen layouts and reviewing mobile-responsiveness patterns.",
    attendees: [
      { name: "Vimal De Souza", role: "Lead Dev", status: "accepted" },
      { name: "Chloe Chen", role: "Product Designer", status: "accepted" }
    ],
    notes: [
      "Check contrast values for text elements against deep obsidian canvas backgrounds.",
      "Optimize state handoff when toggling horizontal/vertical timelines."
    ],
    tags: ["Design System", "Stitch"],
    status: "upcoming"
  }
];

export default function DailyFocus() {
  const [selectedEventId, setSelectedEventId] = useState<string>(MOCK_DAILY_EVENTS[1].id);
  
  const currentEvent = MOCK_DAILY_EVENTS.find(e => e.id === selectedEventId) || MOCK_DAILY_EVENTS[0];

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_420px] p-6 gap-6 overflow-hidden">
      
      {/* TIMELINE TRACKER (LEFT) */}
      <div className="flex flex-col bg-[#141b30]/30 border border-white/5 backdrop-blur-md rounded-2xl p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-display font-semibold text-[#EAF0FF]">Daily Engine</h2>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Today Focus Loop
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Monday</span>
            <p className="text-sm font-semibold text-[#EAF0FF]">June 22, 2026</p>
          </div>
        </div>

        {/* Chronological Stack */}
        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-[2px] before:bg-white/5">
          {MOCK_DAILY_EVENTS.map((event) => {
            const isActive = event.id === selectedEventId;
            const isLiveNow = event.status === "active";

            return (
              <div 
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`group grid grid-cols-[40px_1fr] items-start gap-4 cursor-pointer relative transition-all`}
              >
                {/* Visual Node */}
                <div className="flex items-center justify-center z-10">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    isLiveNow 
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                      : isActive 
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "bg-[#070A14] border-white/10 text-slate-500 group-hover:border-white/20"
                  }`}>
                    {event.type === "focus" ? <Zap size={16} /> : <Video size={16} />}
                  </div>
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
                  isActive 
                    ? "bg-white/[0.04] border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" 
                    : "bg-transparent border-transparent hover:bg-white/[0.01] hover:border-white/5"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          isLiveNow ? "text-emerald-400" : "text-slate-400"
                        }`}>
                          {event.time}
                        </span>
                        {isLiveNow && (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold animate-pulse">
                            Live Now
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#EAF0FF] mt-1 group-hover:text-white transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-[#AEB9D6] mt-1 line-clamp-1 opacity-70">
                        {event.description}
                      </p>
                    </div>
                    <ChevronRight size={16} className={`text-slate-500 mt-1 transition-transform ${isActive ? "transform translate-x-1 text-white" : "group-hover:text-slate-300"}`} />
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {event.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* METADATA SIDE-DECK (RIGHT) */}
      <div className="bg-[#141b30]/40 border border-white/5 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-[10px] uppercase tracking-widest font-bold mb-2">
            <Sparkles size={12} /> Meta Context Engine
          </div>
          <h2 className="text-base font-display font-semibold text-[#EAF0FF] leading-snug">
            {currentEvent.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-2">
            <Clock size={12} /> {currentEvent.time}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Location / Meeting Room */}
          {currentEvent.location && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Access Node</h4>
              <a 
                href={currentEvent.location} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-xl text-blue-300 transition-colors cursor-pointer group"
              >
                <Video size={16} className="text-blue-400 shrink-0" />
                <div className="truncate min-w-0">
                  <p className="text-xs font-semibold truncate">{currentEvent.platform}</p>
                  <p className="text-[10px] font-mono text-blue-400/70 truncate">{currentEvent.location}</p>
                </div>
              </a>
            </div>
          )}

          {/* Context Summary Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Strategic Intent</h4>
            <p className="text-xs text-[#AEB9D6] leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
              {currentEvent.description}
            </p>
          </div>

          {/* Action Tasks / Agenda Lines */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Target Benchmarks</h4>
            <div className="space-y-2">
              {currentEvent.notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[#EAF0FF]">
                  <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="opacity-90 leading-tight">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Associated Roster Block */}
          {currentEvent.attendees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Teammate Matrix</h4>
              <div className="bg-black/20 border border-white/5 rounded-xl divide-y divide-white/5">
                {currentEvent.attendees.map((attendee, i) => (
                  <div key={i} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase shrink-0">
                        {attendee.name[0]}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-[#EAF0FF] truncate">{attendee.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 truncate">{attendee.role}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${
                      attendee.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {attendee.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
