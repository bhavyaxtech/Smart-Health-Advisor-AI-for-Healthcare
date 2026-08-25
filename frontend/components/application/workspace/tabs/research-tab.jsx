"use client";

import { Panel, inputCls, btnPrimary, btnGhost } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

export default function ResearchTab({
  researchQuery,
  onResearchQueryChange,
  researchBusy,
  degraded,
  onSubmitResearch,
  researchResponse,
}) {
  return (
    <Panel title="Research" subtitle="Search and read educational literature summaries.">
      <form onSubmit={onSubmitResearch} className="flex flex-col gap-2 sm:flex-row">
        <input value={researchQuery} onChange={(e) => onResearchQueryChange(e.target.value)} className={`${inputCls} flex-1`} placeholder="e.g. migraine triggers and nutrition" />
        <button type="submit" disabled={researchBusy || degraded} className={`${btnPrimary} sm:flex-shrink-0`}
          style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
          {researchBusy ? "Searching..." : "Search"}
        </button>
      </form>
      {researchResponse !== null ? (
        <div className="glass mt-4 rounded-[24px] p-5">
          <h3 className="font-display text-2xl font-normal text-stone-900">{researchResponse.query || "Search result"}</h3>
          <div className="mt-3 space-y-3">
            {String(researchResponse.results || "").split(/\n{2,}/).filter(Boolean).map((para, index) => (
              <p key={`${index}-${para.slice(0, 24)}`} className="text-sm font-light leading-[1.72] text-stone-500">{para}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-stone-400">
            <span>Sources {researchResponse.source_count ?? "N/A"}</span>
            {researchResponse.pubmed_url ? (
              <a href={researchResponse.pubmed_url} target="_blank" rel="noreferrer"
                className={`${btnGhost} text-xs`}>Open source link</a>
            ) : null}
          </div>
          <p className="mt-3 text-sm italic text-stone-400">{formatDate(researchResponse.timestamp)}</p>
        </div>
      ) : null}
    </Panel>
  );
}
