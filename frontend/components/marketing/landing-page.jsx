"use client";

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

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 pb-20 pt-6 sm:px-8">
      <header className="glass-strong gradient-ring mx-auto flex w-full items-center justify-between rounded-[40px] px-5 py-4 sm:px-7">
        <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 font-display text-lg text-stone-50">
            V
          </span>
          <span className="font-display text-2xl font-normal text-stone-900">Vital</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition duration-300 hover:border-amber-200 hover:text-amber-700"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-stone-50 transition duration-300 hover:bg-amber-600"
          >
            Open app
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-8 min-[920px]:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={staggerParent}
          className="glass-strong grain-overlay gradient-ring relative overflow-hidden rounded-[40px] px-6 py-8 sm:px-10 sm:py-10"
        >
          <motion.span
            custom={0}
            variants={fadeUp}
            className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-700"
          >
            Calm, clear health guidance
          </motion.span>
          <motion.h1
            custom={0.08}
            variants={fadeUp}
            className="mt-6 max-w-2xl font-display text-[clamp(2.8rem,5vw,4.3rem)] font-normal leading-[1.08] tracking-[-0.026em] text-stone-900"
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
            <Link
              href="/login"
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-stone-50 transition duration-300 hover:bg-amber-600"
            >
              Start with Google
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-stone-200 bg-stone-50 px-6 py-3 text-sm font-medium text-stone-700 transition duration-300 hover:border-amber-200 hover:text-amber-700"
            >
              Explore workspace
            </Link>
          </motion.div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Analysis", "Dashboard", "Research"].map((item) => (
              <div key={item} className="glass rounded-2xl px-4 py-3 text-sm text-stone-600">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.aside
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={fadeUp}
          custom={0.16}
          className="glass-strong gradient-ring relative rounded-[40px] px-6 py-8 sm:px-8"
        >
          <div className="rounded-[30px] bg-stone-900 p-5 text-stone-50 shadow-glass-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Live preview</p>
            <div className="mt-4 grid gap-3">
              <div className="glass rounded-2xl px-4 py-3 text-sm text-stone-700">
                Health score trend and risk overview
              </div>
              <div className="glass rounded-2xl px-4 py-3 text-sm text-stone-700">
                Assistant follow-up with suggested next questions
              </div>
              <div className="glass rounded-2xl px-4 py-3 text-sm text-stone-700">
                Search medical literature in a focused panel
              </div>
            </div>
          </div>

          <div className="hidden min-[920px]:block">
            <div className="glass absolute -left-8 top-20 animate-float rounded-2xl px-4 py-3 text-sm text-stone-700">
              5 analyses included
            </div>
            <div className="glass absolute -right-6 bottom-16 rounded-2xl px-4 py-3 text-sm text-stone-700 [animation:float_5.2s_ease-in-out_infinite_0.4s]">
              Human-centered interface
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="mt-6">
        <div className="glass mx-auto rounded-[28px] px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-stone-600">
            <span className="font-display text-xl text-stone-900">Trusted product flow</span>
            <span>Google sign-in</span>
            <span>Protected account data</span>
            <span>Structured symptom history</span>
            <span>Educational guidance</span>
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
    </main>
  );
}
