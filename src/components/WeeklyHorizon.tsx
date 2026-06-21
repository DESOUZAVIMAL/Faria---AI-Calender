import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Layout, 
  Columns, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Video,
  FileText
} from "lucide-react";

// Premium Mock Data to instantly visualize the UI
const MOCK_EVENTS = [
  { id: 1, day: 1, title: "Product Sync", type: "meeting", start: 9.5, duration: 1, color: "indigo" },
  { id: 2, day: 1, title: "Deep Work: Codebase", type: "focus", start: 11, duration: 2.5, color: "emerald" },
  { id: 3, day: 2, title: "Design Review", type: "meeting", start: 10, duration: 1.5, color: "purple" },
  { id: 4, day: 2, title: "1:1 with Chloe", type: "meeting", start: 14, duration: 0.5, color: "indigo" },
  { id: 5, day: 3, title: "Architecture Planning", type: "focus", start: 9, duration: 3, color: "emerald" },
  { id: 6, day: 4, title: "Client Presentation", type: "meeting", start: 13, duration: 1.5, color: "amber" },
  { id: 7, day: 5, title: "Weekly Retrospective", type: "meeting", start: 15, duration: 1, color: "indigo" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8; // 8 AM
const END_HOUR = 18; // 6 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

export default function WeeklyHorizon() {
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("horizontal");

  // Color theme mapping for events
  const getColorClasses = (color: string) => {
    switch (color) {
      case "indigo": return "bg-indigo-500/20 border-indigo-500/30 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
      case "emerald": return "bg-emerald-500/20 border-emerald-500/30 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
      case "purple": return "bg-purple-500/20 border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
      case "amber": return "bg-amber-500/20 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
      default: return "bg-slate-500/20 border-slate-500/30 text-slate-200";
    }
  };

  const formatHour = (h: number) => `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      
      {/* HEADER & CONTROLS */}
      <div className="flex items-center justify-between bg-[#141b30]/40 border border-white/5 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
            <CalendarIcon className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-[#EAF0FF]">My Week Horizon</h2>
            <p className="text-xs text-[#AEB9D6] font-mono">June 15 - June 19, 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Week Nav */}
          <div className="flex items-center gap-2 bg-[#070A14] border border-white/10 rounded-xl p-1">
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold text-[#EAF0FF] px-2 uppercase tracking-wider">This Week</span>
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"><ChevronRight size={16} /></button>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-[#070A14] border border-white/10 rounded-xl p-1 relative">
            <button 
              onClick={() => setViewMode("horizontal")}
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "horizontal" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Layout size={14} /> Gantt
            </button>
            <button 
              onClick={() => setViewMode("vertical")}
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === "vertical" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Columns size={14} /> Columns
            </button>
            {/* Sliding Active Pill */}
            <motion.div 
              layoutId="activePill"
              className="absolute top-1 bottom-1 w-[48%] bg-white/10 border border-white/10 rounded-lg z-0"
              initial={false}
              animate={{ left: viewMode === "horizontal" ? "4px" : "50%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* CALENDAR CANVAS */}
      <div className="flex-1 bg-[#141b30]/30 border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden relative p-6">
        
        <AnimatePresence mode="wait">
          {viewMode === "vertical" ? (
            /* --- VERTICAL COLUMNS VIEW --- */
            <motion.div 
              key="vertical"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 p-6 flex flex-col"
            >
              <div className="grid grid-cols-[60px_repeat(5,1fr)] h-full gap-4">
                {/* Y-Axis: Hours */}
                <div className="flex flex-col relative border-r border-white/5 pr-4">
                  {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                    <div key={i} className="flex-1 relative">
                      <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-slate-500">{formatHour(START_HOUR + i)}</span>
                    </div>
                  ))}
                </div>

                {/* X-Axis: Days */}
                {DAYS.map((day, dIdx) => (
                  <div key={day} className="flex flex-col relative h-full">
                    <div className="text-center pb-4 border-b border-white/10 mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</span>
                    </div>
                    {/* Grid Lines */}
                    <div className="absolute inset-x-0 top-10 bottom-0 pointer-events-none">
                      {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                        <div key={i} className="h-[calc(100%/10)] border-b border-white/[0.02]" />
                      ))}
                    </div>
                    {/* Events */}
                    <div className="relative flex-1">
                      {MOCK_EVENTS.filter(e => e.day === dIdx + 1).map(event => (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.02, brightness: 1.1 }}
                          className={`absolute inset-x-0 rounded-xl border p-2.5 overflow-hidden backdrop-blur-md flex flex-col justify-between cursor-pointer ${getColorClasses(event.color)}`}
                          style={{
                            top: `${((event.start - START_HOUR) / TOTAL_HOURS) * 100}%`,
                            height: `${(event.duration / TOTAL_HOURS) * 100}%`
                          }}
                        >
                          <div>
                            <h4 className="text-xs font-bold truncate">{event.title}</h4>
                            <span className="text-[9px] opacity-70 font-mono flex items-center gap-1 mt-1">
                              {event.type === 'meeting' ? <Video size={10} /> : <FileText size={10} />}
                              {event.duration} hr
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* --- HORIZONTAL GANTT VIEW --- */
            <motion.div 
              key="horizontal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 p-6 flex flex-col"
            >
              {/* X-Axis: Hours */}
              <div className="grid grid-cols-[80px_1fr] mb-6 border-b border-white/10 pb-4">
                <div /> {/* Spacing for Y axis labels */}
                <div className="relative flex w-full">
                  {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                    <div key={i} className="flex-1 relative">
                      <span className="absolute -left-3 text-[10px] font-mono text-slate-500">{formatHour(START_HOUR + i)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Y-Axis: Days */}
              <div className="flex-1 flex flex-col justify-between relative pb-4">
                 {/* Vertical Grid Lines */}
                 <div className="absolute top-0 bottom-0 left-[80px] right-0 flex pointer-events-none z-0">
                    {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                      <div key={i} className="flex-1 border-l border-white/[0.02]" />
                    ))}
                 </div>

                {DAYS.map((day, dIdx) => (
                  <div key={day} className="flex-1 grid grid-cols-[80px_1fr] items-center relative z-10 group">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</span>
                    <div className="relative h-12 bg-black/20 rounded-xl border border-white/5 overflow-hidden group-hover:bg-black/40 transition-colors">
                      {MOCK_EVENTS.filter(e => e.day === dIdx + 1).map(event => (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.01, y: -2 }}
                          className={`absolute top-1.5 bottom-1.5 rounded-lg border px-3 flex items-center shadow-lg backdrop-blur-md cursor-pointer ${getColorClasses(event.color)}`}
                          style={{
                            left: `${((event.start - START_HOUR) / TOTAL_HOURS) * 100}%`,
                            width: `${(event.duration / TOTAL_HOURS) * 100}%`
                          }}
                        >
                          <span className="text-xs font-bold truncate w-full flex items-center gap-2">
                             {event.type === 'meeting' ? <Video size={12} className="opacity-70" /> : <FileText size={12} className="opacity-70" />}
                             {event.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
