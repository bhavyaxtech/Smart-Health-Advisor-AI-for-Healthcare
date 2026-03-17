"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" },
  }),
};

const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const featureCards = [
  {
    title: "Symptom Analysis",
    body: "Describe what you feel in plain language and receive structured, evidence-based insight with clear next-step guidance.",
    tags: ["AI-powered", "Evidence-based"],
    color: "amber",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <circle cx="10" cy="10" r="7.5" stroke="#a85a14" strokeWidth="1.3" />
        <path d="M7 10l2.3 2.3 3.8-4" stroke="#a85a14" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Health Dashboard",
    body: "Track trends over time. Your personal dashboard surfaces risk factors, improvement areas, and AI recommendations.",
    tags: ["Real-time", "Trend tracking"],
    color: "stone",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="#5a5249" strokeWidth="1.3" />
        <path d="M5 12.5l3-3.5 3 3 4-4.5" stroke="#5a5249" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "AI Chat & Voice",
    body: "Ask health questions by typing or speaking. Vital understands context and guides you with thoughtful follow-ups.",
    tags: ["Voice input", "Natural language"],
    color: "sky",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <rect x="6.5" y="2" width="7" height="9" rx="3.5" stroke="#3d748a" strokeWidth="1.3" />
        <path d="M3.5 10A6.5 6.5 0 0010 16.5 6.5 6.5 0 0016.5 10" stroke="#3d748a" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="10" y1="16.5" x2="10" y2="18.5" stroke="#3d748a" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Research-backed Answers",
    body: "Every insight is grounded in real medical literature. Vital searches PubMed live to surface the latest evidence.",
    tags: ["PubMed", "Live search"],
    color: "amber",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="#a85a14" strokeWidth="1.3" />
        <path d="M13 13l3.5 3.5" stroke="#a85a14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Personalized Diet Plans",
    body: "Get tailored food recommendations — what to eat, avoid, and focus on — adapted to your symptoms and profile.",
    tags: ["Personalized", "Meal plans"],
    color: "stone",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <path d="M4 6.5c0-2.2 1.8-4 4-4 1.4 0 2.6.7 3.3 1.8M16 13.5c0 2.2-1.8 4-4 4-1.4 0-2.6-.7-3.3-1.8" stroke="#5a5249" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M2.5 10.5s1.5-2 4-2 4 2 4 2 1.5 2 4 2 4-2 4-2" stroke="#5a5249" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Pattern Analysis",
    body: "Vital looks across your history to find recurring symptoms, trends, and early warning signals before they escalate.",
    tags: ["Longitudinal", "Early detection"],
    color: "sky",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
        <path d="M5 11.5l2.2 2.2L14 7.5" stroke="#3d748a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="#3d748a" strokeWidth="1.3" />
        <path d="M7 2.5v3M13 2.5v3M2.5 8h15" stroke="#3d748a" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const steps = [
  { num: "1", title: "Describe your symptoms", body: "Type or speak about how you feel — pain, duration, severity. Be as natural as you like." },
  { num: "2", title: "AI analyses in seconds", body: "Vital cross-references your input with medical research and your personal history." },
  { num: "3", title: "Act on your insights", body: "Get a clear plan with diet changes, lifestyle tips, red flags, and when to see a doctor." },
];

const tagStyles = {
  amber: "bg-[rgba(201,112,34,0.09)] text-[#7e420d]",
  stone: "bg-[rgba(160,153,144,0.15)] text-[#5a5249]",
  sky: "bg-[rgba(137,184,204,0.18)] text-[#3d748a]",
};

const icoStyles = {
  amber: "bg-[linear-gradient(135deg,rgba(237,175,96,0.18),rgba(201,112,34,0.10))]",
  stone: "bg-[linear-gradient(135deg,rgba(160,153,144,0.18),rgba(90,82,73,0.10))]",
  sky: "bg-[linear-gradient(135deg,rgba(137,184,204,0.16),rgba(90,82,73,0.08))]",
};

export default function LandingPage() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Ambient orb layer */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-44 h-[700px] w-[700px] rounded-full blur-[88px]"
          style={{ background: "radial-gradient(circle,rgba(201,112,34,0.14) 0%,transparent 70%)", animation: "floatOrb 22s ease-in-out infinite" }} />
        <div className="absolute -right-20 top-16 h-[600px] w-[600px] rounded-full blur-[88px]"
          style={{ background: "radial-gradient(circle,rgba(237,175,96,0.10) 0%,transparent 70%)", animation: "floatOrb 22s ease-in-out infinite -8s" }} />
        <div className="absolute bottom-56 left-[18%] h-[500px] w-[500px] rounded-full blur-[88px]"
          style={{ background: "radial-gradient(circle,rgba(137,184,204,0.09) 0%,transparent 70%)", animation: "floatOrb 22s ease-in-out infinite -15s" }} />
        <div className="absolute -bottom-20 right-[22%] h-[380px] w-[380px] rounded-full blur-[88px]"
          style={{ background: "radial-gradient(circle,rgba(168,90,20,0.08) 0%,transparent 70%)", animation: "floatOrb 22s ease-in-out infinite -5s" }} />
      </div>

      {/* Floating pill navbar */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-6">
        <header
          className="pointer-events-auto flex w-full max-w-[1060px] items-center justify-between rounded-[18px] px-5 transition-all duration-[350ms] ease-out"
          style={{
            height: 56,
            background: scrolled ? "rgba(255,252,248,0.86)" : "rgba(255,252,248,0.52)",
            backdropFilter: scrolled ? "blur(36px) saturate(220%)" : "blur(12px) saturate(150%)",
            WebkitBackdropFilter: scrolled ? "blur(36px) saturate(220%)" : "blur(12px) saturate(150%)",
            border: scrolled ? "1px solid rgba(255,255,255,0.92)" : "1px solid rgba(255,255,255,0.62)",
            boxShadow: scrolled ? "0 8px 40px rgba(20,16,8,0.13),0 2px 8px rgba(20,16,8,0.06)" : "0 4px 24px rgba(20,16,8,0.08),0 1px 4px rgba(20,16,8,0.04)",
          }}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] font-display text-sm text-stone-50"
              style={{ background: "linear-gradient(135deg,#c97022,#edaf60)", boxShadow: "0 2px 10px rgba(201,112,34,0.36)" }}>
              V
            </span>
            <span className="font-display text-xl font-normal text-stone-900">Vital</span>
          </Link>

          <nav className="hidden items-center gap-1 min-[920px]:flex">
            {[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how" },
              { label: "About", href: "#about" },
            ].map((item) => (
              <a key={item.label} href={item.href} className="rounded-lg px-3 py-1.5 text-[0.855rem] text-stone-500 transition duration-200 hover:bg-white/55 hover:text-stone-800">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-[10px] border border-[rgba(20,16,8,0.13)] px-4 py-1.5 text-sm text-stone-700 transition duration-200 hover:border-[rgba(20,16,8,0.22)] hover:bg-white/75">
              Sign in
            </Link>
            <Link href="/login"
              className="hidden rounded-[10px] px-4 py-1.5 text-sm font-medium text-stone-50 transition duration-200 hover:-translate-y-px min-[920px]:inline-flex"
              style={{ background: "linear-gradient(135deg,#c97022,#a85a14)", boxShadow: "0 2px 12px rgba(168,90,20,0.32)" }}>
              Get started
            </Link>
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-24 pt-28 sm:px-8">

        {/* ── Hero ── */}
        <section className="grid items-center gap-8 min-[920px]:grid-cols-[1fr_1fr]">

          {/* Left copy */}
          <motion.div
            initial={reducedMotion ? false : "hidden"}
            animate={reducedMotion ? undefined : "visible"}
            variants={staggerParent}
          >
            {/* Badge */}
            <motion.div custom={0} variants={fadeUp}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/88 bg-[rgba(255,252,248,0.72)] px-3 py-1.5 text-xs font-medium text-stone-500 backdrop-blur-sm"
              style={{ boxShadow: "0 2px 12px rgba(20,16,8,0.06)" }}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}>
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              AI-powered health intelligence
            </motion.div>

            {/* Headline */}
            <motion.h1 custom={0.08} variants={fadeUp}
              className="font-display font-normal text-stone-900"
              style={{ fontSize: "clamp(2.8rem,5vw,4.3rem)", lineHeight: 1.08, letterSpacing: "-0.026em" }}>
              Your health,<br />
              <span className="hero-italic-accent">understood</span><br />
              deeply.
            </motion.h1>

            {/* Sub */}
            <motion.p custom={0.16} variants={fadeUp}
              className="mt-6 max-w-[430px] text-base font-light leading-[1.78] text-stone-400">
              Describe how you&apos;re feeling. Get evidence-based insights, a personalised diet plan, and clear guidance — in seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div custom={0.24} variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link href="/login"
                className="inline-flex items-center gap-2 rounded-[12px] px-6 py-3 text-sm font-medium text-stone-50 transition duration-200 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#c97022,#a85a14)", boxShadow: "0 4px 20px rgba(168,90,20,0.36)" }}>
                Start for free
                <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
                  <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#how"
                className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-6 py-3 text-sm font-medium text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:-translate-y-px">
                How it works
              </a>
            </motion.div>

            {/* Trust items */}
            <motion.div custom={0.32} variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-5">
              {["No credit card required", "5 free analyses", "Private by default"].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-stone-400">
                  <div className="flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-full bg-[rgba(201,112,34,0.11)]">
                    <svg viewBox="0 0 9 9" fill="none" width="8" height="8">
                      <path d="M1.8 4.5l2 2 3.4-3.4" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: dashboard preview card */}
          <motion.div
            initial={reducedMotion ? false : "hidden"}
            animate={reducedMotion ? undefined : "visible"}
            variants={fadeUp}
            custom={0.16}
            className="relative"
          >
            {/* Floating mini cards */}
            <div className="glass absolute -left-7 top-14 z-10 hidden rounded-[14px] px-4 py-3 min-[920px]:block"
              style={{ animation: "floatCard 8s ease-in-out infinite" }}>
              <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Sleep Quality</p>
              <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">87<span className="text-sm text-stone-400">/100</span></p>
              <p className="mt-1 text-[11px] font-medium text-amber-600">↑ 12% this week</p>
            </div>
            <div className="glass absolute -right-4 top-4 z-10 hidden rounded-[14px] px-4 py-3 min-[920px]:block"
              style={{ animation: "floatCard 7s ease-in-out infinite -5s" }}>
              <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Analyses done</p>
              <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">4</p>
              <p className="mt-1 text-[11px] font-medium text-amber-600">1 credit left</p>
            </div>
            <div className="glass absolute -left-4 bottom-20 z-10 hidden rounded-[14px] px-4 py-3 min-[920px]:block"
              style={{ animation: "floatCard 10s ease-in-out infinite -3s" }}>
              <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Stress Index</p>
              <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">Low</p>
              <div className="mt-1.5 flex h-6 items-end gap-0.5">
                {[42, 66, 52, 80, 44, 62].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-amber-300"
                    style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.55 }} />
                ))}
              </div>
            </div>

            {/* Main card */}
            <div className="glass-strong rounded-[28px] p-5 sm:p-6">
              {/* Card header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}>AR</div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Health Dashboard</p>
                    <p className="text-xs text-stone-400">Updated just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.08)] px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" style={{ animation: "pulseDot 2s ease-in-out infinite" }} />
                  Live
                </div>
              </div>

              {/* Score ring */}
              <div className="mb-3 flex items-center gap-3.5 rounded-[14px] border border-[rgba(201,112,34,0.12)] bg-[rgba(201,112,34,0.05)] p-3.5">
                <svg viewBox="0 0 62 62" fill="none" width="62" height="62" className="flex-shrink-0">
                  <circle cx="31" cy="31" r="25" stroke="rgba(201,112,34,0.12)" strokeWidth="7" fill="none" />
                  <circle cx="31" cy="31" r="25" stroke="url(#scoreGrad)" strokeWidth="7" fill="none"
                    strokeLinecap="round" strokeDasharray="157" strokeDashoffset="39" transform="rotate(-90 31 31)" />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#edaf60" /><stop offset="100%" stopColor="#c97022" />
                    </linearGradient>
                  </defs>
                  <text x="31" y="36" textAnchor="middle" fontFamily="Fraunces,serif" fontSize="15" fill="#252018" fontWeight="400">75</text>
                </svg>
                <div>
                  <p className="text-xs text-stone-400">Overall Health Score</p>
                  <p className="font-display text-[1.72rem] font-normal leading-none text-stone-900">75</p>
                  <p className="mt-0.5 text-xs font-medium text-amber-600">↑ Good — improving</p>
                </div>
              </div>

              {/* Metric chips */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[
                  { val: "4", label: "Credits" },
                  { val: "2", label: "Patterns" },
                  { val: "Low", label: "Risk", amber: true },
                ].map(({ val, label, amber }) => (
                  <div key={label} className="rounded-[10px] border border-white/90 bg-[rgba(255,252,248,0.82)] p-2.5 text-center">
                    <p className={`font-display text-[1.12rem] font-normal leading-none ${amber ? "text-amber-600" : "text-stone-800"}`}>{val}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.05em] text-stone-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* AI insight */}
              <div className="rounded-[14px] border border-[rgba(237,175,96,0.22)] p-3"
                style={{ background: "linear-gradient(135deg,rgba(237,175,96,0.09),rgba(137,184,204,0.07))" }}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-md"
                    style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}>
                    <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
                      <path d="M5 1.5L6.1 4H9L6.7 5.8L7.5 8.5L5 7L2.5 8.5L3.3 5.8L1 4H3.9L5 1.5Z" fill="white" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-amber-600">AI Insight</span>
                </div>
                <p className="text-[11px] font-light leading-relaxed text-stone-600">
                  Symptoms align with seasonal patterns. Consider increasing Vitamin D and prioritising consistent sleep.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Stats strip ── */}
        <motion.section
          initial={reducedMotion ? false : "hidden"}
          whileInView={reducedMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          custom={0}
          className="mt-8"
        >
          <div className="glass rounded-[28px] px-8 py-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { num: "98%", label: "Analysis accuracy" },
                { num: "2s", label: "Average response" },
                { num: "6", label: "Modules available" },
                { num: "PubMed", label: "Research-backed" },
              ].map(({ num, label }, i) => (
                <div key={label} className={`text-center ${i > 0 ? "border-l border-[rgba(20,16,8,0.07)] pl-4 sm:pl-0" : ""}`}>
                  <p className="font-display text-[1.8rem] font-normal leading-none text-stone-900"
                    style={num === "PubMed" ? { fontSize: "1.15rem", letterSpacing: "-0.01em" } : {}}>
                    {num}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Features grid ── */}
        <motion.section
          initial={reducedMotion ? false : "hidden"}
          whileInView={reducedMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerParent}
          className="mt-10" id="features"
        >
          <div className="mb-10 text-center">
            <span className="inline-flex items-center rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.09)] px-3 py-1 text-[0.74rem] font-medium uppercase tracking-[0.1em] text-amber-700">
              What Vital does
            </span>
            <h2 className="mt-4 font-display font-normal text-stone-900" style={{ fontSize: "clamp(1.9rem,3vw,2.75rem)", letterSpacing: "-0.022em" }}>
              Everything you need<br />to stay ahead of your health.
            </h2>
            <p className="mx-auto mt-3 max-w-[490px] text-base font-light leading-[1.72] text-stone-400">
              From symptom analysis to personalised diet plans — a complete picture of your wellbeing.
            </p>
          </div>
          <div className="grid gap-4 min-[600px]:grid-cols-2 min-[920px]:grid-cols-3">
            {featureCards.map((card) => (
              <motion.article key={card.title} variants={fadeUp}
                className="glass relative overflow-hidden rounded-[20px] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-glass-lg">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)" }} />
                <div className={`mb-4 inline-flex h-[46px] w-[46px] items-center justify-center rounded-[13px] ${icoStyles[card.color]}`}>
                  {card.icon}
                </div>
                <h3 className="font-display text-lg font-normal text-stone-800">{card.title}</h3>
                <p className="mt-2 text-sm font-light leading-[1.7] text-stone-400">{card.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[rgba(20,16,8,0.06)] pt-4">
                  {card.tags.map((tag) => (
                    <span key={tag} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tagStyles[card.color]}`}>{tag}</span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* ── How it works ── */}
        <section className="mt-10" id="how">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.09)] px-3 py-1 text-[0.74rem] font-medium uppercase tracking-[0.1em] text-amber-700">
              Simple process
            </span>
            <h2 className="mt-4 font-display font-normal text-stone-900" style={{ fontSize: "clamp(1.9rem,3vw,2.75rem)", letterSpacing: "-0.022em" }}>
              Three steps to clarity.
            </h2>
            <p className="mx-auto mt-3 max-w-[490px] text-base font-light leading-[1.72] text-stone-400">
              No forms, no appointments. Just describe how you feel and Vital does the rest.
            </p>
          </div>
          <div className="relative grid gap-4 sm:grid-cols-3">
            {/* Dashed connector line — desktop only */}
            <div className="pointer-events-none absolute left-0 right-0 top-[29px] z-0 hidden items-center sm:flex"
              aria-hidden="true">
              <div className="mx-auto w-[60%] border-t-2 border-dashed border-[rgba(201,112,34,0.22)]" />
            </div>
            {steps.map((step) => (
              <div key={step.num} className="glass relative z-10 rounded-[20px] p-6">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)" }} />
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,112,34,0.28)] bg-[rgba(255,252,248,0.85)] font-display text-base font-normal text-amber-600"
                  style={{ boxShadow: "0 2px 8px rgba(201,112,34,0.10)" }}>
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-normal text-stone-800">{step.title}</h3>
                <p className="mt-2 text-sm font-light leading-[1.65] text-stone-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mt-10">
          <div className="glass relative overflow-hidden rounded-[32px] px-8 py-16 text-center"
            style={{ boxShadow: "0 16px 48px rgba(20,16,8,0.10)" }}>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[480px] w-[480px] rounded-full blur-[80px]"
                style={{ background: "radial-gradient(circle,rgba(201,112,34,0.10),transparent 70%)" }} />
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.09)] px-3 py-1 text-[0.74rem] font-medium uppercase tracking-[0.1em] text-amber-700">
                Start today
              </span>
              <h2 className="mx-auto mt-4 max-w-[560px] font-display font-normal text-stone-900" style={{ fontSize: "clamp(2rem,3.8vw,3.1rem)", lineHeight: 1.14, letterSpacing: "-0.024em" }}>
                Your first 5 analyses<br />are completely free.
              </h2>
              <p className="mx-auto mt-4 max-w-[380px] text-base font-light leading-[1.72] text-stone-400">
                No credit card. No setup. Just sign in with Google and get instant access to all six modules.
              </p>
              <div className="mt-8 flex justify-center">
                <Link href="/login"
                  className="inline-flex items-center gap-2 rounded-[12px] px-7 py-3.5 text-sm font-medium text-stone-50 transition duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#c97022,#a85a14)", boxShadow: "0 4px 20px rgba(168,90,20,0.36)" }}>
                  Continue with Google
                  <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
                    <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <p className="mt-4 text-xs text-stone-400">By signing in you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="mt-10" id="about">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.09)] px-3 py-1 text-[0.74rem] font-medium uppercase tracking-[0.1em] text-amber-700">
              About Vital
            </span>
            <h2 className="mt-4 font-display font-normal text-stone-900" style={{ fontSize: "clamp(1.9rem,3vw,2.75rem)", letterSpacing: "-0.022em" }}>
              Health guidance you can trust.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-base font-light leading-[1.72] text-stone-400">
              Vital is an AI-powered educational health workspace built to help you understand your symptoms, track trends, and make informed decisions — not replace your doctor.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Our Mission",
                body: "We believe everyone deserves access to clear, structured health information. Vital bridges the gap between vague symptoms and actionable clarity by combining AI analysis with the latest medical research.",
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M10 2v16M2 10h16" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="10" cy="10" r="7.5" stroke="#c97022" strokeWidth="1.3" />
                  </svg>
                ),
              },
              {
                title: "How It Works",
                body: "Describe your symptoms in plain language. Vital analyses your input against medical literature from PubMed, surfaces evidence-based insights, and gives you a personalised diet and lifestyle action plan — all in seconds.",
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="#c97022" strokeWidth="1.3" />
                    <path d="M6 10l3 3 5-5" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Built on Trust",
                body: "Your data stays private. We don't sell your information, and every insight is grounded in peer-reviewed research. Vital is an educational tool — always consult a healthcare professional for medical decisions.",
                icon: (
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M10 2L3 6v5c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-4z" stroke="#c97022" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M7.5 10l2 2 3.5-3.5" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="glass relative rounded-[20px] p-6">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)" }} />
                <div className="mb-4 inline-flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-[linear-gradient(135deg,rgba(237,175,96,0.18),rgba(201,112,34,0.10))]">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-normal text-stone-800">{item.title}</h3>
                <p className="mt-2 text-sm font-light leading-[1.7] text-stone-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(20,16,8,0.07)] pt-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[7px] font-display text-xs text-stone-50"
              style={{ background: "linear-gradient(135deg,#c97022,#edaf60)" }}>V</span>
            <span className="font-display text-base font-normal text-stone-500">Vital</span>
          </Link>
          <div className="flex gap-5">
            {["Terms", "Disclaimer", "Contact"].map((item) => (
              <a key={item} href="#" className="text-xs text-stone-400 transition hover:text-stone-700">{item}</a>
            ))}
          </div>
          <p className="text-xs text-stone-400">© 2026 Vital. Not a substitute for professional medical advice.</p>
        </footer>
      </main>
    </>
  );
}