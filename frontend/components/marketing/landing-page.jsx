"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    title: "Structured symptom analysis",
    copy:
      "A guided input flow that produces clearer educational output than a generic chatbot answer.",
  },
  {
    title: "Longitudinal account context",
    copy:
      "History, credits, and dashboard summaries turn one-off checks into a more believable product workflow.",
  },
  {
    title: "Research-aware follow-up",
    copy:
      "PubMed-backed search and assistant tools make the experience feel grounded, not decorative.",
  },
];

const stats = [
  { label: "Core surfaces", value: "3", meta: "Landing, login, workspace" },
  { label: "Product modules", value: "6", meta: "Analysis through research" },
  { label: "Auth model", value: "GIS", meta: "Google ID token flow" },
];

export default function LandingPage() {
  const reducedMotion = useReducedMotion();

  return (
    <main className="pb-20">
      <section className="section-shell pt-5 sm:pt-6">
        <div className="surface-card subtle-grid relative overflow-hidden rounded-[36px] px-6 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_26%),radial-gradient(circle_at_78%_14%,rgba(251,191,36,0.16),transparent_18%)]" />

          <div className="relative">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
                  SH
                </span>
                Smart Health Advisor AI
              </Link>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/app"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Open workspace
                </Link>
              </div>
            </header>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="max-w-2xl">
                <motion.div
                  custom={0}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="eyebrow"
                >
                  SaaS-style product presentation
                </motion.div>

                <motion.h1
                  custom={0.06}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-5 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-0.05em] text-slate-950 sm:text-5xl"
                >
                  A sharper health workflow with clearer hierarchy, calmer motion,
                  and a more credible product feel.
                </motion.h1>

                <motion.p
                  custom={0.12}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-5 max-w-2xl text-base leading-8 text-slate-600"
                >
                  Smart Health Advisor AI combines Google-authenticated access,
                  structured symptom analysis, history, dashboard summaries, and
                  research-aware guidance into a cleaner end-to-end experience.
                </motion.p>

                <motion.div
                  custom={0.18}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-7 flex flex-wrap gap-3"
                >
                  {["Tighter type scale", "Better card hierarchy", "Clearer motion system"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
                      >
                        {item}
                      </span>
                    )
                  )}
                </motion.div>

                <motion.div
                  custom={0.24}
                  initial={reducedMotion ? false : "hidden"}
                  animate={reducedMotion ? undefined : "visible"}
                  variants={reveal}
                  className="mt-8 grid gap-4 sm:grid-cols-3"
                >
                  {stats.map((item) => (
                    <div key={item.label} className="surface-muted p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
                        {item.value}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.meta}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                custom={0.2}
                initial={reducedMotion ? false : "hidden"}
                animate={reducedMotion ? undefined : "visible"}
                variants={reveal}
                className="surface-card rounded-[32px] border border-slate-200/80 bg-slate-950 p-5 text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-100">
                    Product preview
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Recruiter-ready
                  </span>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="grid gap-4 sm:grid-cols-[0.34fr_0.66fr]">
                    <div className="space-y-3">
                      {["Analysis", "Dashboard", "History", "Research"].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-[16px] px-4 py-3 text-sm ${
                            index === 0
                              ? "bg-white text-slate-950"
                              : "border border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-slate-900/70 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {["Ready", "3 credits", "History on"].map((item) => (
                          <div
                            key={item}
                            className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-[18px] border border-sky-400/20 bg-sky-400/10 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
                          Active analysis
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-200">
                          Headache with nausea, moderate severity, duration 2 days,
                          with dashboard and history updates after submit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-8 grid gap-5 lg:grid-cols-3">
        {features.map((item, index) => (
          <motion.article
            key={item.title}
            custom={0.08 * (index + 1)}
            initial={reducedMotion ? false : "hidden"}
            whileInView={reducedMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            className="surface-card p-6"
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700">
              0{index + 1}
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
