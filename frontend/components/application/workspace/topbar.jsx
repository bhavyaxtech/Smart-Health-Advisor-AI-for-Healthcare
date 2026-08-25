"use client";

import { TAB_META, UserAvatar } from "./tab-meta";

export default function Topbar({ activeTab, creditsRemaining, healthStatus, user, onLogout }) {
  return (
    <header className="glass flex h-14 flex-shrink-0 items-center justify-between border-b border-[rgba(20,16,8,0.06)] px-5 sm:px-8">
      <h1 className="font-display text-[1.1rem] font-normal text-stone-900">
        {TAB_META[activeTab]?.label || "Workspace"}
      </h1>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 sm:flex">
          <span className="font-display">{creditsRemaining}</span> credits
        </div>
        <span
          className={`h-2 w-2 rounded-full ${healthStatus === "healthy" ? "bg-emerald-500" : healthStatus === "degraded" ? "bg-amber-500" : "bg-red-400"}`}
          title={healthStatus || "unknown"}
        />
        <UserAvatar user={user} size={28} />
        <button type="button" onClick={onLogout} className="hidden text-xs text-stone-500 transition hover:text-stone-700 sm:inline" title="Sign out">
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10.5 11.5L14 8l-3.5-3.5M5.5 8H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </header>
  );
}
