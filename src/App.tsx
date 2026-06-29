import React, { useState, useEffect, useRef } from "react";
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
import WeeklyHorizon from "./components/WeeklyHorizon";
import DailyFocus from "./components/DailyFocus";
import LandingPage from "./components/LandingPage";
import AICopilotTab from "./components/AICopilotTab";

import {
  Clock,
  Star,
  Zap,
  LogOut,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Bot,
  RefreshCw,
  CalendarDays,
  Layout
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
  const calendarCache = React.useRef<{[key: string]: any}>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSyncFreshReload = () => {
    calendarCache.current = {};
    setRefreshTrigger(prev => prev + 1);
  };

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
  const [activeTab, setActiveTab] = useState("scheduling");

  // Fetch logged in user status
  useEffect(() => {
    const checkLoginStatus = () => {
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
    };

    checkLoginStatus();

    // Listen for OAuth message callback from popup
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setLoadingUser(true);
        checkLoginStatus();
      } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        alert("Google sign in failed: " + (event.data.error || "Unknown error"));
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
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

    const cacheKey = `${currentWeekStart}:${[...selectedPeopleIds].sort().join(",")}`;
    if (calendarCache.current[cacheKey]) {
      setWeekData(calendarCache.current[cacheKey]);
      setLoadingWeek(false);
      return;
    }

    setLoadingWeek(true);
    const peopleParam = selectedPeopleIds.join(",");
    fetch(`/api/week?start=${currentWeekStart}&people=${peopleParam}`)
      .then((res) => res.json())
      .then((data) => {
        calendarCache.current[cacheKey] = data;
        setWeekData(data);
        setLoadingWeek(false);
      })
      .catch((err) => {
        console.error("Failed to fetch week matrix:", err);
        setLoadingWeek(false);
      });
  }, [currentUser, selectedPeopleIds, currentWeekStart, preferences, refreshTrigger]);

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

  // Handle OAuth Sign-in Redirect with Popup fallback
  const handleGoogleSignIn = () => {
    fetch("/api/auth/url")
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const popup = window.open(
            data.url,
            "faria_google_auth",
            `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
          );
          if (!popup) {
            // Revert to normal redirect if popup blocker is engaged
            window.location.href = data.url;
          }
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
      <div className="min-h-screen bg-faria-plum flex flex-col items-center justify-center text-faria-paper aurora-bg select-none">
        <Zap className="h-10 w-10 text-faria-pink animate-pulse mb-4" />
        <p className="text-sm font-display font-medium tracking-wide animate-pulse">
          Syncing team availability & timezone matrices...
        </p>
      </div>
    );
  }

  // Render Logged Out landing screen
  if (!currentUser) {
    return (
      <LandingPage 
        onGoogleSignIn={handleGoogleSignIn} 
        onDemoSignIn={handleDemoSignIn} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-faria-plum text-faria-paper overflow-hidden aurora-bg select-none">
      
      {/* 0. PERSISTENT LEFT SIDEBAR */}
      <aside className="w-64 flex flex-col bg-faria-darkPlum/35 border-r border-white/5 backdrop-blur-xl shrink-0 z-20 hidden lg:flex select-none">
        {/* App Branding */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(232,55,172,0.35)]">
            <Sparkles size={14} className="text-white animate-pulse" />
          </div>
          <h1 className="text-sm font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-faria-paper tracking-wide">
            Faria Calendar
          </h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {[
            { id: "scheduling", label: "Scheduling Hub", icon: CalendarDays },
            { id: "weekly", label: "Weekly Horizon", icon: Layout },
            { id: "daily", label: "Daily Focus", icon: Clock },
            { id: "ai", label: "AI Copilot", icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-wide border ${
                  isActive 
                    ? "bg-white/10 text-faria-pink border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-faria-lightPlum/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
                }`}
              >
                <Icon size={15} className={`mr-3 ${isActive ? "text-faria-pink font-bold" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Info label in sidebar */}
        <div className="p-4 border-t border-white/5 bg-faria-darkPlum/10 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-faria-pink animate-pulse shadow-[0_0_8px_rgba(232,55,172,0.7)]" />
            <span className="text-[9px] font-mono tracking-wider font-bold text-faria-pink">SECURE ENDPOINT ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDEBAR/MAIN CONTAINER */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* 1. STICKY INTERACTIVE TOP BAR */}
        <header className="sticky top-0 bg-faria-plum/75 backdrop-blur-md border-b border-white/5 z-40 select-none shrink-0 h-16 flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Hamburger for mobile */}
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 hover:text-white transition-all cursor-pointer"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
 
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center text-white font-bold text-xs shadow">
                  F
                </div>
                <div>
                  <h1 className="font-display text-xs font-bold tracking-tight text-faria-paper leading-tight">
                    Faria Calendar
                  </h1>
                </div>
              </div>

              {/* Dynamic title bar for desktop */}
              <div className="hidden lg:flex flex-col">
                <h2 className="text-sm font-display font-bold text-faria-paper uppercase tracking-wider">
                  {activeTab === "scheduling" ? "Scheduling Hub" : activeTab === "weekly" ? "Weekly Horizon" : activeTab === "daily" ? "Daily Focus" : "Gemini AI Copilot"}
                </h2>
                <span className="text-[10px] text-faria-pink leading-none mt-0.5">
                  {activeTab === "scheduling" ? "Map multi-timezone calendars & overlaps" : activeTab === "weekly" ? "Your week at a glance" : activeTab === "daily" ? "Today's agenda & context" : "AI-powered scheduling assistant"}
                </span>
              </div>
            </div>

            {/* User badge and logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-faria-lightPlum/35 border border-white/5 px-3 py-1 rounded-full text-[11px] font-medium text-faria-paper/70">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    referrerPolicy="no-referrer"
                    alt={currentUser.name}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-faria-pink/10 text-faria-pink flex items-center justify-center font-bold text-[9px]">
                    {currentUser.name[0]}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
                <span className="text-[10px] text-[#6B779C] font-mono select-none">
                  {currentUser.viewer_tz}
                </span>
              </div>

              {/* Timezone picker */}
              <select
                value={currentUser.viewer_tz}
                onChange={(e) => handleUpdateTimezone(e.target.value)}
                className="bg-faria-plum border border-white/10 text-faria-paper/70 rounded-full text-[10px] px-2.5 py-1 focus:outline-none focus:border-faria-pink font-mono hover:border-white/20 transition-all cursor-pointer"
              >
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>

              {/* Presentational AI copilot side bar trigger */}
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-tr from-faria-orange/85 via-faria-pink/85 to-faria-pink/85 border border-faria-pink/30 text-[10px] text-faria-paper font-bold rounded-full pulse-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-faria-yellow animate-spin-slow" />
                <span className="hidden md:inline">Ask AI Assist</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-1.5 bg-faria-lightPlum/20 border border-white/5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Logout session"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* 2. MAIN DYNAMIC TAB CONTENT AREA */}
        <div className="flex-1 overflow-auto relative z-0 no-scrollbar">
          {activeTab === "scheduling" ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              {/* KPI stat bar chip dashboard header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                 className="flex flex-wrap gap-3.5 mb-6.5 select-none"
              >
                <div className="bg-faria-lightPlum/25 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-faria-pink shadow-[0_0_8px_rgba(232,55,172,0.7)]" />
                  <span className="text-sm text-[#AEB9D6]">
                    Active Teammates selected: <strong className="text-white"><CountUp value={selectedPeopleIds.length} /></strong>
                  </span>
                </div>
                {weekData?.rankedSummary && (
                  <div className="bg-faria-lightPlum/25 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4DFFA0] shadow-[0_0_8px_rgba(77,255,160,0.7)] animate-pulse" />
                    <span className="text-sm text-[#AEB9D6]">
                      Consensus Slots Spotted: <strong className="text-white"><CountUp value={weekData.rankedSummary.length} /></strong>
                    </span>
                  </div>
                )}
                <div className="bg-faria-lightPlum/25 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-faria-yellow shadow-[0_0_8px_rgba(247,211,95,0.7)]" />
                  <span className="text-sm text-[#AEB9D6]">
                    Filtered filters: <strong className="text-white"><CountUp value={preferences.muted_titles?.length || 0} /> rules</strong>
                  </span>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
                
                {/* sidebar - Left column (Desktop only) */}
                <aside className="hidden lg:block space-y-6">
                  <div className="flex items-center justify-between bg-faria-lightPlum/20 border border-white/5 rounded-xl px-4 py-2 hover:border-[#6D8BFF]/25 transition-all">
                    <span className="text-xs tracking-wider uppercase font-bold text-faria-paper/60">Local Cache Sync</span>
                    <button
                      onClick={handleSyncFreshReload}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-faria-pink/10 hover:bg-faria-pink/20 border border-faria-pink/25 text-faria-pink text-xs uppercase font-bold tracking-wider transition-all cursor-pointer"
                      title="Force refresh calendars & clear cache"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingWeek ? "animate-spin" : ""}`} />
                      Sync
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

                  {/* working segments manager */}
                  <HoursSelector
                    segments={userWorkHours}
                    onSaveSegments={handleSaveSegments}
                  />

                  {/* sub-calendars list tracker */}
                  <div className="glass-panel rounded-2xl p-4.5">
                    <h4 className="font-display text-sm font-semibold text-faria-paper mb-2.5 flex items-center gap-1.5">
                      <CalendarRange className="h-4 w-4 text-faria-pink" />
                      Active Calendars list
                    </h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                      {calendars.map((c, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-xs text-[#AEB9D6] hover:text-faria-paper cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.include}
                            className="rounded border-faria-pink/30 text-faria-pink focus:ring-faria-pink cursor-pointer bg-faria-plum/40"
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
                      <span className="text-xs text-faria-paper/55 uppercase tracking-wider font-bold font-mono">
                        Active Focus Week
                      </span>
                      <span className="font-display block text-base font-bold text-faria-paper">
                        Week of {DateTime.fromISO(currentWeekStart).toFormat("MMMM dd, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShiftWeek(-1)}
                        className="p-1.5 bg-faria-lightPlum/15 hover:bg-faria-lightPlum/25 text-faria-paper/85 border border-white/5 rounded-xl transition-all cursor-pointer"
                        title="Previous Week"
                      >
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => {
                          const mon = DateTime.now().setZone("America/New_York").startOf("week");
                           setCurrentWeekStart(mon.toFormat("yyyy-MM-dd"));
                        }}
                        className="px-3.5 py-1.5 bg-faria-lightPlum/15 hover:bg-faria-lightPlum/25 text-sm font-semibold text-faria-paper border border-white/5 rounded-xl transition-all cursor-pointer"
                      >
                        Go to Today
                      </button>
                      <button
                        onClick={() => handleShiftWeek(1)}
                        className="p-1.5 bg-faria-lightPlum/15 hover:bg-faria-lightPlum/25 text-faria-paper/85 border border-white/5 rounded-xl transition-all cursor-pointer"
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
                      <h4 className="font-display text-sm font-bold text-faria-paper uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-faria-yellow" />
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
                              className="bg-faria-lightPlum/20 border border-white/5 hover:border-faria-pink/40 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between shadow-md"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm font-bold text-faria-pink">
                                    {item.dayName} &bull; {item.formattedDate}
                                  </span>
                                  <span className="text-xs text-faria-yellow font-mono font-bold uppercase tracking-wider">
                                    Rank #{idx + 1}
                                  </span>
                                </div>
                                <span className="text-base font-semibold font-mono text-faria-paper">
                                  {timeRepresentation}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-3 text-xs text-faria-paper/50 font-mono">
                                <span>Duration: {item.slot.duration} hours</span>
                                <span className="text-[#4DFFA0] font-bold">&#10003; Overlap Ready</span>
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
                      <Bot className="h-10 w-10 text-faria-pink opacity-40 animate-pulse" />
                      <h4 className="text-base font-display font-bold text-faria-paper">No Overlaps Loaded</h4>
                      <p className="text-sm text-faria-paper/70 max-w-sm">
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
            </div>
          ) : activeTab === "weekly" ? (
            <WeeklyHorizon />
          ) : activeTab === "daily" ? (
            <DailyFocus />
          ) : (
            <AICopilotTab />
          )}
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
              className="relative flex w-full max-w-xs flex-col bg-faria-plum p-5 overflow-y-auto border-r border-white/8 space-y-6 no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 file-line">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center text-white text-xs font-bold">F</div>
                  <span className="font-display font-semibold text-xs text-faria-paper">Faria Navigation</span>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)} 
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Navigation List */}
              <nav className="space-y-1.5 pb-4 border-b border-white/5">
                {[
                  { id: "scheduling", label: "Scheduling Hub", icon: CalendarDays },
                  { id: "weekly", label: "Weekly Horizon", icon: Layout },
                  { id: "daily", label: "Daily Focus", icon: Clock },
                  { id: "ai", label: "AI Copilot", icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold tracking-wide border ${
                        isActive 
                          ? "bg-white/10 text-faria-pink border-white/10 shadow-md" 
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
                      }`}
                    >
                      <Icon size={14} className={`mr-3 ${isActive ? "text-faria-pink font-bold" : ""}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center justify-between bg-faria-lightPlum/20 border border-white/5 rounded-xl px-4 py-2 hover:border-[#6D8BFF]/25 transition-all">
                <span className="text-[10px] tracking-wider uppercase font-bold text-faria-paper/60">Local Cache Sync</span>
                <button
                  onClick={handleSyncFreshReload}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-faria-pink/10 hover:bg-faria-pink/20 border border-faria-pink/25 text-faria-pink text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                  title="Force refresh calendars & clear cache"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingWeek ? "animate-spin" : ""}`} />
                  Sync
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
                <h4 className="font-display text-xs font-semibold text-faria-paper mb-2.5 flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-faria-pink" />
                  Active Calendars list
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {calendars.map((c, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-[11px] text-[#AEB9D6] hover:text-faria-paper cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.include}
                        className="rounded border-faria-pink/30 text-faria-pink focus:ring-faria-pink cursor-pointer bg-faria-plum/40"
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
