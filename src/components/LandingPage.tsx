import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import {
  Zap, ArrowRight, Info, Globe2, Cpu, Shield, Activity,
  Calendar, Users, Clock, Sparkles, ChevronDown
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onGoogleSignIn: () => void;
  onDemoSignIn: () => void;
}

// ─── Magnetic Button ─────────────────────────────────────────────────────────

interface MagProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
}

function MagneticButton({ children, onClick, className = "", strength = 0.3 }: MagProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 350, damping: 28 });
  const springY = useSpring(y, { stiffness: 350, damping: 28 });

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  }, [x, y, strength]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

const TICKER = [
  "Scanning 6 teammates across 4 timezones...",
  "Google Calendar FreeBusy API — 0 conflicts found",
  "Consensus window: 09:30–10:00 EST · 14:30–15:00 IST",
  "Faria copilot: Sprint Planning → Thu 10:00 AM IST",
  "98% team overlap detected — slot locked",
];

function Typewriter() {
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const line = TICKER[lineIdx];
    if (!deleting && chars < line.length) {
      const t = setTimeout(() => setChars(c => c + 1), 26);
      return () => clearTimeout(t);
    }
    if (!deleting && chars === line.length) {
      const t = setTimeout(() => setDeleting(true), 2400);
      return () => clearTimeout(t);
    }
    if (deleting && chars > 0) {
      const t = setTimeout(() => setChars(c => c - 1), 13);
      return () => clearTimeout(t);
    }
    if (deleting && chars === 0) {
      setDeleting(false);
      setLineIdx(i => (i + 1) % TICKER.length);
    }
  }, [chars, deleting, lineIdx]);

  return (
    <span className="font-mono text-xs text-faria-pink">
      {TICKER[lineIdx].slice(0, chars)}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-3 bg-faria-pink align-middle ml-px"
      />
    </span>
  );
}

// ─── Animated Heatmap Grid ────────────────────────────────────────────────────

const PEOPLE = [
  { name: "You", tz: "IST", cells: [0,0,1,1,2,2,2,1,1,3,3,1,0,0,0,0,0,0,0,0,0,0,0,0] },
  { name: "Chloe", tz: "EST", cells: [0,0,0,0,0,0,0,0,0,1,2,1,3,3,1,0,0,0,0,0,0,0,0,0] },
  { name: "Kenji", tz: "JST", cells: [2,1,3,3,1,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
  { name: "Sarah", tz: "CET", cells: [0,0,0,1,1,2,1,1,3,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0] },
];

const CELL_COLORS = [
  "bg-white/5",
  "bg-faria-pink/30",
  "bg-faria-orange/60",
  "bg-faria-yellow/90",
];

function HeatmapGrid({ visible }: { visible: boolean }) {
  return (
    <div className="space-y-2">
      {PEOPLE.map((p, pi) => (
        <div key={pi} className="flex items-center gap-2">
          <div className="w-12 text-right">
            <span className="text-[10px] font-bold text-faria-paper/60">{p.name}</span>
            <span className="block text-[9px] text-faria-paper/30 font-mono">{p.tz}</span>
          </div>
          <div className="flex gap-0.5 flex-1">
            {p.cells.map((v, ci) => (
              <motion.div
                key={ci}
                className={`h-5 flex-1 rounded-[2px] ${CELL_COLORS[v]} ${v === 3 ? "ring-1 ring-faria-yellow/60" : ""}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={visible ? { scaleY: 1, opacity: 1 } : {}}
                transition={{ delay: pi * 0.08 + ci * 0.012, duration: 0.3, ease: "easeOut" }}
                style={{ transformOrigin: "bottom" }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3 pl-14">
        <div className="flex gap-3 text-[9px] text-faria-paper/40 font-mono">
          {["8am","10","12","14","16","18","20","22"].map((h, i) => (
            <span key={i} style={{ flex: "0 0 auto", width: `${100/8}%` }}>{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Copilot Engine Demo ──────────────────────────────────────────────────────

const STAGES = [
  { label: "SCANNING CALENDARS", sub: "6 teammates · 4 timezones", color: "#B982FF", pct: 30 },
  { label: "RESOLVING CONFLICTS", sub: "Freebusy API queried", color: "#FF4ECD", pct: 65 },
  { label: "COMPUTING OVERLAP", sub: "Cross-timezone matrix built", color: "#FFAA2C", pct: 88 },
  { label: "CONSENSUS MATCH", sub: "98% Team Overlap · Ready", color: "#4DFFA0", pct: 100 },
];

function CopilotEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(0);
  const [barPct, setBarPct] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let s = 0;
    const run = () => {
      if (s >= STAGES.length - 1) return;
      s++;
      setStage(s);
      setTimeout(run, 1600);
    };
    const t = setTimeout(run, 700);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const target = STAGES[stage].pct;
    const start = stage === 0 ? 0 : STAGES[stage - 1].pct;
    let current = start;
    const step = () => {
      current = Math.min(current + 1.5, target);
      setBarPct(current);
      if (current < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [stage]);

  const s = STAGES[stage];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.97 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <motion.div
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-faria-pink/20 to-transparent"
        />
      </div>

      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-[11px] tracking-widest text-faria-paper/40 uppercase">Faria Copilot Engine</span>
        <Activity size={13} className="text-faria-pink animate-pulse" />
      </div>

      {/* Main content — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">

        {/* Left: Matrix + Heatmap */}
        <div className="p-6 border-r border-white/10 space-y-5">
          <div className="space-y-1">
            <div className="font-mono text-[11px] text-faria-yellow flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >▶</motion.span>
              {s.label}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color, width: `${barPct}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>
            <div className="font-mono text-[10px] text-faria-paper/40">{s.sub}</div>
          </div>

          {/* Heatmap */}
          <HeatmapGrid visible={visible} />

          {/* Best slot badge */}
          <AnimatePresence>
            {stage === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4DFFA0]/10 border border-[#4DFFA0]/30"
              >
                <div className="w-2 h-2 rounded-full bg-[#4DFFA0] animate-pulse" />
                <span className="text-[13px] font-bold text-[#4DFFA0]">98% Team Overlap</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Copilot chat */}
        <div className="p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="font-mono text-xs text-faria-pink">faria_copilot&gt;</div>
            <p className="text-sm text-faria-paper/80 leading-relaxed">
              <Typewriter />
            </p>
          </div>

          {/* Timezone pills */}
          <div className="flex flex-wrap gap-2">
            {["IST +5:30", "EST −5", "JST +9", "CET +1"].map((tz, i) => (
              <motion.div
                key={tz}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={visible ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="px-2.5 py-1 rounded-full bg-faria-pink/10 border border-faria-pink/20 font-mono text-[10px] text-faria-pink"
              >
                {tz}
              </motion.div>
            ))}
          </div>

          {/* Result card */}
          <AnimatePresence>
            {stage >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-faria-yellow/10 border border-faria-yellow/30 shadow-[0_0_20px_rgba(247,211,95,0.08)]"
              >
                <div>
                  <div className="text-sm font-bold text-faria-yellow">Optimal: 09:30 AM EST</div>
                  <div className="text-[11px] text-faria-paper/50 mt-0.5">Consensus Match · 6/6 free</div>
                </div>
                <AnimatePresence>
                  {stage === 3 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className="px-2.5 py-1 rounded-md bg-faria-yellow text-faria-plum text-[10px] font-black uppercase tracking-wide shrink-0"
                    >
                      READY
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scrolling Marquee ────────────────────────────────────────────────────────

const MARQUEE = [
  "Google Calendar API", "FreeBusy Query", "Gemini 2.5 Flash",
  "Cross-timezone Overlap", "Domain Delegation", "IST · EST · JST · CET",
  "Org-wide Scheduling", "AI Copilot", "Real-time Heatmap",
];

function Marquee() {
  return (
    <div className="overflow-hidden py-5 border-y border-white/[0.06] relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-faria-plum to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-faria-plum to-transparent z-10 pointer-events-none" />
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 whitespace-nowrap"
      >
        {[...MARQUEE, ...MARQUEE].map((item, i) => (
          <span key={i} className="text-[13px] text-faria-paper/35 tracking-wide shrink-0">
            <span className="text-faria-pink mr-3">✦</span>{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Feature Bento Cards ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Cpu,
    title: "Generative Dashboard UI",
    body: "Prompt Faria with plain language and watch it structure dynamic charts, Gantt views, and heatmaps — tailored to your exact question.",
    accent: "faria-pink",
    accentHex: "#E837AC",
    span: "md:col-span-4",
  },
  {
    icon: Globe2,
    title: "Global Timezone Relay",
    body: "Math translation libraries resolve cross-border time blocks instantly — no offset friction, no double-booking.",
    accent: "faria-orange",
    accentHex: "#F97316",
    span: "md:col-span-2",
  },
  {
    icon: Shield,
    title: "Workspace-locked Security",
    body: "Enforced at the OAuth layer. Only your Google Workspace domain can sign in. Tokens encrypted at rest. Zero IT config.",
    accent: "faria-yellow",
    accentHex: "#F7D35F",
    span: "md:col-span-2",
  },
  {
    icon: Activity,
    title: "Real-time FreeBusy Engine",
    body: "Live Google Calendar API calls — `calendar.freebusy.query` for every teammate, every 30-minute window, rendered as a colour-coded heatmap.",
    accent: "faria-pink",
    accentHex: "#E837AC",
    span: "md:col-span-4",
  },
];

const FeatureCard: React.FC<{ f: typeof FEATURES[0]; i: number }> = ({ f, i }) => {
  const [hov, setHov] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={vis ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`${f.span} relative bg-faria-lightPlum/20 border rounded-2xl p-7 overflow-hidden transition-all duration-300 group cursor-default`}
      style={{
        borderColor: hov ? `${f.accentHex}33` : "rgba(255,255,255,0.07)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${f.accentHex}14 0%, transparent 65%)`,
          opacity: hov ? 1 : 0,
        }}
      />
      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full transition-opacity duration-300"
        style={{ background: `${f.accentHex}08`, opacity: hov ? 1 : 0 }}
      />

      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${f.accentHex}18`, border: `1px solid ${f.accentHex}30` }}
      >
        <f.icon size={20} style={{ color: f.accentHex }} />
      </div>
      <h3 className="text-[15px] font-bold text-white tracking-tight mb-2.5">{f.title}</h3>
      <p className="text-[13px] text-faria-paper/70 leading-relaxed font-medium">{f.body}</p>
    </motion.div>
  );
};

// ─── Stats Strip ──────────────────────────────────────────────────────────────

const STATS = [
  { v: "200–300", l: "org seats" },
  { v: "4", l: "timezones unified" },
  { v: "<2s", l: "overlap computed" },
  { v: "0", l: "manual steps" },
];

function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 border border-white/[0.07] rounded-2xl overflow-hidden my-24 divide-x divide-white/[0.07]">
      {STATS.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={vis ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="py-8 px-6 text-center bg-faria-lightPlum/10"
        >
          <div className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-faria-pink to-faria-yellow">
            {s.v}
          </div>
          <div className="text-[12px] text-faria-paper/50 mt-1.5 font-medium">{s.l}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW = [
  { n: "01", icon: Users, title: "Sign in with your Workspace account", body: "OAuth scoped to your org domain. No personal accounts, no external access." },
  { n: "02", icon: Calendar, title: "Add your teammates", body: "Enter emails. Faria auto-detects timezones and pulls freebusy data from Google Calendar." },
  { n: "03", icon: Clock, title: "See the overlap instantly", body: "A 24-hour heatmap renders everyone's availability side by side. Best windows glow." },
  { n: "04", icon: Sparkles, title: "Ask Faria to schedule it", body: "Type in plain language. The Gemini copilot picks the slot, cross-checks everyone, and confirms." },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={vis ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="text-center mb-14"
      >
        <div className="inline-block font-mono text-[10px] tracking-[0.15em] text-faria-paper/40 uppercase mb-4">How it works</div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
          Sign-in to scheduled in&nbsp;60&nbsp;seconds
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        {HOW.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={vis ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-faria-darkPlum/60 p-8 group hover:bg-faria-lightPlum/10 transition-colors duration-300"
          >
            <div className="absolute top-6 right-6 font-mono text-[56px] font-black text-faria-pink/5 leading-none select-none">
              {step.n}
            </div>
            <div className="font-mono text-[10px] tracking-wider text-faria-pink/70 mb-4 uppercase">{step.n}</div>
            <div className="w-9 h-9 rounded-lg bg-faria-pink/10 border border-faria-pink/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <step.icon size={16} className="text-faria-pink" />
            </div>
            <h3 className="text-[15px] font-bold text-white tracking-tight mb-2">{step.title}</h3>
            <p className="text-[13px] text-faria-paper/60 leading-relaxed">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Organic 3D Glow Orb ──────────────────────────────────────────────────────

interface Organic3DGlowOrbProps {
  onLoad: () => void;
}

function Organic3DGlowOrb({ onLoad }: Organic3DGlowOrbProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 45, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 18 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x * 50);
      mouseY.set(y * 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    const timer = setTimeout(() => {
      onLoad();
    }, 150);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, [mouseX, mouseY, onLoad]);

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] flex items-center justify-center select-none pointer-events-none"
    >
      {/* Outer ambient deep radial glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#37023c]/25 via-[#E837AC]/30 to-[#F7D35F]/25 blur-[70px] opacity-80" />

      {/* Layered fluid SVG morphing blobs */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full filter drop-shadow-[0_0_40px_rgba(232,55,172,0.25)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="35%" stopColor="#E837AC" />
            <stop offset="75%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#37023c" />
          </linearGradient>
          
          <linearGradient id="orbHighlight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F7D35F" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#E837AC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Morphing Base Blob */}
        <motion.path
          fill="url(#orbGrad)"
          animate={{
            d: [
              "M 100,40 C 140,36 176,64 184,100 C 190,136 170,164 140,180 C 104,196 64,190 44,160 C 24,130 30,96 50,70 C 64,50 80,44 100,40 Z",
              "M 100,30 C 150,24 184,60 190,100 C 196,144 160,170 124,184 C 90,196 50,184 36,150 C 20,116 30,70 56,50 C 70,36 84,32 100,30 Z",
              "M 100,50 C 136,44 170,70 180,104 C 190,140 164,176 130,190 C 96,204 56,190 40,164 C 24,136 36,104 56,76 C 70,56 84,54 100,50 Z",
              "M 100,40 C 140,36 176,64 184,100 C 190,136 170,164 140,180 C 104,196 64,190 44,160 C 24,130 30,96 50,70 C 64,50 80,44 100,40 Z"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Glossy overlay highlight */}
        <motion.path
          fill="url(#orbHighlight)"
          style={{ mixBlendMode: "overlay" }}
          animate={{
            d: [
              "M 100,44 C 136,40 170,70 176,104 C 184,140 160,170 130,184 C 96,200 56,184 40,156 C 24,124 36,90 56,64 C 70,44 84,46 100,44 Z",
              "M 100,36 C 144,30 180,64 184,104 C 190,144 156,164 124,180 C 90,196 50,180 36,144 C 20,110 30,64 56,44 C 70,30 84,40 100,36 Z",
              "M 100,44 C 136,40 170,70 176,104 C 184,140 160,170 130,184 C 96,200 56,184 40,156 C 24,124 36,90 56,64 C 70,44 84,46 100,44 Z"
            ]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>

      {/* Floating subtle particle flares */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.div
          animate={{
            y: [-12, 12, -12],
            x: [-6, 6, -6],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[22%] left-[28%] w-3 h-3 rounded-full bg-faria-yellow/60 blur-[1px]"
        />
          <motion.div
            animate={{
              y: [15, -15, 15],
              x: [8, -8, 8],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[28%] right-[24%] w-4 h-4 rounded-full bg-faria-pink/50 blur-[2px]"
          />
      </div>
    </motion.div>
  );
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────

export default function LandingPage({ onGoogleSignIn, onDemoSignIn }: LandingPageProps) {
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(40,0,70,0)", "rgba(18,0,32,0.92)"]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 320], [1, 0.4]);
  const [splineLoaded, setSplineLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-faria-plum text-faria-paper font-sans overflow-x-hidden selection:bg-faria-pink/30 selection:text-white">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Purple orb — top right */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[65vw] max-w-[900px] aspect-square rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(90px)" }}
        />
        {/* Pink orb — bottom left */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] -left-[15%] w-[55vw] max-w-[800px] aspect-square rounded-full"
          style={{ background: "radial-gradient(circle, rgba(232,55,172,0.35) 0%, transparent 70%)", filter: "blur(100px)" }}
        />
        {/* Amber micro-orb — center */}
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[45%] left-[48%] -translate-x-1/2 -translate-y-1/2 w-[35vw] max-w-[480px] aspect-square rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        {/* Subtle ring */}
        <div className="absolute top-[12%] left-[-8%] w-[55vw] aspect-square rounded-full border-[50px] border-faria-pink/[0.04] blur-sm" />
        <div className="absolute top-[30%] right-[-5%] w-[40vw] aspect-square rounded-full border-[35px] border-faria-yellow/[0.03] blur-sm" />
      </div>

      {/* ── Noise texture ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px", mixBlendMode: "overlay" }}
      />

      {/* ── NAV ── */}
      <motion.header
        style={{ backgroundColor: navBg as any }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/[0.04]"
      >
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center shadow-[0_0_18px_rgba(232,55,172,0.35)]">
              <span className="text-white font-black text-lg leading-none -mt-0.5">f</span>
            </div>
            <div>
              <div className="font-display font-bold text-[17px] text-white leading-none tracking-tight">faria</div>
              <div className="text-[9px] text-faria-paper/50 font-semibold tracking-[0.1em] uppercase">Education Group</div>
            </div>
          </motion.div>

          {/* Nav right */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={onGoogleSignIn}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-faria-paper/70 hover:text-white transition-colors font-medium"
            >
              Sign in
            </button>
            <MagneticButton
              onClick={onDemoSignIn}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/[0.15] border border-white/15 text-sm font-bold text-white transition-all backdrop-blur-sm cursor-pointer"
            >
              Explore Demo <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </MagneticButton>
          </motion.div>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-8"
      >
        {/* Organic 3D orb — loads behind hero text */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-60">
          <div className="w-full h-full max-w-3xl mx-auto flex items-center justify-center">
            <Organic3DGlowOrb onLoad={() => setSplineLoaded(true)} />
          </div>
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-faria-lightPlum/60 border border-faria-pink/25 text-xs font-semibold text-faria-paper mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(232,55,172,0.15)]"
        >
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}>
            <Zap size={12} className="text-faria-yellow" />
          </motion.span>
          Relentless pursuit of better scheduling
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-5xl sm:text-6xl lg:text-[76px] font-display font-extrabold tracking-tight max-w-4xl leading-[1.08] text-white"
        >
          The Internal Calendar<br />Built for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-faria-yellow via-faria-pink to-faria-orange">
            Deep Execution
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-base sm:text-lg text-faria-paper/75 max-w-xl mt-6 leading-relaxed font-medium"
        >
          Transforming the way our teams collaborate. Faria processes team velocity,
          cross-timezone mechanics, and builds generative dashboards instantly.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-xl"
        >
          <MagneticButton
            onClick={onGoogleSignIn}
            className="relative w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-faria-orange via-faria-pink to-faria-pink text-white font-bold text-[15px] tracking-wide shadow-[0_0_32px_rgba(232,55,172,0.45)] hover:shadow-[0_0_48px_rgba(232,55,172,0.65)] transition-shadow flex items-center justify-center gap-2.5 overflow-hidden group cursor-pointer"
          >
            {/* Shine sweep */}
            <div className="absolute inset-0 w-1/3 h-full bg-white/20 skew-x-[-20deg] -translate-x-[250%] group-hover:translate-x-[450%] transition-transform duration-700 ease-in-out" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google Work Account
            <ArrowRight size={16} />
          </MagneticButton>

          <MagneticButton
            onClick={onDemoSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-faria-paper hover:text-white font-semibold text-[15px] tracking-wide transition-all backdrop-blur-md cursor-pointer"
          >
            Explore Developer Demo
          </MagneticButton>
        </motion.div>

        {/* Domain delegation note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="relative mt-8 bg-amber-400/[0.06] border border-amber-400/15 text-amber-200/80 text-[12px] p-4 rounded-xl max-w-md text-left flex items-start gap-3 backdrop-blur-sm"
        >
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5 text-amber-300">Note on Domain Delegation:</p>
            Domain-wide delegation is recommended for 200–300 seats. Developer Demo mode is supported for instant previews!
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative mt-14 flex flex-col items-center gap-2 text-faria-paper/30"
        >
          <span className="text-[10px] tracking-[0.15em] uppercase font-mono">Scroll</span>
          <ChevronDown size={16} />
        </motion.div>
      </motion.section>

      {/* ── Page body ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* Marquee */}
        <Marquee />

        {/* Section label + Copilot Engine */}
        <section className="pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <div className="font-mono text-[10px] tracking-[0.15em] text-faria-paper/35 uppercase mb-3">Live Demo</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              Watch the overlap engine work
            </h2>
          </motion.div>
          <CopilotEngine />
        </section>

        {/* Stats */}
        <StatsStrip />

        {/* Features bento */}
        <section className="pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <div className="font-mono text-[10px] tracking-[0.15em] text-faria-paper/35 uppercase mb-3">Capabilities</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              Built for how your org actually works
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} i={i} />)}
          </div>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Bottom CTA */}
        <section className="pb-32">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl p-16 text-center overflow-hidden border border-faria-pink/15 bg-faria-lightPlum/20"
          >
            {/* Inner glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.18) 0%, transparent 65%)" }} />

            <div className="font-mono text-[10px] tracking-[0.15em] text-faria-paper/35 uppercase mb-4">Get started</div>
            <h2 className="text-3xl md:text-[42px] font-display font-bold text-white tracking-tight leading-tight mb-4">
              Ready to stop<br />scheduling manually?
            </h2>
            <p className="text-base text-faria-paper/60 max-w-md mx-auto mb-10 leading-relaxed font-medium">
              Faria runs inside your Google Workspace, respects your data, and ships zero to Slack.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                onClick={onGoogleSignIn}
                className="relative w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-faria-orange via-faria-pink to-faria-pink text-white font-bold text-[15px] shadow-[0_0_32px_rgba(232,55,172,0.4)] hover:shadow-[0_0_48px_rgba(232,55,172,0.6)] transition-shadow flex items-center justify-center gap-2.5 overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 w-1/3 bg-white/20 skew-x-[-20deg] -translate-x-[250%] group-hover:translate-x-[450%] transition-transform duration-700" />
                Sign in with Google Work Account
              </MagneticButton>
              <MagneticButton
                onClick={onDemoSignIn}
                className="w-full sm:w-auto px-9 py-4 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 hover:border-white/20 text-faria-paper hover:text-white font-semibold text-[15px] transition-all backdrop-blur-md cursor-pointer"
              >
                Try Developer Demo
              </MagneticButton>
            </div>
          </motion.div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.07] py-8 bg-faria-darkPlum/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-faria-paper/40 font-medium text-center sm:text-left">
          <p>© 2026 Faria Education Group. All rights reserved.</p>
          <p className="text-[11px] tracking-[0.1em] uppercase text-faria-pink/60">
            Powered by Gemini 2.5 Flash · Google Calendar API
          </p>
        </div>
      </footer>
    </div>
  );
}
