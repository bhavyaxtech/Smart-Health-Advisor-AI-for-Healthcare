"use client";

import Link from "next/link";
import { TABS, TAB_META, UserAvatar } from "./tab-meta";

export default function Sidebar({ activeTab, onSelect, user, creditsRemaining }) {
  return (
    <aside className="hidden flex-shrink-0 md:flex md:w-12 md:flex-col lg:w-[220px]">
      <div className="glass flex flex-1 flex-col border-r border-[rgba(255,255,255,0.6)] p-2 lg:p-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-2">
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl font-display text-sm text-stone-50"
            style={{ background: "linear-gradient(135deg,#c97022,#edaf60)" }}>V</span>
          <span className="hidden font-display text-xl lg:inline">Vital</span>
        </Link>

        {/* Nav */}
        <nav className="mt-3 space-y-1">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                title={TAB_META[tab].label}
                onClick={() => onSelect(tab)}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-2 py-2 text-[0.875rem] transition-all duration-[160ms] ease-out ${active ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-[rgba(255,255,255,0.55)] hover:text-stone-700"
                  }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-500" />}
                <span className="inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                  {TAB_META[tab].icon}
                </span>
                <span className="hidden lg:inline">{TAB_META[tab].label}</span>
                <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2 py-1 text-xs text-stone-50 group-hover:block lg:hidden">
                  {TAB_META[tab].label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom user strip */}
        <div className="mt-auto hidden border-t border-[rgba(20,16,8,0.06)] pt-3 lg:block">
          <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
            <UserAvatar user={user} size={28} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-stone-700">{user?.name || "User"}</p>
              <p className="truncate text-[10px] text-stone-400">{user?.email || ""}</p>
            </div>
            <div className="rounded-full px-2 py-0.5 font-display text-[10px] font-medium text-white"
              style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
              {creditsRemaining}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
