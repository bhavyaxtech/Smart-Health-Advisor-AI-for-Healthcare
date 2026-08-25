"use client";

import { Panel, inputCls, btnPrimary } from "@/components/ui/primitives";

export default function VoiceTab({
  voiceText,
  onVoiceTextChange,
  voiceConfidence,
  onVoiceConfidenceChange,
  voiceBusy,
  degraded,
  onSubmitVoice,
  voiceResponse,
  onUseDetectedSymptom,
}) {
  return (
    <Panel title="Voice" subtitle="Paste transcript text and review detected symptoms.">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex justify-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(201,112,34,0.10)]">
            <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
              <rect x="11" y="3" width="10" height="16" rx="5" stroke="#c97022" strokeWidth="1.5" />
              <path d="M6 16a10 10 0 0020 0" stroke="#c97022" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="26" x2="16" y2="29" stroke="#c97022" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <form onSubmit={onSubmitVoice} className="space-y-3">
          <textarea rows={5} value={voiceText} onChange={(e) => onVoiceTextChange(e.target.value)} className={inputCls} placeholder="Paste voice transcript..." />
          <input value={voiceConfidence} onChange={(e) => onVoiceConfidenceChange(e.target.value)} className={inputCls} placeholder="Confidence (e.g. 0.90)" />
          <button type="submit" disabled={voiceBusy || degraded} className={btnPrimary}
            style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
            {voiceBusy ? "Processing..." : "Analyse Voice Input"}
          </button>
        </form>
        {voiceResponse ? (
          <div className="space-y-3">
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-normal text-stone-900">Response</h3>
                <span className="rounded-full bg-sky-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-700">Confidence {voiceResponse.confidence ?? voiceConfidence}</span>
              </div>
              <p className="mt-2 text-sm font-light leading-[1.72] text-stone-500">{voiceResponse.response}</p>
            </div>
            {(voiceResponse.detected_symptoms || []).length ? (
              <div className="glass rounded-2xl p-4">
                <h4 className="font-display text-lg font-normal text-stone-900">Detected symptoms</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {voiceResponse.detected_symptoms.map((item) => (
                    <button key={item} type="button"
                      onClick={() => onUseDetectedSymptom(item)}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition duration-200 hover:bg-amber-100">{item}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
