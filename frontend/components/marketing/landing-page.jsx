"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const featureCards = [
  {
    title: "Private symptom intelligence",
    body: "Structured symptom input, educational analysis, risk signaling, and persistent health history behind Google-authenticated access.",
  },
  {
    title: "Longitudinal product thinking",
    body: "History, health dashboard, and pattern analysis turn one-off symptom checks into a more thoughtful wellness workflow.",
  },
  {
    title: "Research-aware guidance",
    body: "PubMed search is woven into the experience so the interface feels grounded, not just chatbot-shaped.",
  },
];

const journeyCards = [
  "Recruiter lands on a polished, product-story-driven front page.",
  "Login page turns trust, security, and value props into a clear next step.",
  "Application workspace opens into analysis, history, dashboard, assistant, voice, and research tools.",
];

export default function LandingPage() {
  const reducedMotion = useReducedMotion();

  return (
    <main className="pb-24">
      <section className="section-shell pt-6 sm:pt-8">
        <div className="glass-panel relative overflow-hidden rounded-[40px] border border-white/80 bg-white/78 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              aria-hidden="true"
              className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-sky-300/35 blur-3xl"
              animate={
                reducedMotion
                  ? undefined
                  : { x: [0, 24, 0], y: [0, 20, 0], scale: [1, 1.04, 1] }
              }
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute right-0 top-10 h-56 w-56 rounded-full bg-amber-200/60 blur-3xl"
              animate={
                reducedMotion
                  ? undefined
                  : { x: [0, -32, 0], y: [0, -18, 0], scale: [1, 0.96, 1] }
              }
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative flex flex-col gap-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  SH
                </span>
                Smart Health Advisor AI
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/app"
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5"
                >
                  Explore the workspace
                </Link>
              </div>
            </header>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.88fr] lg:items-start">
              <div>
                <motion.div
                  custom={0}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-sky-700"
                >
                  Recruiter-facing product narrative
                </motion.div>

                <motion.h1
                  custom={0.08}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-6 max-w-4xl font-display text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-6xl xl:text-7xl"
                >
                  A clear, modern health interface that feels more like a real
                  product than a demo wrapper.
                </motion.h1>

                <motion.p
                  custom={0.16}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-6 max-w-2xl text-lg leading-8 text-slate-600"
                >
                  Smart Health Advisor AI blends Google-authenticated access,
                  structured symptom analysis, longitudinal history, dashboard
                  intelligence, and PubMed-backed research into one polished
                  user experience.
                </motion.p>

                <motion.div
                  custom={0.24}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  {[
                    "Light-first visual system",
                    "Motion-led storytelling",
                    "Research-backed health UX",
                    "Login -> workspace flow",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </motion.div>
              </div>

              <motion.div
                custom={0.3}
                initial={reducedMotion ? false : "hidden"}
                animate={reducedMotion ? undefined : "visible"}
                variants={reveal}
                className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
                    Product snapshot
                  </span>
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-300">
                    UI/UX revamp
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-sky-200/80">
                      What recruiters notice
                    </div>
                    <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                      Product logic, not just screen paint
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      This interface shows onboarding, trust, structured
                      analysis, stateful history, and guided follow-up in one
                      coherent product story.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Surfaces
                      </div>
                      <div className="mt-2 text-3xl font-black tracking-[-0.05em]">
                        3
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Landing page, login experience, and full application
                        workspace.
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Product depth
                      </div>
                      <div className="mt-2 text-3xl font-black tracking-[-0.05em]">
                        6 modules
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Analysis, dashboard, history, assistant, voice, and
                        research.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <motion.article
              key={card.title}
              custom={0.08 * (index + 1)}
              initial={reducedMotion ? false : "hidden"}
              whileInView={reducedMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.2 }}
              variants={reveal}
              className="glass-panel rounded-[28px] p-6"
            >
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">
                0{index + 1}
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                {card.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {card.body}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={reducedMotion ? false : "hidden"}
          whileInView={reducedMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
          variants={reveal}
          className="glass-panel rounded-[32px] p-7"
        >
          <div className="text-xs font-bold uppercase tracking-[0.28em] text-amber-600">
            Frontend ideas worth keeping
          </div>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.05em] text-slate-950">
            Better UX starts with a better story arc.
          </h2>
          <div className="mt-6 space-y-4">
            {journeyCards.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4"
              >
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
