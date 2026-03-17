"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const featureCards = [
  {
    title: "Guided Symptom Analysis",
    body: "Capture context in one clear flow and receive educational insight with practical next-step guidance.",
  },
  {
    title: "Account-Linked Health Timeline",
    body: "Keep your analyses together in one place so patterns become easier to understand over time.",
  },
  {
    title: "Assistant, Voice, and Research",
    body: "Move from quick questions to deeper exploration without leaving your workspace.",
  },
];

const steps = [
  { title: "Describe your symptom", body: "Add severity, duration, and relevant background." },
  { title: "Review structured insight", body: "See possible causes, red flags, and care-focused suggestions." },
  { title: "Track and follow up", body: "Use history, dashboard trends, and assistant prompts to stay informed." },
];

const faq = [
  {
    q: "Is Vital a diagnostic tool?",
    a: "No. Vital is for educational guidance and should not replace licensed medical care.",
  },
  {
    q: "Do I need an account?",
    a: "Yes. Sign-in keeps your workspace, history, and usage tied to your profile.",
  },
  {
    q: "Can I ask follow-up questions?",
    a: "Yes. The assistant, voice input, and research module support follow-up exploration.",
  },
];

export default function LandingPage() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 pb-20 pt-24 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-44 h-[700px] w-[700px] animate-[floatOrb_22s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(201,112,34,0.14)_0%,transparent_70%)] blur-[88px]" />
        <div className="absolute -right-20 top-16 h-[600px] w-[600px] animate-[floatOrb_22s_ease-in-out_infinite_-8s] rounded-full bg-[radial-gradient(circle,rgba(237,175,96,0.10)_0%,transparent_70%)] blur-[88px]" />
        <div className="absolute bottom-56 left-[18%] h-[500px] w-[500px] animate-[floatOrb_22s_ease-in-out_infinite_-15s] rounded-full bg-[radial-gradient(circle,rgba(137,184,204,0.09)_0%,transparent_70%)] blur-[88px]" />
        <div className="absolute -bottom-20 right-[22%] h-[380px] w-[380px] animate-[floatOrb_22s_ease-in-out_infinite_-5s] rounded-full bg-[radial-gradient(circle,rgba(168,90,20,0.08)_0%,transparent_70%)] blur-[88px]" />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-6">
        <header
          className={`pointer-events-auto flex w-full max-w-[1060px] items-center justify-between rounded-[18px] px-5 py-0 transition-all duration-[350ms] ease-out ${
            scrolled
              ? "border border-white/90 bg-[rgba(255,252,248,0.86)] shadow-[0_8px_40px_rgba(20,16,8,0.13)] [backdrop-filter:blur(36px)_saturate(220%)]"
              : "border border-white/62 bg-[rgba(255,252,248,0.52)] shadow-[0_4px_24px_rgba(20,16,8,0.08)] [backdrop-filter:blur(12px)_saturate(150%)]"
          }`}
          style={{ height: 56 }}
        >
          <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-amber-500 to-amber-300 font-display text-sm text-stone-50 shadow-[0_2px_10px_rgba(201,112,34,0.36)]">
              V
            </span>
            <span className="font-display text-xl font-normal text-stone-900">Vital</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {["Features", "How it works", "Privacy", "About"].map((item) => (
              <a
                key={item}
                href="#"
                className="rounded-lg px-3 py-1.5 text-sm text-stone-500 transition duration-200 hover:bg-white/55 hover:text-stone-800"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-[10px] border border-[rgba(20,16,8,0.13)] px-4 py-1.5 text-sm font-normal text-stone-700 transition duration-200 hover:border-[rgba(20,16,8,0.22)] hover:bg-white/75"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-1.5 text-sm font-medium text-stone-50 shadow-[0_2px_12px_rgba(168,90,20,0.32)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(168,90,20,0.42)]"
            >
              Get started
            </Link>
          </div>
        </header>
      </div>

      <section className="mt-6 grid gap-8 min-[920px]:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={staggerParent}
          className="glass-strong grain-overlay gradient-ring relative overflow-hidden rounded-[40px] px-6 py-8 sm:px-10 sm:py-10"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/88 bg-[rgba(255,252,248,0.72)] px-3 py-1.5 text-xs font-medium text-stone-500 shadow-[0_2px_12px_rgba(20,16,8,0.06)] backdrop-blur-sm">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-300">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            AI-powered health intelligence
          </motion.div>
          <motion.h1
            custom={0.08}
            variants={fadeUp}
            className="max-w-2xl font-display text-[clamp(2.8rem,5vw,4.3rem)] font-normal leading-[1.08] tracking-[-0.026em] text-stone-900"
          >
            Understand your symptoms with{" "}
            <span className="hero-italic-accent">clarity</span> and confidence.
          </motion.h1>
          <motion.p
            custom={0.16}
            variants={fadeUp}
            className="mt-6 max-w-xl text-base font-light leading-[1.72] text-stone-400"
          >
            Vital brings symptom analysis, assistant follow-up, voice support, and
            research into one elegant workspace designed for thoughtful health
            tracking.
          </motion.p>
          <motion.div custom={0.24} variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-[12px] bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-3 text-sm font-medium text-stone-50 shadow-[0_4px_20px_rgba(168,90,20,0.36)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(168,90,20,0.46)]">
              Start with Google
            </Link>
            <Link href="#" className="rounded-[12px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-6 py-3 text-sm font-medium text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:-translate-y-px">
              How it works
            </Link>
          </motion.div>

          <motion.div custom={0.32} variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-4">
            {["No credit card required", "5 free analyses", "Private by default"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-stone-400">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(201,112,34,0.11)]">
                  <svg viewBox="0 0 9 9" fill="none" width="8" height="8">
                    <path d="M1.8 4.5l2 2 3.4-3.4" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.aside
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={fadeUp}
          custom={0.16}
          className="relative"
        >
          <div className="glass absolute -left-7 top-14 z-10 hidden animate-[floatCard_8s_ease-in-out_infinite] rounded-[14px] px-4 py-3 min-[920px]:block">
            <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Sleep Quality</p>
            <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">87<span className="text-sm text-stone-400">/100</span></p>
            <p className="mt-1 text-[11px] font-medium text-amber-600">↑ 12% this week</p>
          </div>
          <div className="glass absolute -right-4 top-4 z-10 hidden animate-[floatCard_7s_ease-in-out_infinite_-5s] rounded-[14px] px-4 py-3 min-[920px]:block">
            <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Analyses done</p>
            <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">4</p>
            <p className="mt-1 text-[11px] font-medium text-amber-600">1 credit left</p>
          </div>
          <div className="glass absolute -left-4 bottom-20 z-10 hidden animate-[floatCard_10s_ease-in-out_infinite_-3s] rounded-[14px] px-4 py-3 min-[920px]:block">
            <p className="text-[11px] uppercase tracking-[0.07em] text-stone-400">Stress Index</p>
            <p className="font-display text-[1.35rem] font-normal leading-none text-stone-900">Low</p>
            <div className="mt-1.5 flex h-6 items-end gap-0.5">
              {[42, 66, 52, 80, 44, 62].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-amber-300" style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.55 }} />
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-[28px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-300 text-xs font-semibold text-white">
                  AR
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">Health Dashboard</p>
                  <p className="text-xs text-stone-400">Updated just now</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(201,112,34,0.2)] bg-[rgba(201,112,34,0.08)] px-2.5 py-1 text-[11px] font-medium text-amber-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Live
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3.5 rounded-[14px] border border-[rgba(201,112,34,0.12)] bg-[rgba(201,112,34,0.05)] p-3.5">
              <svg viewBox="0 0 62 62" fill="none" width="62" height="62" className="flex-shrink-0">
                <circle cx="31" cy="31" r="25" stroke="rgba(201,112,34,0.12)" strokeWidth="7" fill="none" />
                <circle cx="31" cy="31" r="25" stroke="url(#ag)" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="157" strokeDashoffset="39" transform="rotate(-90 31 31)" />
                <defs>
                  <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#edaf60" />
                    <stop offset="100%" stopColor="#c97022" />
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

            <div className="rounded-[14px] border border-[rgba(237,175,96,0.22)] bg-gradient-to-br from-[rgba(237,175,96,0.09)] to-[rgba(137,184,204,0.07)] p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-300 text-white">
                  <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
                    <path d="M5 1.5L6.1 4H9L6.7 5.8L7.5 8.5L5 7L2.5 8.5L3.3 5.8L1 4H3.9L5 1.5Z" fill="white" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-amber-600">AI Insight</span>
              </div>
              <p className="text-[11px] font-light leading-relaxed text-stone-600">
                Symptoms align with seasonal patterns. Consider increasing Vitamin D and prioritizing consistent sleep.
              </p>
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="mt-6">
        <div className="glass rounded-[28px] px-8 py-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { num: "98%", label: "Analysis accuracy" },
              { num: "2s", label: "Average response" },
              { num: "6", label: "Modules available" },
              { num: "PubMed", label: "Research-backed" },
            ].map(({ num, label }, i) => (
              <div key={label} className={`text-center ${i > 0 ? "border-l border-[rgba(20,16,8,0.07)]" : ""}`}>
                <p className="font-display text-[1.8rem] font-normal leading-none text-stone-900">
                  {num}
                </p>
                <p className="mt-1.5 text-xs text-stone-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <motion.section
        initial={reducedMotion ? false : "hidden"}
        whileInView={reducedMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerParent}
        className="mt-8 grid gap-4 min-[600px]:grid-cols-2 min-[920px]:grid-cols-3"
      >
        {featureCards.map((item) => (
          <motion.article key={item.title} variants={fadeUp} className="glass-strong rounded-[28px] p-6">
            <h2 className="text-[clamp(1.9rem,3vw,2.75rem)] font-normal leading-[1.2] text-stone-900">
              {item.title}
            </h2>
            <p className="mt-3 text-base font-light leading-[1.72] text-stone-400">{item.body}</p>
          </motion.article>
        ))}
      </motion.section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView={reducedMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerParent}
          className="glass-strong rounded-[32px] p-6"
        >
          <h3 className="text-[clamp(1.9rem,3vw,2.75rem)] font-normal text-stone-900">How Vital works</h3>
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <motion.div key={step.title} variants={fadeUp} className="glass rounded-2xl px-4 py-4">
                <div className="font-display text-2xl text-amber-600">{index + 1}</div>
                <h4 className="mt-1 text-xl font-normal text-stone-900">{step.title}</h4>
                <p className="mt-2 text-base font-light leading-[1.72] text-stone-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView={reducedMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerParent}
          className="glass-strong rounded-[32px] p-6"
        >
          <h3 className="text-[clamp(1.9rem,3vw,2.75rem)] font-normal text-stone-900">Frequently asked questions</h3>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <motion.details key={item.q} variants={fadeUp} className="glass rounded-2xl px-4 py-3">
                <summary className="cursor-pointer list-none font-display text-xl font-normal text-stone-900">
                  {item.q}
                </summary>
                <p className="mt-2 text-base font-light leading-[1.72] text-stone-400">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </motion.div>
      </section>

      <style jsx global>{`
        @keyframes floatOrb {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(28px, -38px) scale(1.04);
          }
          66% {
            transform: translate(-18px, 22px) scale(0.97);
          }
        }
        @keyframes floatCard {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }
      `}</style>
    </main>
  );
}
