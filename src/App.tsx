import { useState, useEffect } from "react";
import { 
  TeammateRow, 
  DayData, 
  WeekApiResponse, 
  User, 
  UserPreferences,
  IncludedCalendar 
} from "./types";
import WeekHeatmap from "./components/WeekHeatmap";
import DayGanttPanel from "./components/DayGanttPanel";
import PeopleSelector from "./components/PeopleSelector";
import HoursSelector from "./components/HoursSelector";
import AICopilotPanel from "./components/AICopilotPanel";

import { 
  Calendar, 
  Clock, 
  Globe, 
  Settings, 
  ShieldCheck, 
  Star, 
  Zap, 
  LogOut,
  MapPin,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Menu,
  X,
  Bot
} from "lucide-react";
import { DateTime } from "luxon";
import { motion, AnimatePresence } from "motion/react";

// Performance friendly inline count up component for Stats
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end || end === 0) {
      setCount(end);
      return;
    }
    const duration = 1000; // 1s
    const stepTime = Math.max(Math.floor(duration / end), 16);
    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <span className="font-mono tabular-nums">{count}</span>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userWorkHours, setUserWorkHours] = useState<[number, number][]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: "",
    muted_titles: ["Review", "Standup", "Focus"],
    muted_calendar_ids: [],
    broadcast_threshold: 15,
    only_accepted: false,
    hide_optional: false,
    working_hours_only: false,
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [people, setPeople] = useState<TeammateRow[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [weekData, setWeekData] = useState<WeekApiResponse | null>(null);
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Stacked details for opened days, mapped by date YYYY-MM-DD
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [daysDetailsCache, setDaysDetailsCache] = useState<{ [date: string]: DayData }>({});
  const [loadingDays, setLoadingDays] = useState<{ [date: string]: boolean }>({});

  // Sub-calendars list
  const [calendars, setCalendars] = useState<IncludedCalendar[]>([]);

  // Weekly offset navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const now = DateTime.now().setZone("America/New_York");
    const mon = now.startOf("week");
    return mon.toFormat("yyyy-MM-dd");
  });

  // UI Drawer & Copilot states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Fetch logged in user status
  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => {
        setCurrentUser(data.user);
        setUserWorkHours(data.workHours);
        setPreferences(data.preferences);
        setLoadingUser(false);
      })
      .catch(() => {
        setCurrentUser(null);
        setLoadingUser(false);
      });
  }, []);

  // Fetch teammate list once logged in or roster updates
  const fetchRoster = () => {
    fetch("/api/people")
      .then((res) => res.json())
      .then((data) => {
        setPeople(data);
        if (selectedPeopleIds.length === 0) {
          const ids = data.map((p: any) => p.id);
          setSelectedPeopleIds(ids);
        }
      });
  };

  useEffect(() => {
    if (currentUser) {
      fetchRoster();
      fetchCalendars();
    }
  }, [currentUser]);

  // Fetch calendars list
  const fetchCalendars = () => {
    fetch("/api/calendars")
      .then((res) => res.json())
      .then((data) => {
        setCalendars(data);
      });
  };

  // Re-fetch week matrix on selected persons, week offset, or filters changed
  useEffect(() => {
    if (!currentUser || selectedPeopleIds.length === 0) {
      setWeekData(null);
      return;
    }

    setLoadingWeek(true);
    const peopleParam = selectedPeopleIds.join(",");
    fetch(`/api/week?start=${currentWeekStart}&people=${peopleParam}`)
      .then((res) => res.json())
      .then((data) => {
        setWeekData(data);
        setLoadingWeek(false);
      })
      .catch((err) => {
        console.error("Failed to fetch week matrix:", err);
        setLoadingWeek(false);
      });
  }, [currentUser, selectedPeopleIds, currentWeekStart, preferences]);

  // Re-fetch Day details when opened days or selectedIds change
  useEffect(() => {
    if (!currentUser || selectedPeopleIds.length === 0) {
      setDaysDetailsCache({});
      return;
    }

    openDays.forEach((dateStr) => {
      setLoadingDays((prev) => ({ ...prev, [dateStr]: true }));
      const peopleParam = selectedPeopleIds.join(",");
      fetch(`/api/day?date=${dateStr}&people=${peopleParam}`)
        .then((res) => res.json())
        .then((data) => {
          setDaysDetailsCache((prev) => ({ ...prev, [dateStr]: data }));
          setLoadingDays((prev) => ({ ...prev, [dateStr]: false }));
        })
        .catch((err) => {
          console.error(`Failed to fetch day details for ${dateStr}:`, err);
          setLoadingDays((prev) => ({ ...prev, [dateStr]: false }));
        });
    });
  }, [currentUser, selectedPeopleIds, openDays, preferences]);

  // Handle OAuth Sign-in Redirect
  const handleGoogleSignIn = () => {
    fetch("/api/auth/url")
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else if (data.isDemoOnly) {
          handleDemoSignIn();
        }
      })
      .catch(() => {
        handleDemoSignIn();
      });
  };

  // Safe developer demo log-in fallback
  const handleDemoSignIn = () => {
    fetch("/api/auth/demo", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data.user);
      });
  };

  // Handle Logout
  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      setCurrentUser(null);
      setOpenDays([]);
      setDaysDetailsCache({});
    });
  };

  // Roster selector triggers
  const handleTogglePerson = (id: string) => {
    if (selectedPeopleIds.includes(id)) {
      setSelectedPeopleIds((prev) => prev.filter((p) => p !== id));
    } else {
      setSelectedPeopleIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPeopleIds(people.map((p) => p.id));
  };

  const handleSelectNone = () => {
    setSelectedPeopleIds([]);
  };

  // Add custom remote coworker
  const handleAddRosterPerson = (newPerson: any) => {
    fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPerson),
    })
      .then((res) => res.json())
      .then((data) => {
        fetchRoster();
      });
  };

  // Delete custom companion
  const handleDeletePerson = (id: string) => {
    fetch(`/api/people/${id}`, { method: "DELETE" }).then(() => {
      fetchRoster();
      setSelectedPeopleIds((prev) => prev.filter((p) => p !== id));
    });
  };

  // Save fragmented work slots
  const handleSaveSegments = (segments: [number, number][]) => {
    fetch("/api/me/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
    })
      .then((res) => res.json())
      .then((data) => {
        setUserWorkHours(segments);
        fetchRoster();
      });
  };

  // Update dynamic preference toggles
  const handleUpdatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPrefs),
    })
      .then((res) => res.json())
      .then(() => {
        // updates trigger standard react dependencies
      });
  };

  // Update Timezone
  const handleUpdateTimezone = (timezone: string) => {
    fetch("/api/me/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone }),
    })
      .then((res) => res.json())
      .then(() => {
        if (currentUser) {
          setCurrentUser({ ...currentUser, viewer_tz: timezone });
          fetchRoster();
        }
      });
  };

  // Navigation week shifting
  const handleShiftWeek = (weeks: number) => {
    const nextMon = DateTime.fromISO(currentWeekStart, { zone: "America/New_York" }).plus({ weeks });
    setCurrentWeekStart(nextMon.toFormat("yyyy-MM-dd"));
  };

  // Toggle stackable Opened Day cards
  const handleToggleDay = (dateStr: string) => {
    if (openDays.includes(dateStr)) {
      setOpenDays((prev) => prev.filter((d) => d !== dateStr));
    } else {
      setOpenDays((prev) => [...prev, dateStr]);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#070A14] flex flex-col items-center justify-center text-[#EAF0FF] aurora-bg select-none">
        <Zap className="h-10 w-10 text-indigo-400 animate-pulse mb-4" />
        <p className="text-sm font-display font-medium tracking-wide animate-pulse">
          Syncing team availability & timezone matrices...
        </p>
      </div>
    );
  }

  // Render Logged Out landing screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070A14] flex flex-col items-center justify-center p-6 aurora-bg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="w-full max-w-lg border border-white/8 bg-[#141b30]/55 backdrop-blur-md rounded-2xl p-8 text-center shadow-2xl space-y-6"
        >
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg hover:rotate-3 transition-transform">
            <Calendar className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#EAF0FF]">
              Faria Calendar
            </h1>
            <p className="text-xs text-[#AEB9D6] max-w-md mx-auto leading-relaxed">
              The cross-timezone availability, scheduler, and visual sync engine designed specifically for remote-first teams. Map fragmented hours, bypass calendar noise, and instantly spot overlaps.
            </p>
          </div>

          <div className="bg-amber-400/5 border border-amber-400/10 text-amber-200/90 text-[11px] p-3 rounded-xl max-w-sm mx-auto text-left flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Note on Domain Delegation:</p>
              <span>Domain-wide delegation is recommended for 200&ndash;300 seats. For instant previews, Developer Demo mode is supported too!</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-650 hover:to-purple-650 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(109,139,255,0.45)] transition-all cursor-pointer text-xs"
            >
              Sign in with Google Work Google Calendar Account
            </button>

            <button
              onClick={handleDemoSignIn}
              className="w-full py-2.5 bg-[#070A14] border border-white/10 hover:border-white/20 text-[#AEB9D6] hover:text-[#EAF0FF] text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Explore Instant Developer Mock Demo with sample data
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A14] aurora-bg text-[#EAF0FF] relative overflow-x-hidden">
      
      {/* 1. STICKY INTERACTIVE TOP BAR */}
      <header className="sticky top-0 bg-[#070A14]/75 backdrop-blur-md border-b border-white/5 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:text-white transition-all cursor-pointer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow">
              F
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-tight text-[#EAF0FF]">
                Faria Calendar
              </h1>
              <p className="text-[10px] text-teal-300 leading-none font-medium">
                Find a time that works across timezones
              </p>
            </div>
          </div>

          {/* User badge and logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#141b30]/55 border border-white/5 px-3 py-1 rounded-full text-xs font-medium text-[#AEB9D6]">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  referrerPolicy="no-referrer"
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name[0]}
                </div>
              )}
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
              <span className="text-[10px] text-[#6B779C] font-mono select-none">
                {currentUser.viewer_tz}
              </span>
            </div>

            {/* Timezone picker */}
            <select
              value={currentUser.viewer_tz}
              onChange={(e) => handleUpdateTimezone(e.target.value)}
              className="bg-[#070A14] border border-white/10 text-[#AEB9D6] rounded-full text-[11px] px-3 py-1 focus:outline-none focus:border-[#6D8BFF] font-mono hover:border-white/20 transition-all cursor-pointer"
            >
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>

            {/* Futuristic presentation-only AI copilot trigger */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-tr from-indigo-500/80 to-purple-500/80 border border-indigo-400/30 text-xs text-[#EAF0FF] font-bold rounded-full pulse-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#5EEAD4] animate-spin-slow" />
              <span className="hidden md:inline">Ask AI Assist</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-[#141b30]/40 border border-white/5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN BENTO GRID LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI stat bar chip dashboard header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap gap-3.5 mb-6.5 select-none"
        >
          <div className="bg-[#141b30]/45 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(109,139,255,0.7)]" />
            <span className="text-xs text-[#AEB9D6]">
              Active Teammates selected: <strong className="text-white"><CountUp value={selectedPeopleIds.length} /></strong>
            </span>
          </div>
          {weekData?.rankedSummary && (
            <div className="bg-[#141b30]/45 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse" />
              <span className="text-xs text-[#AEB9D6]">
                Consensus Slots Spotted: <strong className="text-white"><CountUp value={weekData.rankedSummary.length} /></strong>
              </span>
            </div>
          )}
          <div className="bg-[#141b30]/45 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]" />
            <span className="text-xs text-[#AEB9D6]">
              Filtered filters: <strong className="text-white"><CountUp value={preferences.muted_titles?.length || 0} /> rules</strong>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* sidebar - Left column (Desktop only, collapses on mobile drawer) */}
          <aside className="hidden lg:block space-y-6">
            <PeopleSelector
              people={people}
              selectedIds={selectedPeopleIds}
              onTogglePerson={handleTogglePerson}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              preferences={preferences}
              onUpdatePrefs={handleUpdatePrefs}
              onAddRosterPerson={handleAddRosterPerson}
              onDeletePerson={handleDeletePerson}
            />

            {/* working segments manager */}
            <HoursSelector
              segments={userWorkHours}
              onSaveSegments={handleSaveSegments}
            />

            {/* sub-calendars list tracker */}
            <div className="glass-panel rounded-2xl p-4.5">
              <h4 className="font-display text-xs font-semibold text-[#EAF0FF] mb-2.5 flex items-center gap-1.5">
                <CalendarRange className="h-4 w-4 text-emerald-400" />
                Active Calendars list
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                {calendars.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-[11px] text-[#AEB9D6] hover:text-[#EAF0FF] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.include}
                      className="rounded border-[#6B779C] text-[#6D8BFF] focus:ring-[#6D8BFF] cursor-pointer"
                      onChange={() => {
                        const updated = [...calendars];
                        updated[idx].include = !updated[idx].include;
                        setCalendars(updated);
                        handleUpdatePrefs({});
                      }}
                    />
                    <span className="truncate">{c.summary}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main workspace widgets */}
          <section className="space-y-8 flex-1 min-w-0">
            
            {/* Nav controls */}
            <div className="flex items-center justify-between glass-panel rounded-2xl p-4 select-none">
              <div>
                <span className="text-[10px] text-[#6B779C] uppercase tracking-wider font-bold font-mono">
                  Active Focus Week
                </span>
                <span className="font-display block text-sm font-bold text-[#EAF0FF]">
                  Week of {DateTime.fromISO(currentWeekStart).toFormat("MMMM dd, yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShiftWeek(-1)}
                  className="p-1.5 bg-slate-900/40 hover:bg-slate-800 text-slate-300 border border-white/5 rounded-xl transition-all cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => {
                    const mon = DateTime.now().setZone("America/New_York").startOf("week");
                    setCurrentWeekStart(mon.toFormat("yyyy-MM-dd"));
                  }}
                  className="px-3.5 py-1.5 bg-slate-900/40 hover:bg-slate-800 text-xs font-semibold text-[#EAF0FF] border border-white/5 rounded-xl transition-all cursor-pointer"
                >
                  Go to Today
                </button>
                <button
                  onClick={() => handleShiftWeek(1)}
                  className="p-1.5 bg-slate-900/40 hover:bg-slate-800 text-slate-300 border border-white/5 rounded-xl transition-all cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* 1. WEEK OVERLAP HEATMAP SCANNER */}
            <WeekHeatmap
              weekData={weekData ? weekData.days : null}
              selectedIds={selectedPeopleIds}
              activeDate={DateTime.now().setZone("America/New_York").toFormat("yyyy-MM-dd")}
              openDays={openDays}
              onToggleDay={handleToggleDay}
              workingHoursOnly={preferences.working_hours_only}
            />

            {/* 2. CHRONOLOGICAL SUMMARY RANKED BEST RUNS */}
            {weekData && weekData.rankedSummary && weekData.rankedSummary.length > 0 && (
              <div className="glass-panel rounded-2xl p-5">
                <h4 className="font-display text-xs font-bold text-[#EAF0FF] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-[#A78BFA]" />
                  optimal overlap schedules identified
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weekData.rankedSummary.map((item, idx) => {
                    const startHr = Math.floor(item.slot.start);
                    const startMin = Math.round((item.slot.start - startHr) * 60);
                    const endHr = Math.floor(item.slot.end);
                    const endMin = Math.round((item.slot.end - endHr) * 60);

                    const timeRepresentation = `${String(startHr).padStart(2, "0")}:${String(startMin).padStart(2, "0")} - ${String(endHr).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        onClick={() => {
                          if (!openDays.includes(item.date)) {
                            handleToggleDay(item.date);
                          }
                        }}
                        className="bg-slate-900/60 border border-white/5 hover:border-[#6D8BFF]/45 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-teal-300">
                              {item.dayName} &bull; {item.formattedDate}
                            </span>
                            <span className="text-[10px] text-[#A78BFA] font-mono font-bold uppercase tracking-wider">
                              Rank #{idx + 1}
                            </span>
                          </div>
                          <span className="text-sm font-semibold font-mono text-[#EAF0FF]">
                            {timeRepresentation}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-mono">
                          <span>Duration: {item.slot.duration} hours</span>
                          <span className="text-[#34D399] font-bold">&#10003; Overlap Ready</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty stats state placeholder if no teammate selected */}
            {selectedPeopleIds.length === 0 && (
              <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                <Bot className="h-10 w-10 text-[#6D8BFF] opacity-40 animate-pulse" />
                <h4 className="text-base font-display font-bold text-[#EAF0FF]">No Overlaps Loaded</h4>
                <p className="text-xs text-[#AEB9D6] max-w-sm">
                  Please select at least one teammate from the left roster layout to map their calendaravailability coordinates.
                </p>
              </div>
            )}

            {/* 3. STACKED DAY DETAILS PANEL CONTAINER WITH ANIMATED LAYOUTS */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {openDays.map((dateStr) => {
                  const dayDetail = daysDetailsCache[dateStr];
                  const loading = loadingDays[dateStr];

                  if (loading && !dayDetail) {
                    return (
                      <motion.div
                        key={dateStr}
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="border border-white/5 bg-slate-900/40 rounded-2xl h-36 flex flex-col items-center justify-center text-slate-400 text-xs animate-pulse"
                      >
                        <Zap className="h-5 w-5 text-indigo-400 animate-spin mb-2" />
                        <span>Reconstructing agenda timeline for {dateStr}...</span>
                      </motion.div>
                    );
                  }

                  if (dayDetail) {
                    return (
                      <motion.div 
                        layout 
                        key={dateStr}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      >
                        <DayGanttPanel
                          dayData={dayDetail}
                          selectedIds={selectedPeopleIds}
                          onClose={() => handleToggleDay(dateStr)}
                          workingHoursOnly={preferences.working_hours_only}
                          viewerTz={currentUser.viewer_tz}
                        />
                      </motion.div>
                    );
                  }

                  return null;
                })}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      {/* 3. MOBILE ROSTER DRAWER SLIDE-IN (Toggled from header hamburger) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Drawer side panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative flex w-full max-w-xs flex-col bg-[#070A14] p-5 overflow-y-auto border-r border-white/8 space-y-6 no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 file-line">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold">F</div>
                  <span className="font-display font-semibold text-xs text-[#EAF0FF]">Sync Settings</span>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)} 
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <PeopleSelector
                people={people}
                selectedIds={selectedPeopleIds}
                onTogglePerson={handleTogglePerson}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
                preferences={preferences}
                onUpdatePrefs={handleUpdatePrefs}
                onAddRosterPerson={handleAddRosterPerson}
                onDeletePerson={handleDeletePerson}
              />

              <HoursSelector
                segments={userWorkHours}
                onSaveSegments={handleSaveSegments}
              />

              {/* Sub-calendars list */}
              <div className="glass-panel rounded-2xl p-4.5">
                <h4 className="font-display text-xs font-semibold text-[#EAF0FF] mb-2.5 flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-emerald-400" />
                  Active Calendars list
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {calendars.map((c, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-[11px] text-[#AEB9D6] hover:text-[#EAF0FF] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.include}
                        className="rounded border-[#6B779C] text-[#6D8BFF] focus:ring-[#6D8BFF] cursor-pointer"
                        onChange={() => {
                          const updated = [...calendars];
                          updated[idx].include = !updated[idx].include;
                          setCalendars(updated);
                          handleUpdatePrefs({});
                        }}
                      />
                      <span className="truncate">{c.summary}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PRESENTATIONAL SLIDE-IN AI COPILOT SIDE BAR */}
      <AnimatePresence>
        {isCopilotOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCopilotOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
            />
            
            <AICopilotPanel 
              isOpen={isCopilotOpen} 
              onClose={() => setIsCopilotOpen(false)}
              selectedTeammates={selectedPeopleIds}
            />
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
