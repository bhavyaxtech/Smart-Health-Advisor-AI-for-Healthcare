"use client";

import { Panel, inputCls } from "@/components/ui/primitives";

export default function AssistantTab({
  chatResponse,
  lastChatMessage,
  chatBusy,
  degraded,
  chatMessage,
  onChatMessageChange,
  onSubmitChat,
}) {
  return (
    <Panel title="Assistant" subtitle="Ask follow-up questions in chat format.">
      <div className="glass rounded-[24px] p-4">
        <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
          {lastChatMessage ? (
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-amber-200 px-4 py-3 text-sm text-amber-800">{lastChatMessage}</div>
          ) : null}
          {chatResponse ? (
            <div className="glass w-fit max-w-[90%] rounded-2xl px-4 py-3 text-sm font-light leading-[1.72] text-stone-600">{chatResponse.response}</div>
          ) : (
            <div className="glass w-fit max-w-[90%] rounded-2xl px-4 py-3 text-sm text-stone-500">Ask a question to start the conversation.</div>
          )}
          {chatBusy ? (
            <div className="glass inline-flex items-center gap-1 rounded-2xl px-4 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400 [animation-delay:0.12s]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400 [animation-delay:0.24s]" />
            </div>
          ) : null}
        </div>
        {(chatResponse?.suggestions || []).length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chatResponse.suggestions.map((item) => (
              <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">{item}</span>
            ))}
          </div>
        ) : null}
        {(chatResponse?.follow_up_questions || []).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chatResponse.follow_up_questions.map((item) => (
              <button key={item} type="button" onClick={() => onChatMessageChange(item)}
                className="glass rounded-full px-3 py-1.5 text-xs text-stone-600 transition duration-200 hover:text-amber-700">{item}</button>
            ))}
          </div>
        ) : null}
        <form onSubmit={onSubmitChat} className="mt-4 flex gap-2">
          <input value={chatMessage} onChange={(e) => onChatMessageChange(e.target.value)} className={`${inputCls} flex-1`} placeholder="Ask a follow-up question..." />
          <button type="submit" disabled={chatBusy || degraded}
            className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-stone-50 transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }} aria-label="Send message">
            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
              <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </Panel>
  );
}
