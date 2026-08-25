"use client";

import { Panel, EmptyState, btnPrimary } from "@/components/ui/primitives";
import { formatDate, labelize } from "@/lib/format";

const PATTERN_TIMEFRAMES = ["week", "month", "quarter"];

export default function DashboardTab({
  dashboard,
  scoreTone,
  patternAnalysis,
  patternTimeframe,
  onPatternTimeframeChange,
  onRunPattern,
  patternBusy,
  degraded,
}) {
  return (
    <Panel title="Health dashboard" subtitle="Review trends and run pattern analysis by timeframe."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
            {PATTERN_TIMEFRAMES.map((opt) => (
              <button key={opt} type="button" onClick={() => onPatternTimeframeChange(opt)}
                className={`rounded-[8px] px-3 py-1 text-xs uppercase tracking-[0.14em] transition duration-200 ${patternTimeframe === opt
                    ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                    : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)]"
                  }`}>
                {labelize(opt)}
              </button>
            ))}
          </div>
          <button type="button" disabled={patternBusy || degraded} onClick={onRunPattern}
            className={btnPrimary} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
            {patternBusy ? "Running..." : "Run Pattern Analysis"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Health score</p>
              <p className={`mt-1.5 font-display text-4xl ${scoreTone}`}>{dashboard?.health_score ?? "—"}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Latest symptom</p>
              <p className="mt-1.5 text-lg text-stone-700">{dashboard?.latest_symptom || "No data"}</p>
            </div>
          </div>
          {dashboard?.symptom_trends?.length ? (
            dashboard.symptom_trends.map((item, index) => (
              <article key={`${item.date}-${item.symptom}-${index}`} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-normal text-stone-900">{item.symptom || "Unknown symptom"}</h3>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-700">{labelize(item.severity_label || item.severity || "low")}</span>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-stone-400">{formatDate(item.date)}</p>
                <p className="mt-2 text-sm font-light leading-[1.72] text-stone-500">{item.summary || "No summary available."}</p>
              </article>
            ))
          ) : (
            <EmptyState title="No trend data" body="Run an analysis to generate dashboard trends." />
          )}
        </div>
        <div className="space-y-3">
          {[["Risk factors", dashboard?.risk_factors], ["Improvement areas", dashboard?.improvement_areas], ["Recommendations", dashboard?.ai_recommendations]].map(([title, items]) => (
            <div key={title} className="glass rounded-2xl p-4">
              <h3 className="font-display text-xl font-normal text-stone-900">{title}</h3>
              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                {(items || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
              </ul>
            </div>
          ))}
          {patternAnalysis ? (
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-normal text-stone-900">{patternAnalysis.analysis_type || "Pattern analysis"}</h3>
                <span className="rounded-full bg-sky-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-700">Confidence {patternAnalysis.confidence ?? "N/A"}</span>
              </div>
              <p className="mt-2 text-sm font-light text-stone-500">Timeframe: {labelize(patternAnalysis.timeframe || patternTimeframe)}</p>
              <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                {Object.values(patternAnalysis.patterns || {}).flat().map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
              </ul>
              <h4 className="mt-3 font-display text-lg font-normal text-stone-900">Recommendations</h4>
              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                {(patternAnalysis.recommendations || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
