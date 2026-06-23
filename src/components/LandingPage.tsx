import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Layers, 
  Cpu, 
  Globe2, 
  Zap, 
  ArrowRight, 
  Shield, 
  Activity,
  Info
} from "lucide-react";

interface LandingPageProps {
  onGoogleSignIn: () => void;
  onDemoSignIn: () => void;
}

export default function LandingPage({ onGoogleSignIn, onDemoSignIn }: LandingPageProps) {
  // Animation Variant Helpers
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-faria-plum text-faria-paper font-sans overflow-x-hidden relative selection:bg-faria-pink/35 selection:text-white">
      
      {/* FARIA TRACKS & AMBIENT GLOWS - Warm organic gradient feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none overflow-hidden z-0">
        {/* Ambient Gradient Orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-faria-pink/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[-5%] right-[10%] w-[450px] h-[450px] bg-faria-yellow/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* Subtle Faria 'Tracks' Graphic representation */}
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] border-[40px] border-faria-lightPlum/40 rounded-full blur-[2px] opacity-30" />
        <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] border-[30px] border-gradient-to-tr from-faria-orange via-faria-pink to-transparent rounded-full blur-[4px] opacity-20" />
      </div>

      {/* TOP HEADER NAV */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10 border-b border-faria-paper/10 bg-faria-plum/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-faria-orange via-faria-pink to-faria-yellow flex items-center justify-center shadow-[0_0_20px_rgba(232,55,172,0.3)]">
            <span className="text-white font-bold text-xl leading-none -mt-1">f</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold tracking-tight text-lg text-white leading-none">
              faria
            </span>
            <span className="text-[10px] text-faria-paper/70 font-semibold tracking-wide">
              Education Group
            </span>
          </div>
        </div>

        <button 
          onClick={onDemoSignIn}
          className="group flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold tracking-wide transition-all duration-300 backdrop-blur-md text-white cursor-pointer"
        >
          Explore Demo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-12 text-center relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-faria-lightPlum border border-faria-pink/30 text-faria-paper text-xs font-semibold mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(232,55,172,0.2)]"
        >
          <Zap size={14} className="text-faria-yellow animate-pulse" /> Relentless pursuit of better scheduling
        </motion.div>

        <motion.h1 
          {...fadeInUp}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight max-w-4xl leading-[1.12] text-white"
        >
          The Internal Calendar Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-faria-yellow via-faria-pink to-faria-orange">Deep Execution</span>
        </motion.h1>

        <motion.p 
          {...fadeInUp}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-base sm:text-xl text-faria-paper max-w-2xl mt-6 leading-relaxed opacity-90 font-medium"
        >
          Transforming the way our teams collaborate. Faria processes team velocity, cross-timezone mechanics, and builds generative dashboards instantly.
        </motion.p>

        {/* Real-world Interactive Auth Actions */}
        <motion.div 
          {...fadeInUp}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-xl px-4"
        >
          <button 
            onClick={onGoogleSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-faria-orange via-faria-pink to-faria-pink hover:to-faria-yellow text-white font-bold text-base tracking-wide transition-all shadow-[0_0_30px_rgba(232,55,172,0.4)] hover:shadow-[0_0_40px_rgba(232,55,172,0.6)] flex items-center justify-center gap-2 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-[150%] group-hover:animate-shine" />
            Sign in with Google Work Account <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={onDemoSignIn}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-faria-lightPlum/50 hover:bg-faria-lightPlum/80 border border-white/10 hover:border-white/20 text-faria-paper hover:text-white font-semibold text-base tracking-wide transition-all cursor-pointer backdrop-blur-md"
          >
            Explore Developer Demo
          </button>
        </motion.div>

        {/* Delegation domain warn */}
        <motion.div 
          {...fadeInUp}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-8 bg-amber-400/5 border border-amber-400/15 text-amber-200/90 text-[12px] p-4 rounded-xl max-w-lg text-left flex items-start gap-3 backdrop-blur-sm shadow-md"
        >
          <Info className="h-4.5 w-4.5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Note on Domain Delegation:</p>
            <span>Domain-wide delegation is recommended for 200&ndash;300 seats. For instant previews, Developer Demo mode is supported too!</span>
          </div>
        </motion.div>
      </section>

      {/* LIVE BLUEPRINT PREVIEW MODAL FRAME */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-faria-darkPlum/80 border border-faria-pink/20 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="text-[11px] font-bold text-faria-paper/50 tracking-widest uppercase">Faria Copilot Engine</div>
            <div className="w-10" />
          </div>

          <div className="p-6 bg-faria-plum/90 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[240px]">
            <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center justify-between text-[12px] font-bold text-faria-yellow">
                <span>[COMPILING_MATRIX]</span>
                <Activity size={14} className="animate-pulse" />
              </div>
              <div className="h-2 w-3/4 bg-faria-pink/30 rounded-full" />
              <div className="h-2 w-1/2 bg-faria-pink/20 rounded-full" />
              <div className="h-16 rounded-lg bg-faria-orange/10 border border-faria-orange/20 flex items-center justify-center text-sm font-bold text-faria-orange">
                98% Team Overlap
              </div>
            </div>
            <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-4 md:col-span-2 flex flex-col justify-between">
              <p className="text-sm font-medium text-faria-paper leading-relaxed">
                <span className="text-faria-pink font-bold">faria_copilot&gt;</span> "Find optimal sync space between the Berlin, Tokyo, and New York engineering teams..."
              </p>
              <div className="h-14 bg-faria-yellow/10 border border-faria-yellow/30 rounded-lg p-4 flex items-center justify-between text-sm text-faria-yellow font-bold shadow-[0_0_15px_rgba(247,211,95,0.1)]">
                <span>Optimal: 09:30 AM EST (Consensus Match)</span>
                <span className="px-2 py-1 rounded bg-faria-yellow text-faria-plum text-[10px] font-extrabold uppercase tracking-wider">Ready</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ADVANCED BENTO FEATURE MATRIX */}
      <section className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">Engineered for Better Outcomes</h2>
          <p className="text-sm sm:text-base text-faria-paper font-medium mt-3 opacity-80">Everything needed to schedule seamlessly across global boundaries.</p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-6 gap-6"
        >
          <motion.div variants={fadeInUp} className="md:col-span-4 bg-faria-lightPlum/30 border border-faria-pink/10 rounded-2xl p-8 hover:border-faria-pink/30 transition-all flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-xl bg-faria-pink/20 border border-faria-pink/30 flex items-center justify-center text-faria-pink mb-6 group-hover:scale-110 transition-transform">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Generative Dashboard UI</h3>
              <p className="text-sm text-faria-paper mt-3 leading-relaxed opacity-90 font-medium">
                No standard text readouts. Prompt the AI system, and watch it structure dynamic custom interactive charts, Gantt views, or timelines tailored to the question instantly.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="md:col-span-2 bg-faria-lightPlum/30 border border-faria-orange/10 rounded-2xl p-8 hover:border-faria-orange/30 transition-all flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-xl bg-faria-orange/20 border border-faria-orange/30 flex items-center justify-center text-faria-orange mb-6 group-hover:scale-110 transition-transform">
              <Globe2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Global Relays</h3>
              <p className="text-sm text-faria-paper mt-3 leading-relaxed opacity-90 font-medium">
                Math translation libraries evaluate cross-border time blocks seamlessly without complex offset friction.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="md:col-span-2 bg-faria-lightPlum/30 border border-faria-yellow/10 rounded-2xl p-8 hover:border-faria-yellow/30 transition-all flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-xl bg-faria-yellow/20 border border-faria-yellow/30 flex items-center justify-center text-faria-yellow mb-6 group-hover:scale-110 transition-transform">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Dual Horizon Gantt</h3>
              <p className="text-sm text-faria-paper mt-3 leading-relaxed opacity-90 font-medium">
                Toggle seamlessly between traditional chronological vertical lanes and overlapping horizontal timeline blocks.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="md:col-span-4 bg-faria-lightPlum/30 border border-faria-pink/10 rounded-2xl p-8 hover:border-faria-pink/30 transition-all flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-xl bg-faria-pink/20 border border-faria-pink/30 flex items-center justify-center text-faria-pink mb-6 group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Secured Architecture</h3>
              <p className="text-sm text-faria-paper mt-3 leading-relaxed opacity-90 font-medium">
                Engineered layer storing Google Client tokens and internal JWT nodes using secure runtime isolated structures, keeping scheduling metadata completely private.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-faria-paper/10 py-8 bg-faria-darkPlum">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-faria-paper/60 font-semibold text-center sm:text-left">
          <p>© 2026 Faria Education Group. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 tracking-widest text-[11px] uppercase text-faria-pink">Relentless pursuit of better</p>
        </div>
      </footer>
    </div>
  );
}
