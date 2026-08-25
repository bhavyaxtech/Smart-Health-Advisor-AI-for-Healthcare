"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Panel, EmptyState, inputCls, btnPrimary, btnGhost } from "@/components/ui/primitives";
import { EMPTY_FORM, labelize, probabilityToScore } from "@/lib/format";

function OverviewView({ analysis }) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-[22px] p-5">
        <h3 className="font-display text-xl font-normal text-stone-900">Summary</h3>
        <p className="mt-3 whitespace-pre-line text-sm font-light leading-[1.72] text-stone-500">{analysis?.symptom_analysis || "No summary available yet."}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-display text-xl font-normal text-stone-900">Possible causes</h3>
          <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.possible_causes || []).slice(0, 3).map((item) => (
              <li key={`${item.condition}-${item.probability}`} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                {item.condition}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-display text-xl font-normal text-stone-900">Red flags</h3>
          <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.red_flags || []).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CausesView({ analysis }) {
  return (
    <div className="space-y-3">
      {(analysis?.possible_causes || []).map((cause) => {
        const score = probabilityToScore(cause.probability);
        return (
          <div key={`${cause.condition}-${cause.probability}`} className="glass rounded-[22px] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xl font-normal text-stone-900">{cause.condition}</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">{cause.probability}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, background: "linear-gradient(90deg,#edaf60,#c97022)" }} />
            </div>
            <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500">{cause.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function CareView({ analysis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-[22px] p-5">
        <h3 className="font-display text-xl font-normal text-stone-900">Diet plan</h3>
        <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Consume:</strong> {(analysis?.diet_plan?.foods_to_consume || []).join(", ") || "—"}</p>
        <p className="text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Avoid:</strong> {(analysis?.diet_plan?.foods_to_avoid || []).join(", ") || "—"}</p>
        <p className="text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Focus:</strong> {(analysis?.diet_plan?.nutritional_focus || []).join(", ") || "—"}</p>
      </div>
      <div className="glass rounded-[22px] p-5">
        <h3 className="font-display text-xl font-normal text-stone-900">Lifestyle suggestions</h3>
        <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
          {(analysis?.lifestyle_suggestions || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
        </ul>
        <h4 className="mt-4 font-display text-lg font-normal text-stone-900">Personalized tips</h4>
        <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
          {(analysis?.personalized_tips || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function InsightsView({ analysis }) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-[22px] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-normal text-stone-900">Emergency level</h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">{analysis?.risk_assessment?.emergency_level || "Low"}</span>
          <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-700">Confidence {analysis?.confidence || "N/A"}</span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(analysis?.risk_assessment || {}).map(([key, value]) => (
          <div key={key} className="glass rounded-[22px] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-stone-400">{labelize(key)}</div>
            <p className="mt-2 text-sm font-light leading-[1.72] text-stone-600">{String(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const ANALYSIS_VIEWS = {
  overview: OverviewView,
  causes: CausesView,
  care: CareView,
  insights: InsightsView,
};

const ANALYSIS_SUBTABS = ["overview", "causes", "care", "insights"];

export default function AnalysisTab({
  form,
  setForm,
  onSubmit,
  busy,
  degraded,
  analysis,
  analysisTab,
  onAnalysisTabChange,
}) {
  const ActiveView = ANALYSIS_VIEWS[analysisTab] || OverviewView;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel title="Symptom analysis" subtitle="Provide context and receive educational guidance."
        action={
          <button type="button" onClick={() => setForm({ ...EMPTY_FORM })} className={btnGhost}>
            Reset form
          </button>
        }
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Symptom</label>
            <input value={form.symptom} onChange={(e) => setForm((c) => ({ ...c, symptom: e.target.value }))} className={inputCls} placeholder="e.g. headache with nausea" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Duration</label>
            <input value={form.duration} onChange={(e) => setForm((c) => ({ ...c, duration: e.target.value }))} className={inputCls} placeholder="e.g. 2 days" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Severity</label>
            <select value={form.severity} onChange={(e) => setForm((c) => ({ ...c, severity: e.target.value }))} className={inputCls}>
              <option value="">Select</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Age</label>
            <input value={form.age} onChange={(e) => setForm((c) => ({ ...c, age: e.target.value }))} className={inputCls} placeholder="e.g. 34" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Gender</label>
            <input value={form.gender} onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))} className={inputCls} placeholder="Optional" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Medical history</label>
            <textarea rows={3} value={form.medicalHistory} onChange={(e) => setForm((c) => ({ ...c, medicalHistory: e.target.value }))} className={inputCls} placeholder="Optional background information" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Additional details</label>
            <textarea rows={4} value={form.additionalInfo} onChange={(e) => setForm((c) => ({ ...c, additionalInfo: e.target.value }))} className={inputCls} placeholder="Any extra context" />
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button type="submit" disabled={busy || degraded} className={btnPrimary}
              style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
              {busy ? (
                <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Analyzing...</>
              ) : "Analyse symptom"}
            </button>
            <span className="text-[11px] uppercase tracking-[0.16em] text-stone-400">5 analyses included</span>
          </div>
        </form>
      </Panel>

      <Panel title="Analysis details" subtitle="Switch tabs to review each part of the result.">
        {!analysis ? (
          <EmptyState title="No analysis yet" body="Submit the form to see your result." />
        ) : (
          <div className="space-y-4">
            <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
              {ANALYSIS_SUBTABS.map((tab) => (
                <button key={tab} type="button" onClick={() => onAnalysisTabChange(tab)}
                  className={`rounded-[8px] px-3 py-1.5 text-sm transition duration-200 ${analysisTab === tab
                      ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                      : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)] hover:text-stone-700"
                    }`}>
                  {labelize(tab)}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={analysisTab}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}>
                <ActiveView analysis={analysis} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </Panel>
    </div>
  );
}
