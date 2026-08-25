"use client";

import { Panel, EmptyState } from "@/components/ui/primitives";
import { formatDate, labelize } from "@/lib/format";

export default function HistoryTab({ history }) {
  return (
    <Panel title="History" subtitle="Your saved analyses over time.">
      {history?.length ? (
        <div className="space-y-3">
          {history.map((item) => (
            <article key={item.id} className="glass grid gap-2 rounded-2xl p-4 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]">
              <p className="font-display text-lg text-stone-900">{formatDate(item.created_at)}</p>
              <p className="text-sm text-stone-600">{labelize(item.symptom || "unknown")}</p>
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-700">{labelize(item.severity || "low")}</span>
              <p className="text-sm text-stone-500">{item.duration || "—"}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No history yet" body="Complete your first analysis to start tracking progress." />
      )}
    </Panel>
  );
}
