import React, { useMemo } from "react";
import { DayData, TeammateRow } from "../types";
import { X, CheckCircle, HelpCircle, Layers, Star } from "lucide-react";
import { DateTime } from "luxon";
import { toViewerHour } from "../timezone-math";
import { motion } from "motion/react";

interface DayGanttPanelProps {
  key?: string;
  dayData: DayData;
  selectedIds: string[];
  onClose: () => void;
  workingHoursOnly: boolean;
  viewerTz: string;
}

export default function DayGanttPanel({
  dayData,
  selectedIds,
  onClose,
  workingHoursOnly,
  viewerTz,
}: DayGanttPanelProps) {
  // Config hours range based on toggle
  const startHour = workingHoursOnly ? 8 : 0;
  const endHour = workingHoursOnly ? 21 : 23;
  const totalHours = endHour - startHour + 1;
  const hoursRange = Array.from({ length: totalHours }, (_, i) => startHour + i);

  // Helper to convert viewer decimal hour to percent x-position
  const getPercentOfHour = (viewerHour: number): number => {
    const capped = Math.max(startHour, Math.min(endHour + 1, viewerHour));
    const pct = ((capped - startHour) / totalHours) * 100;
    return pct;
  };

  // Check if today on viewer's local clock
  const isToday = useMemo(() => {
    return DateTime.now().setZone(viewerTz).toFormat("yyyy-MM-dd") === dayData.date;
  }, [dayData.date, viewerTz]);

  const nowViewerHourDecimal = useMemo(() => {
    if (!isToday) return -1;
    const now = DateTime.now().setZone(viewerTz);
    return now.hour + now.minute / 60;
  }, [isToday, viewerTz]);

  // Format decimal hour to 24h digital
  const formatTimeStr = (h: number): string => {
    const hr = Math.floor(h);
    const min = Math.round((h - hr) * 60);
    return `${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="border border-white/8 bg-[#141b30]/55 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative transition-all duration-300"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-base font-bold text-[#EAF0FF]">
            {DateTime.fromISO(dayData.date).toFormat("EEEE, LLL dd, yyyy")}
            {isToday && (
              <span className="ml-2.5 px-2.5 py-0.5 bg-[#6D8BFF]/20 text-[#6D8BFF] text-[10px] font-bold rounded-lg border border-[#6D8BFF]/25 uppercase tracking-widest animate-pulse">
                Today
              </span>
            )}
          </h3>

          {/* Noise indicator */}
          {dayData.hiddenCount > 0 && (
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-[#5EEAD4] text-[10.5px] font-semibold border border-indigo-500/15 rounded-xl">
              ⚙️ {dayData.hiddenCount} noise events filtered
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[650px] relative">
          {/* Time scale rulers */}
          <div className="grid grid-cols-[185px_1fr] border-b border-white/5 pb-2 mb-2 select-none">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B779C] self-end">
              Teammate Clock
            </div>
            <div className="relative h-6">
              {hoursRange.map((hr) => (
                <div
                  key={hr}
                  className="absolute text-[10px] font-mono text-[#6B779C] -translate-x-1/2"
                  style={{ left: `${getPercentOfHour(hr)}%` }}
                >
                  {String(hr).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>

          {/* Gantt Rows per Teammate */}
          <div className="space-y-3 relative mb-5">
            {/* Live indicator line with gentle pulsing head */}
            {isToday && nowViewerHourDecimal >= startHour && nowViewerHourDecimal <= endHour && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-20 pointer-events-none"
                style={{ left: `calc(185px + (100% - 185px) * ${getPercentOfHour(nowViewerHourDecimal) / 100})` }}
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              </div>
            )}

            {dayData.rows.map((row) => {
              const clock = DateTime.local().setZone(row.timezone).toFormat("hh:mm a");
              
              const computedLocalSegments = row.segments
                .map(([startLoc, endLoc]) => {
                  const sViewer = toViewerHour(row.timezone, dayData.date, startLoc, viewerTz);
                  const eViewer = toViewerHour(row.timezone, dayData.date, endLoc, viewerTz);
                  return { start: sViewer, end: eViewer };
                })
                .filter(seg => seg.start >= 0 && seg.start < 24);

              const initials = row.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div key={row.id} className="grid grid-cols-[185px_1fr] items-center group relative min-h-11 hover:bg-slate-800/20 rounded-xl p-1 transition-colors duration-150">
                  {/* Left Column Teammate Profiler with Avatar */}
                  <div className="flex items-center gap-2 pr-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-[#6D8BFF] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <span className="text-xs font-semibold text-[#EAF0FF] truncate">
                        {row.name}
                      </span>
                      <span className="text-[9px] text-[#6B779C] font-mono truncate leading-none mt-1">
                        {row.timezone.split("/")[1]?.replace("_", " ") || row.timezone} &bull; {clock}
                      </span>
                    </div>
                  </div>

                  {/* Right Column Gantt Track */}
                  <div className="relative h-9 bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden shadow-inner">
                    {/* Working hours segmented band backdrop */}
                    {computedLocalSegments.map((seg, sIdx) => {
                      if (seg.start >= 24 || seg.end <= 0) return null; // Skip out of range
                      const leftPct = getPercentOfHour(seg.start);
                      const rightPct = getPercentOfHour(seg.end);
                      const widthPct = rightPct - leftPct;

                      return (
                        <div
                          key={sIdx}
                          className="absolute h-full bg-emerald-500/10 border-x border-emerald-400/10"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          title={`Local working segmented band: [${formatTimeStr(seg.start)} - ${formatTimeStr(seg.end)}]`}
                        />
                      );
                    })}

                    {/* Filtered Active Event Blocks */}
                    {(row.blocks || []).map((block, bIdx) => {
                      const leftPct = getPercentOfHour(block.startHourViewer);
                      const rightPct = getPercentOfHour(block.endHourViewer);
                      const widthPct = Math.max(1.5, rightPct - leftPct); // Guarantee visibility

                      let styleClass = "";
                      if (block.level === 3) {
                        styleClass = "bg-rose-500/25 border border-rose-400/35 text-rose-200 shadow-[inset_0_1px_5px_rgba(251,113,133,0.15)]";
                      } else if (block.level === 2) {
                        styleClass = "bg-amber-500/15 border border-amber-400/25 text-amber-100";
                      } else if (block.level === 1) {
                        styleClass = "bg-[#5EEAD4]/8 border border-[#5EEAD4]/18 text-cyan-150 border-dashed";
                      }

                      return (
                        <div
                          key={bIdx}
                          className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 flex items-center justify-start text-[9.5px] font-medium overflow-hidden truncate whitespace-nowrap z-10 transition-all hover:scale-[1.01] hover:brightness-110 cursor-help ${styleClass}`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          title={`${block.title} (${formatTimeStr(block.startHourViewer)} - ${formatTimeStr(block.endHourViewer)}) [Level ${block.level}]`}
                        >
                          <span className="truncate">{block.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlap Summary: "Everyone free" strip */}
          <div className="border-t border-white/5 pt-4">
            <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#6B779C] block mb-2 px-1">
              Overlapping Consensus Space ("Everyone Free")
            </span>

            {dayData.freeSlots.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="relative h-6.5 bg-slate-900/60 border border-white/5 rounded-xl overflow-hidden">
                  {dayData.freeSlots.map((slot, sIdx) => {
                    const leftPct = getPercentOfHour(slot.start);
                    const rightPct = getPercentOfHour(slot.end);
                    const widthPct = rightPct - leftPct;

                    return (
                      <div
                        key={sIdx}
                        className="absolute h-full bg-gradient-to-r from-[#34D399] to-[#5EEAD4] opacity-35 shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-pulse-glow"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`Consensus Overlap Open: ${formatTimeStr(slot.start)} - ${formatTimeStr(slot.end)} (${slot.duration} hrs)`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2.5 mt-1 select-none">
                  {dayData.freeSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1.5 rounded-xl text-[#34D399] text-xs font-semibold shadow-sm transition-all hover:bg-emerald-500/15"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-[#34D399] animate-bounce" />
                      <span>
                        Consensus Slot: <strong className="font-mono text-[#EAF0FF]">{formatTimeStr(slot.start)} &mdash; {formatTimeStr(slot.end)}</strong> ({slot.duration}h duration)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 bg-red-400/5 border border-red-400/10 rounded-xl text-center px-4">
                <HelpCircle className="h-5 w-5 text-rose-450 mb-1" />
                <p className="text-xs text-rose-300 font-medium">
                  No overlapping slots fit all {selectedIds.length} chosen colleagues simultaneously.
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Try tweaking filter preferences, removing outliers, or looking at another day.
                </p>
              </div>
            )}
          </div>

          {/* 3. Best Slot Summary recommendation engine */}
          {dayData.bestSlots.length > 0 && (
            <div className="mt-4.5 bg-[#6D8BFF]/5 border border-[#6D8BFF]/20 rounded-xl p-3 flex items-center justify-between text-xs text-[#EAF0FF]">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#A78BFA] fill-[#A78BFA] animate-spin-slow" />
                <span>
                  <strong>Algorithm Recommendation:</strong> Best window on this day for all chosen colleagues is{" "}
                  <strong className="text-[#5EEAD4] font-mono font-bold bg-[#5EEAD4]/10 border border-[#5EEAD4]/20 px-1.5 py-0.5 rounded-md">
                    {formatTimeStr(dayData.bestSlots[0].start)} &mdash; {formatTimeStr(dayData.bestSlots[0].end)}
                  </strong>{" "}
                  on your viewer clock.
                </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900/60 border border-white/5 rounded-md px-2 py-0.5 font-mono font-medium">
                Overlap Score: {dayData.bestSlots[0].score.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
