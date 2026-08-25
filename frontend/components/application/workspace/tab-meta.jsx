export const TABS = ["analysis", "dashboard", "history", "assistant", "voice", "research"];

export const TAB_META = {
  analysis: {
    label: "Analysis",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 9l2.3 2.3 3.8-3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  dashboard: {
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 11l2.5-3 2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  history: {
    label: "History",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  assistant: {
    label: "Assistant",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="14" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  voice: {
    label: "Voice",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <rect x="6.5" y="2" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3.5 9A5.5 5.5 0 009 14.5 5.5 5.5 0 0014.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="9" y1="14.5" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  research: {
    label: "Research",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function UserAvatar({ user, size = 28 }) {
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt=""
        style={{ height: size, width: size }}
        className="flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ height: size, width: size }}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
    >
      <span
        className="inline-flex h-full w-full items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}
      >
        {(user?.name || "U")[0].toUpperCase()}
      </span>
    </div>
  );
}
