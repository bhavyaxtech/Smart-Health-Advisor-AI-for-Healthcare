"use client";

export const inputCls =
  "w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:bg-[rgba(255,252,248,0.95)] focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)]";

export const btnPrimary =
  "inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-medium text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60";

export const btnGhost =
  "rounded-[10px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:border-[rgba(20,16,8,0.18)]";

export function Panel({ title, subtitle, action, children }) {
  return (
    <section className="glass rounded-[20px] p-6 sm:p-7">
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-[1rem] font-normal text-stone-800">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 max-w-3xl text-[0.855rem] font-light leading-[1.72] text-stone-400">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {(title || action) && <div className="mt-3 border-t border-[rgba(20,16,8,0.06)]" />}
      <div className={title || action ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, body, action = null }) {
  return (
    <div className="glass rounded-[20px] px-5 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-chip bg-[rgba(201,112,34,0.08)]">
        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
          <circle cx="10" cy="10" r="7.5" stroke="#c97022" strokeWidth="1.3" />
          <path d="M10 7v3M10 13h.01" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-normal text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm font-light leading-[1.72] text-stone-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
