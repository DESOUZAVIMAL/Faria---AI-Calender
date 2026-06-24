import React, { useState } from "react";
import { WeekDaySummary } from "../types";
import { Sun, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface WeekHeatmapProps {
  weekData: WeekDaySummary[] | null;
  selectedIds: string[];
  activeDate: string;
  openDays: string[];
  onToggleDay: (date: string) => void;
  workingHoursOnly: boolean;
}

export default function WeekHeatmap({
  weekData,
  selectedIds,
  activeDate,
  openDays,
  onToggleDay,
  workingHoursOnly,
}: WeekHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ dayIndex: number; hour: number } | null>(null);

  // Hours to render: 0 to 23, or 8 to 22 if working hours only
  const startHour = workingHoursOnly ? 8 : 0;
  const endHour = workingHoursOnly ? 21 : 23;
  const totalHours = endHour - startHour + 1;
  const hoursRange = Array.from({ length: totalHours }, (_, i) => startHour + i);

  // Skeleton Loader with Shimmer effect
  if (!weekData || weekData.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-48" />
            <div className="h-3 bg-slate-900 rounded w-72" />
          </div>
          <div className="h-6 bg-slate-800 rounded-full w-24" />
        </div>
        <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-2">
          {/* Time gap */}
          <div className="h-10" />
          {/* Day columns */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-xl" />
          ))}
          {/* Hours block grid placeholder */}
          {Array.from({ length: totalHours }).map((_, rIdx) => (
            <React.Fragment key={rIdx}>
              <div className="h-7 bg-slate-900/30 rounded w-10 justify-self-end mr-2" />
              {Array.from({ length: 7 }).map((_, cIdx) => (
                <div key={cIdx} className="h-7 bg-slate-850/40 rounded-md" />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Map decimal hour to AM_PM label
  const formatHourLabel = (h: number): string => {
    return String(h).padStart(2, "0") + ":00";
  };

  // Get cell coverage styling with lighter weekend visual indicator
  const getCellColorClass = (freeCount: number, total: number, isWeekend: boolean) => {
    if (total === 0) return isWeekend ? "bg-white/[0.02] text-slate-700" : "bg-white/5 text-slate-600";
    if (freeCount === 0) {
      return isWeekend
        ? "bg-slate-900/10 hover:bg-slate-800/20 opacity-30 border border-transparent"
        : "bg-slate-900/40 hover:bg-slate-800/50";
    }
    
    const ratio = freeCount / total;
    if (ratio === 1) {
      // Everyone free - full glowing green with pulses
      return "bg-[#34D399] shadow-[0_0_12px_rgba(52,211,153,0.45)] text-black font-semibold animate-pulse-glow";
    }
    if (ratio >= 0.75) {
      return "bg-emerald-500/70 border border-emerald-400/25 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]";
    }
    if (ratio >= 0.5) {
      return isWeekend 
        ? "bg-emerald-600/30 text-emerald-250" 
        : "bg-emerald-600/45 text-emerald-100";
    }
    if (ratio >= 0.25) {
      return isWeekend 
        ? "bg-cyan-500/12 text-cyan-400/90" 
        : "bg-cyan-500/18 text-cyan-200";
    }
    return isWeekend 
      ? "bg-amber-500/8 text-amber-300/85" 
      : "bg-amber-500/15 text-amber-100";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-2xl p-5 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-[#EAF0FF] tracking-wide">
            7-Day Overlap Heatmap
          </h3>
          <p className="text-sm text-[#6B779C] mt-0.5">
            Bright green cells indicate slots where most of your <span className="font-mono font-medium text-faria-pink">{selectedIds.length}</span> chosen teammates are free.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-400/5 hover:bg-amber-400/10 border border-amber-400/10 px-2.5 py-1 rounded-full select-none">
          <AlertCircle className="h-3 w-3" />
          <span>Viewer Zone Clock</span>
        </div>
      </div>

      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 overflow-x-auto select-none no-scrollbar">
        {/* Hour Header cell */}
        <div className="w-12 text-right pr-2 text-xs text-[#6B779C] font-semibold mt-10">
          Time
        </div>

        {/* Day Column Headers */}
        {weekData.map((day, idx) => {
          const isToday = day.date === activeDate;
          const isOpen = openDays.includes(day.date);
          const isWeekend = day.dayName === "Sat" || day.dayName === "Sun";
          return (
            <motion.button
              key={day.date}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onToggleDay(day.date)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 transform hover:scale-[1.03] hover:shadow-lg group cursor-pointer ${
                isToday 
                  ? "bg-faria-pink/15 border-faria-pink/45 text-faria-paper shadow-[0_0_15px_rgba(232,55,172,0.2)]" 
                  : isOpen 
                    ? "bg-white/8 border-white/15 text-faria-paper"
                    : `border-transparent text-[#AEB9D6] ${isWeekend ? "bg-faria-lightPlum/10 opacity-80 hover:opacity-100 hover:bg-white/5" : "hover:bg-white/5"}`
              }`}
            >
               <span className="text-xs uppercase tracking-wider font-bold text-[#6B779C] font-mono">
                {day.dayName}
               </span>
              <span className="text-base font-display font-medium leading-none mt-1">
                {day.formattedDate.split(" ")[1]}
              </span>
              <span className={`text-[11px] mt-1.5 px-2 py-0.5 rounded-full font-semibold transition-all ${
                isOpen 
                  ? "bg-faria-pink/25 text-faria-yellow border border-faria-pink/20 shadow-[0_0_8px_rgba(232,55,172,0.2)]" 
                  : "bg-faria-plum/65 text-[#6B779C] group-hover:bg-faria-pink/10 group-hover:text-faria-pink"
              }`}>
                {isOpen ? "Open" : "View"}
              </span>
            </motion.button>
          );
        })}

        {/* Row data: Hours */}
        {hoursRange.map((hr) => (
          <React.Fragment key={hr}>
            {/* Hour Label Column */}
            <div className="flex items-center justify-end pr-2 text-xs font-mono font-medium text-[#6B779C] h-7">
              {formatHourLabel(hr)}
            </div>

            {/* Cell Columns per day */}
            {weekData.map((day, dIdx) => {
              const freeCount = day.hourlyFreeCounts[hr] || 0;
              const total = selectedIds.length;
              const isWeekend = day.dayName === "Sat" || day.dayName === "Sun";

              return (
                <div
                  key={day.date + "-" + hr}
                  onMouseEnter={() => setHoveredCell({ dayIndex: dIdx, hour: hr })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => onToggleDay(day.date)}
                  className={`h-7 rounded-md cursor-pointer flex items-center justify-center text-xs font-mono font-semibold transition-[transform,background-color,box-shadow,filter] duration-150 relative hover:-translate-y-0.5 hover:z-10 hover:scale-105 hover:shadow-[0_0_12px_rgba(232,55,172,0.45)] hover:brightness-110 ${getCellColorClass(freeCount, total, isWeekend)}`}
                  title={`${day.dayName} ${formatHourLabel(hr)}: ${freeCount}/${total} free`}
                >
                  {total > 0 && (
                    <span className="opacity-95 font-mono select-none">
                      {freeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div 
        className={`mt-4 flex items-center justify-between text-sm text-[#AEB9D6] bg-faria-plum border border-white/8 rounded-xl px-4 py-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] transition-all duration-200 ${
          hoveredCell !== null && weekData[hoveredCell.dayIndex] ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>
            {hoveredCell !== null && weekData[hoveredCell.dayIndex] ? (
              <>
                <strong>
                  {weekData[hoveredCell.dayIndex].dayName} {formatHourLabel(hoveredCell.hour)}
                </strong>
                : <span className="text-[#EAF0FF] font-semibold">{weekData[hoveredCell.dayIndex].hourlyFreeCounts[hoveredCell.hour]}</span> of <span className="text-[#EAF0FF] font-semibold">{selectedIds.length}</span> colleagues free on their local clock.
              </>
            ) : (
              "Hover over a cell to see snapshot detail"
            )}
          </span>
        </div>
        <span className="text-xs text-[#6B779C] italic">Click cell or header to open detailed Gantt</span>
      </div>
    </motion.div>
  );
}
