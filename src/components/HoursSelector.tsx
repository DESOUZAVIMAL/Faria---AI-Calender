import React, { useState } from "react";
import { Plus, Trash2, Calendar, Sparkles } from "lucide-react";

interface HoursSelectorProps {
  segments: [number, number][];
  onSaveSegments: (segments: [number, number][]) => void;
}

export default function HoursSelector({ segments, onSaveSegments }: HoursSelectorProps) {
  const [startInput, setStartInput] = useState<number>(9);
  const [endInput, setEndInput] = useState<number>(17);

  // Parse working hour decimal to printable format
  const formatHourDecimal = (h: number): string => {
    const hr = Math.floor(h);
    const min = Math.round((h - hr) * 60);
    const suffix = h >= 12 ? "PM" : "AM";
    const hReadable = hr % 12 === 0 ? 12 : hr % 12;
    return `${hReadable}:${String(min).padStart(2, "0")} ${suffix}`;
  };

  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (startInput >= endInput) {
      alert("Start hour must be strictly before end hour.");
      return;
    }

    // Check overlaps
    const overlaps = segments.some(([s, e]) => {
      return (startInput >= s && startInput < e) || (endInput > s && endInput <= e) || (startInput <= s && endInput >= e);
    });

    if (overlaps) {
      alert("This segment overlaps with an existing segment. Please consolidate segments.");
      return;
    }

    const updated = [...segments, [startInput, endInput] as [number, number]].sort((a, b) => a[0] - b[0]);
    onSaveSegments(updated);
  };

  const handleRemoveSegment = (idx: number) => {
    const updated = segments.filter((_, i) => i !== idx);
    onSaveSegments(updated);
  };

  const hoursOptions = Array.from({ length: 48 }, (_, i) => i / 2);

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
        <Calendar className="h-4 w-4 text-[#5EEAD4]" />
        <h3 className="font-display text-base font-semibold text-[#EAF0FF]">
          Your Working Hours Scheduler
        </h3>
      </div>

      <p className="text-sm text-[#6B779C]">
        Faria supports <strong>fragmented working hours</strong>. Distinguish split shifts, afternoon breaks, or timezone offsets by saving multiple non-overlapping segments.
      </p>

      {/* Render active segments */}
      <div className="space-y-2">
        {segments.length === 0 ? (
          <div className="text-sm text-[#AEB9D6] italic py-2">
            No working segments configured. Teammates will see you as Busy/Unavailable by default.
          </div>
        ) : (
          segments.map(([start, end], idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-slate-900/60 border border-white/5 px-3 py-2 rounded-xl group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-3.5 w-3.5 text-[#34D399]" />
                <span className="text-sm font-mono font-semibold text-[#EAF0FF]">
                  {formatHourDecimal(start)} &mdash; {formatHourDecimal(end)}
                </span>
                <span className="text-xs text-slate-500 font-medium bg-slate-800 border border-white/5 px-2 py-0.5 rounded-md">
                  Segment {idx + 1}
                </span>
              </div>

              <button
                onClick={() => handleRemoveSegment(idx)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Remove Segment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new segment form */}
      <form onSubmit={handleAddSegment} className="pt-3 border-t border-white/5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-[#6B779C] mb-1">
              Start Hour
            </label>
            <select
              value={startInput}
              onChange={(e) => setStartInput(parseFloat(e.target.value))}
              className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#6D8BFF]"
            >
              {hoursOptions.map((h) => (
                <option key={`start-${h}`} value={h}>
                  {formatHourDecimal(h)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#6B779C] mb-1">
              End Hour
            </label>
            <select
              value={endInput}
              onChange={(e) => setEndInput(parseFloat(e.target.value))}
              className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#6D8BFF]"
            >
              {hoursOptions.map((h) => (
                <option key={`end-${h}`} value={h}>
                  {formatHourDecimal(h)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-850 hover:bg-slate-750 text-[#EAF0FF] text-sm font-semibold rounded-xl border border-white/10 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Segment
        </button>
      </form>
    </div>
  );
}
