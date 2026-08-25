"use client";

import { useState } from "react";
import { TABS, TAB_META } from "./tab-meta";

const PRIMARY_COUNT = 5;

export default function MobileNav({ activeTab, onSelect }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryTabs = TABS.slice(0, PRIMARY_COUNT);
  const overflowTabs = TABS.slice(PRIMARY_COUNT);

  function select(tab) {
    onSelect(tab);
    setMoreOpen(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-4 md:hidden">
      <div className="pointer-events-auto glass-strong relative mx-auto max-w-xl rounded-[26px] px-3 py-2">
        <div className="grid grid-cols-5 gap-1">
          {primaryTabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button key={tab} type="button"
                onClick={() => select(tab)}
                className={`rounded-xl px-1 py-2 text-[11px] transition duration-200 ${selected ? "text-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
                style={selected ? { background: "linear-gradient(135deg,#c97022,#a85a14)" } : {}}>
                <div className="mx-auto inline-flex h-6 w-6 items-center justify-center rounded-md">
                  {TAB_META[tab].icon}
                </div>
                <div className="mt-1">{TAB_META[tab].label}</div>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => setMoreOpen((current) => !current)}
          className={`mt-2 w-full rounded-xl px-3 py-2 text-xs transition duration-200 ${overflowTabs.includes(activeTab) || moreOpen ? "text-stone-50" : "bg-stone-100 text-stone-600"}`}
          style={overflowTabs.includes(activeTab) || moreOpen ? { background: "linear-gradient(135deg,#c97022,#a85a14)" } : {}}>
          More
        </button>
        {moreOpen ? (
          <div className="mt-2 space-y-1 rounded-xl border border-stone-200 bg-stone-50 p-2">
            {overflowTabs.map((tab) => (
              <button key={tab} type="button"
                onClick={() => select(tab)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-600 transition duration-200 hover:bg-stone-100 hover:text-amber-700">
                {TAB_META[tab].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
