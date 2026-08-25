import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowRight, HeartPulse, BarChart3, Stethoscope,
  ShieldCheck, Activity, Database, Bell, FileText,
  ChevronRight, Sun, Moon, Quote
} from 'lucide-react';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/common/Card';
import { Canvas } from '@react-three/fiber';
import { AnalyticsVisual, IntegrationVisual, AlertsVisual } from '../components/3d/FeatureVisuals';

interface LandingPageProps {
  onStartLogin: () => void;
}

export const InteractiveDashboard = () => {
  const [activeTab, setActiveTab] = useState('risk');
  return (
    <div className="w-full relative group perspective-1000 py-10">
      <motion.div 
        className="w-full rounded-2xl border border-border-glass bg-surface/80 backdrop-blur-xl shadow-2xl p-3 transition-all duration-700 ease-out transform-gpu rotate-y-[-12deg] rotate-x-[8deg] hover:rotate-0 hover:scale-[1.02]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex flex-wrap gap-2 mb-4 p-2 border-b border-border-glass">
          <button onClick={() => setActiveTab('risk')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'risk' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-main'}`}>Risk Scoring</button>
          <button onClick={() => setActiveTab('alerts')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'alerts' ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]' : 'text-text-muted hover:text-text-main'}`}>Active Alerts</button>
          <button onClick={() => setActiveTab('monitoring')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'monitoring' ? 'bg-primary/10 text-text-main' : 'text-text-muted hover:text-text-main'}`}>Monitoring</button>
        </div>
        <div className="p-4 min-h-[350px] relative overflow-hidden bg-base/50 rounded-xl">
           <AnimatePresence mode="wait">
             {activeTab === 'risk' && <motion.div key="risk" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-danger/10 border border-danger/20">
                   <div>
                     <p className="text-danger font-bold">High Readmission Risk</p>
                     <p className="text-xs text-text-muted">Detected 2 hours ago</p>
                   </div>
                   <div className="text-3xl font-black text-danger">87%</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                   <div className="h-24 rounded-xl bg-surface border border-border-glass p-4 flex flex-col justify-end"><div className="h-2 w-1/2 bg-border-glass rounded"></div></div>
                   <div className="h-24 rounded-xl bg-surface border border-border-glass p-4 flex flex-col justify-end"><div className="h-2 w-3/4 bg-border-glass rounded"></div></div>
                </div>
             </motion.div>}
             {activeTab === 'alerts' && <motion.div key="alerts" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-4">
                <div className="h-16 rounded-xl bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/20 flex items-center px-4"><div className="h-3 w-1/3 bg-[var(--accent-secondary)]/50 rounded"></div></div>
                <div className="h-16 rounded-xl bg-surface border border-border-glass flex items-center px-4"><div className="h-3 w-1/2 bg-border-glass rounded"></div></div>
                <div className="h-16 rounded-xl bg-surface border border-border-glass flex items-center px-4"><div className="h-3 w-1/4 bg-border-glass rounded"></div></div>
             </motion.div>}
             {activeTab === 'monitoring' && <motion.div key="monitoring" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid grid-cols-2 gap-4">
                <div className="h-40 rounded-xl bg-surface border border-border-glass flex flex-col items-center justify-center gap-2">
                   <HeartPulse className="w-8 h-8 text-primary/50" />
                   <div className="h-2 w-16 bg-border-glass rounded"></div>
                </div>
                <div className="h-40 rounded-xl bg-surface border border-border-glass flex flex-col items-center justify-center gap-2">
                   <Activity className="w-8 h-8 text-[var(--accent-secondary)]/50" />
                   <div className="h-2 w-16 bg-border-glass rounded"></div>
                </div>
             </motion.div>}
           </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Counter hook ── */
export function useCountUp(target: number, trigger: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return count;
}

/* ── Animation variants ── */
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
} as const;

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  // Scroll state
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      // Progress: 0 at top, 1 when hero is fully scrolled past
      const heroEnd = window.innerHeight * 0.9;
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / heroEnd)));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Stats
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const patients = useCountUp(10000, statsInView);
  const uptime = useCountUp(99, statsInView, 1500);
  const features = useCountUp(35, statsInView, 1200);

  return (
    <div className="bg-transparent text-text-main font-sans relative overflow-x-hidden">

      {/* ─── 1. NAVBAR ─── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className={`fixed top-0 w-full px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-base/90 backdrop-blur-lg border-b border-border-glass shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">Pulse AI</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-surface border border-border-glass flex items-center justify-center hover:bg-surface-glass transition-colors"
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4 text-text-muted" /> : <Sun className="w-4 h-4 text-text-muted" />}
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartLogin}
            className="btn btn-accent text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5"
          >
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </motion.button>
        </div>
      </motion.header>

      {/* ─── 2. HERO ─── */}
      <section className="min-h-[100dvh] relative flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
            {/* Left: Text */}
            <div className="z-10 order-2 lg:order-1">


              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6 }}
                className="!text-4xl sm:!text-5xl lg:!text-6xl xl:!text-7xl font-black tracking-tight leading-[1.08] mb-6"
              >
                Predict. Prevent.{' '}
                <span className="text-gradient">Protect.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-base sm:text-lg text-text-muted max-w-lg leading-relaxed mb-8"
              >
                Reduce heart failure readmissions with our 35-feature AI model.
                Real-time risk scoring, instant alerts, and actionable clinical insights —
                designed for care teams who refuse to lose patients to preventable events.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onStartLogin}
                  className="btn btn-accent text-sm px-7 py-3 rounded-xl font-bold"
                >
                  Enter Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </motion.button>
                <button
                  onClick={onStartLogin}
                  className="text-sm text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1"
                >
                  Learn more <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Right: Living Heart (Global Canvas fills this space) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="order-1 lg:order-2 w-full h-[400px] sm:h-[500px] lg:h-[700px] relative flex items-center justify-center pointer-events-none"
            >
              {/* The global 3D heart transitions into this area. Pointer events are handled by eventSource on document.body */}
            </motion.div>
          </div>
        </div>
      </section>
      {/* ─── 3. EDITORIAL STATISTIC SECTION (Phase 3) ─── */}
      <section ref={statsRef} className="py-24 sm:py-32 relative overflow-hidden bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="relative flex flex-col items-center sm:items-start min-h-[500px] justify-center">
             
             {/* Huge Dominant Stat */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center sm:text-left z-10 relative"
             >
                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                   <span className="text-[8rem] sm:text-[14rem] font-black tracking-tighter text-gradient leading-none">40</span>
                   <span className="text-6xl sm:text-8xl font-black text-primary">%</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black mt-2">fewer readmissions.</h3>
             </motion.div>

             {/* Asymmetric secondary stats */}
             <div className="w-full mt-16 sm:mt-0 relative sm:absolute sm:inset-0 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="sm:absolute sm:top-12 sm:right-32 text-center sm:text-right mb-12 sm:mb-0"
                >
                  <p className="text-5xl sm:text-7xl font-black text-text-main">{patients.toLocaleString()}+</p>
                  <p className="text-sm text-text-muted font-bold tracking-widest uppercase mt-2">Patients Monitored</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="sm:absolute sm:bottom-12 sm:right-12 text-center sm:text-right"
                >
                  <p className="text-5xl sm:text-7xl font-black text-text-main">{uptime}.9%</p>
                  <p className="text-sm text-text-muted font-bold tracking-widest uppercase mt-2">Diagnostic Accuracy</p>
                </motion.div>
             </div>

          </div>
        </div>
      </section>

      {/* ─── 5. INTERACTIVE PRODUCT SHOWCASE (Phase 4) ─── */}
      <section className="py-24 sm:py-32 bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="!text-3xl sm:!text-5xl font-black mb-6">
                A command center for <span className="text-gradient">clinical insight</span>
              </h2>
              <p className="text-lg text-text-muted leading-relaxed mb-8">
                Explore the platform interactively. Switch between Risk Scoring, Active Alerts, and Patient Monitoring to see how Pulse AI surfaces critical data instantly.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: 'Zero learning curve', desc: 'Designed alongside clinicians to fit naturally into existing workflows.' },
                  { title: 'Actionable intelligence', desc: 'We don\'t just flag risk—we provide the specific features driving it.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                    <div>
                      <h5 className="text-lg font-bold mb-1">{item.title}</h5>
                      <p className="text-text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.0, delay: 0.2 }}
            >
              <InteractiveDashboard />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── 6. ASYMMETRIC TESTIMONIALS (Phase 5) ─── */}
      <section className="py-24 sm:py-32 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="!text-3xl sm:!text-5xl font-black mb-4">
              Trusted by <span className="text-gradient">clinicians</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ duration: 0.7 }}
               className="md:col-span-7 md:col-start-1"
             >
                <Card className="p-8 sm:p-12 bg-surface-glass border-border-glass hover:border-primary/20 transition-colors h-full">
                  <Quote className="w-10 h-10 text-primary/30 mb-6" />
                  <p className="text-xl sm:text-2xl font-bold leading-relaxed mb-8">"Pulse AI flagged a high-risk patient 48 hours before they would have been readmitted. That early warning completely changed the outcome."</p>
                  <div>
                    <p className="font-bold text-lg">Dr. Sarah Chen</p>
                    <p className="text-text-muted">Cardiology, St. Jude Medical Center</p>
                  </div>
                </Card>
             </motion.div>
             
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ duration: 0.7, delay: 0.2 }}
               className="md:col-span-5 md:col-start-8 mt-0 md:mt-24"
             >
                <Card className="p-6 sm:p-8 bg-surface-glass border-border-glass hover:border-[var(--accent-secondary)]/20 transition-colors h-full">
                  <Quote className="w-8 h-8 text-[var(--accent-secondary)]/30 mb-6" />
                  <p className="text-lg leading-relaxed mb-6">"The 35-feature model gives us confidence in every prediction. It's not a black box — we can see exactly what's driving risk."</p>
                  <div>
                    <p className="font-bold">Dr. James Okafor</p>
                    <p className="text-text-muted text-sm">Heart Failure Clinic, Metro Health</p>
                  </div>
                </Card>
             </motion.div>
             
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-50px' }}
               transition={{ duration: 0.7, delay: 0.4 }}
               className="md:col-span-6 md:col-start-4 mt-6 md:mt-12"
             >
                <Card className="p-6 sm:p-8 bg-surface-glass border-border-glass hover:border-primary/20 transition-colors h-full">
                  <p className="text-lg leading-relaxed mb-6">"Integration was seamless. We were running predictions on real patient data within a day of deployment."</p>
                  <div>
                    <p className="font-bold">Dr. Maria Santos</p>
                    <p className="text-text-muted text-sm">Chief Medical Informatics Officer</p>
                  </div>
                </Card>
             </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL CTA (Phase 6) ─── */}
      <section className="py-32 sm:py-48 relative overflow-hidden bg-base">
        {/* Ambient background blob callback */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl sm:text-7xl font-black tracking-tight mb-10 leading-[1.1]">
              Ready to transform <br className="hidden sm:block"/> patient outcomes?
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartLogin}
              className="btn btn-accent text-lg px-12 py-5 rounded-2xl font-black shadow-xl shadow-primary/20"
            >
              Get Started Now <ArrowRight className="w-6 h-6 ml-2 inline-block" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── 8. FOOTER (Phase 6) ─── */}
      <footer className="py-16 border-t border-border-glass bg-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { title: 'Product', links: ['Dashboard', 'Risk Assessor', 'Patient Registry', 'Reports'] },
              { title: 'Company', links: ['About', 'Team', 'Careers', 'Blog'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Security'] },
              { title: 'Contact', links: ['Support', 'Sales', 'Partnerships', 'Press'] },
            ].map((col, idx) => (
              <div key={idx}>
                <p className="text-xs font-black uppercase tracking-widest text-text-main mb-6">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link, i) => (
                    <li key={i}><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors font-medium">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border-glass pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HeartPulse className="w-5 h-5 text-primary" />
              <span className="text-lg font-black tracking-tight">Pulse AI</span>
            </div>
            <p className="text-sm text-text-muted font-medium">© 2026 Pulse AI. All rights reserved. HIPAA Compliant.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
