"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import {
  clearAuthSession,
  getStoredSession,
  updateStoredUser,
} from "@/lib/session";

const tabs = ["analysis", "dashboard", "history", "assistant", "voice", "research"];
const DEFAULT_CREDITS = 5;
const PATTERN_TIMEFRAMES = ["week", "month", "quarter"];
const TAB_META = {
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

function formatDate(value) {
  try {
    return value ? new Date(value).toLocaleString() : "—";
  } catch {
    return String(value || "—");
  }
}

function labelize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isAuthFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.status === 401 || message.includes("token");
}

function probabilityToScore(probability) {
  const raw = String(probability || "");
  const explicitPercent = raw.match(/(\d+(\.\d+)?)/);
  if (explicitPercent) {
    const value = Number(explicitPercent[1]);
    return raw.includes("%") ? Math.max(0, Math.min(100, value)) : Math.max(0, Math.min(100, value));
  }
  if (/critical|very high|high/i.test(raw)) return 86;
  if (/moderate|medium/i.test(raw)) return 58;
  if (/low|minimal/i.test(raw)) return 30;
  return 45;
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="glass-strong rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-normal text-stone-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 max-w-3xl text-sm font-light leading-[1.72] text-stone-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ title, body, action = null }) {
  return (
    <div className="glass rounded-[22px] px-5 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[rgba(201,112,34,0.08)]">
        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
          <circle cx="10" cy="10" r="7.5" stroke="#c97022" strokeWidth="1.3" />
          <path d="M10 7v3M10 13h.01" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-normal text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm font-light leading-[1.72] text-stone-400">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default function WorkspaceShell() {
  const router = useRouter();
  const [authSession, setAuthSessionState] = useState(() => getStoredSession());
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisTab, setAnalysisTab] = useState("overview");
  const [activeTab, setActiveTab] = useState("analysis");
  const [chatResponse, setChatResponse] = useState(null);
  const [voiceResponse, setVoiceResponse] = useState(null);
  const [researchResponse, setResearchResponse] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [voiceConfidence, setVoiceConfidence] = useState("0.90");
  const [researchQuery, setResearchQuery] = useState("");
  const [form, setForm] = useState({
    symptom: "",
    duration: "",
    severity: "",
    age: "",
    gender: "",
    medicalHistory: "",
    additionalInfo: "",
  });
  const [loading, setLoading] = useState({
    app: false,
    analysis: false,
    chat: false,
    voice: false,
    research: false,
    pattern: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [patternTimeframe, setPatternTimeframe] = useState("month");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [lastChatMessage, setLastChatMessage] = useState("");

  const signedInUser = me || authSession?.user || null;
  const creditsTotal = credits?.credits_total ?? DEFAULT_CREDITS;
  const creditsRemaining =
    credits?.credits_remaining ?? signedInUser?.credits_remaining ?? 0;
  const degraded =
    health?.status === "degraded" ||
    health?.status === "unavailable" ||
    health?.database_available === false;
  const scoreTone = useMemo(() => {
    const score = Number(dashboard?.health_score ?? 0);
    if (score >= 80) return "text-emerald-700";
    if (score >= 55) return "text-amber-700";
    return "text-rose-700";
  }, [dashboard]);

  const mobilePrimaryTabs = tabs.slice(0, 5);
  const mobileOverflowTabs = tabs.slice(5);

  useEffect(() => {
    apiClient.setToken(authSession?.token || null);
  }, [authSession]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const payload = await apiClient.getHealth();
        if (!cancelled) setHealth(payload);
      } catch {
        if (!cancelled) {
          setHealth({
            status: "unavailable",
            database_available: false,
            database_error: "Unable to reach the backend service.",
          });
        }
      }

      if (!cancelled && !getStoredSession()?.token) {
        router.replace("/login");
        return;
      }

      if (!cancelled && authSession?.token) {
        await refreshProtectedData(authSession.token, cancelled);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [authSession?.token, router]);

  function clearFeedback() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function setBusy(key, value) {
    setLoading((current) => ({ ...current, [key]: value }));
  }

  function updateStoredProfile(user) {
    updateStoredUser(user);
    setAuthSessionState((current) =>
      current ? { ...current, user: user || current.user } : current
    );
  }

  function markServiceHealth(status, message) {
    setHealth((current) => ({
      ...(current || {}),
      status,
      database_available: false,
      database_error: message || current?.database_error,
      degraded_features: current?.degraded_features || [],
    }));
  }

  function handleLogout(message = "Signed out successfully.") {
    clearAuthSession();
    apiClient.clearToken();
    setAuthSessionState(null);
    setSuccessMessage(message);
    router.push("/login");
  }

  function handleProtectedError(error, fallback, degradedMessage = fallback) {
    if (isAuthFailure(error)) {
      handleLogout("Your session expired. Please sign in again.");
      return;
    }
    if (error?.status === 503) {
      markServiceHealth("degraded", error?.message);
      setErrorMessage(degradedMessage);
      return;
    }
    if (error?.status === 0) {
      markServiceHealth("unavailable", error?.message);
      setErrorMessage("Unable to reach the server. Check your connection.");
      return;
    }
    setErrorMessage(error?.message || fallback);
  }

  async function refreshProtectedData(tokenOverride = null, cancelled = false) {
    const token = tokenOverride || authSession?.token;
    if (!token) return;

    apiClient.setToken(token);
    setBusy("app", true);

    try {
      const [mePayload, creditsPayload, historyPayload] = await Promise.all([
        apiClient.getCurrentUser(),
        apiClient.getCredits(),
        apiClient.getHistory(),
      ]);

      if (cancelled) return;

      setMe(mePayload);
      updateStoredProfile(mePayload);
      setCredits(creditsPayload);
      setHistory(historyPayload || []);

      if (mePayload?.user_id) {
        const dashboardPayload = await apiClient.getDashboard(mePayload.user_id);
        if (!cancelled) setDashboard(dashboardPayload);
      }

      setHealth((current) =>
        current
          ? { ...current, status: "healthy", database_available: true, database_error: null }
          : current
      );
    } catch (error) {
      if (!cancelled) {
        handleProtectedError(
          error,
          "Failed to refresh your account data.",
          "Some features may be temporarily limited."
        );
      }
    } finally {
      if (!cancelled) setBusy("app", false);
    }
  }

  async function submitTool(key, action, onSuccess, fallback) {
    clearFeedback();
    setBusy(key, true);
    try {
      const response = await action();
      onSuccess(response);
    } catch (error) {
      handleProtectedError(error, fallback);
    } finally {
      setBusy(key, false);
    }
  }

  async function retryHealth() {
    clearFeedback();
    setBusy("app", true);
    try {
      const payload = await apiClient.getHealth();
      setHealth(payload);
      await refreshProtectedData();
    } catch (error) {
      markServiceHealth("unavailable", error?.message || "Unable to reach the backend service.");
      setErrorMessage("Unable to reach the server. Check your connection.");
    } finally {
      setBusy("app", false);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    clearFeedback();

    if (!form.symptom.trim()) {
      setErrorMessage("Please enter a symptom to analyze.");
      return;
    }

    if (creditsRemaining <= 0) {
      setErrorMessage(
        `This account has already used all ${creditsTotal} analyses included.`
      );
      return;
    }

    setBusy("analysis", true);

    try {
      const payload = {
        symptom: form.symptom.trim(),
        duration: form.duration.trim(),
        severity: form.severity.trim(),
        additional_info: form.additionalInfo.trim(),
        gender: form.gender.trim(),
        medical_history: form.medicalHistory.trim(),
      };

      if (form.age) payload.age = Number(form.age);

      const response = await apiClient.analyzeSymptom(payload);
      setAnalysis(response);
      setAnalysisTab("overview");
      setSuccessMessage("Analysis completed. One credit was used.");
      await refreshProtectedData();
    } catch (error) {
      handleProtectedError(error, "Something went wrong. Please try again.");
    } finally {
      setBusy("analysis", false);
    }
  }

  const analysisViews = {
    overview: (
      <div className="space-y-4">
        <div className="glass rounded-[22px] p-5">
          <h3 className="text-xl font-normal text-stone-900">Summary</h3>
          <p className="mt-3 whitespace-pre-line text-sm font-light leading-[1.72] text-stone-500">
            {analysis?.symptom_analysis || "No summary available yet."}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-[22px] p-5">
            <h3 className="text-xl font-normal text-stone-900">Possible causes</h3>
            <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
              {(analysis?.possible_causes || []).slice(0, 3).map((item) => (
                <li key={`${item.condition}-${item.probability}`}>• {item.condition}</li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-[22px] p-5">
            <h3 className="text-xl font-normal text-stone-900">Red flags</h3>
            <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
              {(analysis?.red_flags || []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ),
    causes: (
      <div className="space-y-3">
        {(analysis?.possible_causes || []).map((cause) => {
          const score = probabilityToScore(cause.probability);
          return (
            <div
              key={`${cause.condition}-${cause.probability}`}
              className="glass rounded-[22px] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-normal text-stone-900">{cause.condition}</h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                  {cause.probability}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-600 transition-all duration-300"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500">
                {cause.description}
              </p>
            </div>
          );
        })}
      </div>
    ),
    care: (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-[22px] p-5">
          <h3 className="text-xl font-normal text-stone-900">Diet plan</h3>
          <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500">
            <strong className="font-medium text-stone-700">Consume:</strong>{" "}
            {(analysis?.diet_plan?.foods_to_consume || []).join(", ") || "—"}
          </p>
          <p className="text-sm font-light leading-[1.72] text-stone-500">
            <strong className="font-medium text-stone-700">Avoid:</strong>{" "}
            {(analysis?.diet_plan?.foods_to_avoid || []).join(", ") || "—"}
          </p>
          <p className="text-sm font-light leading-[1.72] text-stone-500">
            <strong className="font-medium text-stone-700">Focus:</strong>{" "}
            {(analysis?.diet_plan?.nutritional_focus || []).join(", ") || "—"}
          </p>
        </div>
        <div className="glass rounded-[22px] p-5">
          <h3 className="text-xl font-normal text-stone-900">Lifestyle suggestions</h3>
          <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.lifestyle_suggestions || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <h4 className="mt-4 text-lg font-normal text-stone-900">Personalized tips</h4>
          <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.personalized_tips || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
    insights: (
      <div className="space-y-4">
        <div className="glass rounded-[22px] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-normal text-stone-900">Emergency level</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
              {analysis?.risk_assessment?.emergency_level || "Low"}
            </span>
            <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-700">
              Confidence {analysis?.confidence || "N/A"}
            </span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(analysis?.risk_assessment || {}).map(([key, value]) => (
            <div key={key} className="glass rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-stone-400">
                {labelize(key)}
              </div>
              <p className="mt-2 text-sm font-light leading-[1.72] text-stone-600">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  if (!authSession?.token) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <Panel
          title="Sign-in required"
          subtitle="Your workspace is linked to your account."
          action={
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Go to login
            </button>
          }
        >
          <EmptyState
            title="Open your Vital workspace"
            body="Sign in with Google to continue."
          />
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
      {loading.app ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(236,234,229,0.9)] backdrop-blur-md">
          <div className="glass-strong flex flex-col items-center gap-4 rounded-[28px] px-10 py-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-amber-500 to-amber-600 font-display text-2xl text-stone-50 shadow-[0_4px_20px_rgba(168,90,20,0.36)]">
              V
            </div>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            <p className="text-sm text-stone-400">Loading your health data...</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <aside className="hidden md:flex md:w-14 md:flex-col lg:w-60">
          <div className="glass-strong flex flex-1 flex-col rounded-[24px] p-2 lg:p-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-2 py-2 text-stone-800 lg:bg-stone-50/70"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 font-display text-sm text-stone-50">
                V
              </span>
              <span className="hidden font-display text-xl lg:inline">Vital</span>
            </Link>
            <nav className="mt-3 space-y-2">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab}
                    type="button"
                    title={TAB_META[tab].label}
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileMoreOpen(false);
                    }}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-2 py-2 text-sm transition duration-200 ${
                      activeTab === tab
                        ? "bg-[rgba(201,112,34,0.09)] text-amber-700"
                        : "text-stone-500 hover:bg-[rgba(255,255,255,0.55)] hover:text-stone-700"
                    }`}
                  >
                    <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition duration-200 ${
                      activeTab === tab
                        ? "text-amber-700"
                        : "text-stone-500 group-hover:text-stone-700"
                    }`}>
                      {TAB_META[tab].icon}
                    </span>
                    <span className="hidden lg:inline">{TAB_META[tab].label}</span>
                    {activeTab === tab && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-500" />
                    )}
                    <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 group-hover:block lg:hidden">
                      {TAB_META[tab].label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto hidden border-t border-[rgba(20,16,8,0.06)] pt-3 lg:block">
              <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
                {signedInUser?.picture ? (
                  <img src={signedInUser.picture} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-300 text-[11px] font-semibold text-white">
                    {(signedInUser?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-stone-700">{signedInUser?.name || "User"}</p>
                  <p className="truncate text-[10px] text-stone-400">{signedInUser?.email || ""}</p>
                </div>
                <div className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  {creditsRemaining}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <header className="glass-strong rounded-[28px] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-normal text-stone-900">
                  Welcome, {signedInUser?.name || "there"}
                </h1>
                <p className="mt-2 text-sm font-light leading-[1.72] text-stone-400">
                  Manage analysis, trends, history, assistant, voice, and research in one
                  place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => refreshProtectedData()}
                  className="rounded-[10px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:border-[rgba(20,16,8,0.18)]"
                >
                  {loading.app ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign out
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="glass rounded-[18px] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Status</p>
                <p className="mt-1.5 font-display text-2xl leading-none text-stone-900">
                  {health?.status === "healthy" ? "Ready" : "Limited"}
                </p>
              </div>
              <div className="glass rounded-[18px] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Credits left</p>
                <p className="mt-1.5 font-display text-2xl leading-none text-stone-900">{creditsRemaining}</p>
              </div>
              <div className="glass rounded-[18px] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400">Stored analyses</p>
                <p className="mt-1.5 font-display text-2xl leading-none text-stone-900">{history.length}</p>
              </div>
              <div className="glass rounded-[18px] px-4 py-3">
                <p className={`text-[10px] uppercase tracking-[0.16em] ${scoreTone}`}>Health score</p>
                <p className="mt-1.5 font-display text-2xl leading-none text-stone-900">
                  {dashboard?.health_score ?? "—"}
                </p>
              </div>
            </div>
          </header>

          {health?.status === "degraded" ? (
            <div className="rounded-[14px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
              <p>Some features may be temporarily limited.</p>
              {(health?.degraded_features || []).length ? (
                <ul className="mt-2 list-disc pl-5">
                  {health.degraded_features.map((feature) => (
                    <li key={feature}>{labelize(feature)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {successMessage ? (
            <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[rgba(20,100,40,0.15)] bg-[rgba(20,100,40,0.06)] px-4 py-3 text-sm text-stone-700 backdrop-blur-sm">
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage("")} className="flex-shrink-0 text-stone-500 hover:text-stone-700">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage("")} className="flex-shrink-0 text-amber-600 hover:text-amber-800">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ) : null}

          {health?.status === "unavailable" ? (
            <Panel title="Connection issue" subtitle="We could not reach the service.">
              <EmptyState
                title="Unable to reach the server. Check your connection."
                body="Retry when your connection is stable."
                action={
                  <button
                    type="button"
                    onClick={retryHealth}
                    className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Retry
                  </button>
                }
              />
            </Panel>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="glass inline-flex gap-0.5 rounded-[14px] p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-[10px] px-3.5 py-1.5 text-sm transition duration-200 ${
                        activeTab === tab
                          ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                          : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)] hover:text-stone-700"
                      }`}
                    >
                      {labelize(tab)}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {activeTab === "analysis" ? (
                    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                      <Panel
                        title="Symptom analysis"
                        subtitle="Provide context and receive educational guidance."
                        action={
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                symptom: "",
                                duration: "",
                                severity: "",
                                age: "",
                                gender: "",
                                medicalHistory: "",
                                additionalInfo: "",
                              })
                            }
                            className="rounded-[10px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:border-[rgba(20,16,8,0.18)]"
                          >
                            Reset form
                          </button>
                        }
                      >
                        <form
                          onSubmit={handleAnalyze}
                          className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Symptom</label>
                            <input
                              value={form.symptom}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, symptom: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="e.g. headache with nausea"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Duration</label>
                            <input
                              value={form.duration}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, duration: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="e.g. 2 days"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Severity</label>
                            <select
                              value={form.severity}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, severity: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                            >
                              <option value="">Select</option>
                              <option value="low">Low</option>
                              <option value="moderate">Moderate</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Age</label>
                            <input
                              value={form.age}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, age: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="e.g. 34"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Gender</label>
                            <input
                              value={form.gender}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, gender: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Medical history</label>
                            <textarea
                              rows={3}
                              value={form.medicalHistory}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, medicalHistory: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="Optional background information"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.16em] text-stone-400">Additional details</label>
                            <textarea
                              rows={4}
                              value={form.additionalInfo}
                              onChange={(event) =>
                                setForm((current) => ({ ...current, additionalInfo: event.target.value }))
                              }
                              className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                              placeholder="Any extra context"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                            <button
                              type="submit"
                              disabled={loading.analysis || degraded}
                              className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {loading.analysis ? "Analyzing..." : "Analyze symptom"}
                            </button>
                            <span className="text-xs uppercase tracking-[0.16em] text-stone-400">
                              5 analyses included
                            </span>
                          </div>
                        </form>
                      </Panel>

                      <Panel title="Analysis details" subtitle="Switch tabs to review each part of the result.">
                        {!analysis ? (
                          <EmptyState
                            title="No analysis yet"
                            body="Submit the form to see your result."
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
                              {["overview", "causes", "care", "insights"].map((tab) => (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setAnalysisTab(tab)}
                                  className={`rounded-[8px] px-3 py-1.5 text-sm transition duration-200 ${
                                    analysisTab === tab
                                      ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                                      : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)] hover:text-stone-700"
                                  }`}
                                >
                                  {labelize(tab)}
                                </button>
                              ))}
                            </div>
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={analysisTab}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              >
                                {analysisViews[analysisTab]}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        )}
                      </Panel>
                    </div>
                  ) : null}

                  {activeTab === "dashboard" ? (
                    <Panel
                      title="Health dashboard"
                      subtitle="Review trends and run pattern analysis by timeframe."
                      action={
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
                            {PATTERN_TIMEFRAMES.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setPatternTimeframe(option)}
                                className={`rounded-[8px] px-3 py-1 text-xs uppercase tracking-[0.14em] transition duration-200 ${
                                  patternTimeframe === option
                                    ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                                    : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)]"
                                }`}
                              >
                                {labelize(option)}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              submitTool(
                                "pattern",
                                () => apiClient.runPatternAnalysis(patternTimeframe),
                                (response) => {
                                  setPatternAnalysis(response);
                                  setSuccessMessage("Pattern analysis refreshed.");
                                },
                                "Something went wrong. Please try again."
                              )
                            }
                            disabled={loading.pattern || degraded}
                            className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loading.pattern ? "Running..." : "Run Pattern Analysis"}
                          </button>
                        </div>
                      }
                    >
                      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="glass rounded-2xl p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Health score</p>
                              <p className={`mt-2 font-display text-4xl ${scoreTone}`}>
                                {dashboard?.health_score ?? "—"}
                              </p>
                            </div>
                            <div className="glass rounded-2xl p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Latest symptom</p>
                              <p className="mt-2 text-lg text-stone-700">
                                {dashboard?.latest_symptom || "No data"}
                              </p>
                            </div>
                          </div>

                          {dashboard?.symptom_trends?.length ? (
                            dashboard.symptom_trends.map((item, index) => (
                              <article
                                key={`${item.date}-${item.symptom}-${index}`}
                                className="glass rounded-2xl p-4"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-xl font-normal text-stone-900">
                                    {item.symptom || "Unknown symptom"}
                                  </h3>
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-700">
                                    {labelize(item.severity_label || item.severity || "low")}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-400">
                                  {formatDate(item.date)}
                                </p>
                                <p className="mt-2 text-sm font-light leading-[1.72] text-stone-500">
                                  {item.summary || "No summary available."}
                                </p>
                              </article>
                            ))
                          ) : (
                            <EmptyState
                              title="No trend data"
                              body="Run an analysis to generate dashboard trends."
                            />
                          )}
                        </div>

                        <div className="space-y-3">
                          {[
                            ["Risk factors", dashboard?.risk_factors],
                            ["Improvement areas", dashboard?.improvement_areas],
                            ["Recommendations", dashboard?.ai_recommendations],
                          ].map(([title, items]) => (
                            <div key={title} className="glass rounded-2xl p-4">
                              <h3 className="text-xl font-normal text-stone-900">{title}</h3>
                              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(items || []).map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}

                          {patternAnalysis ? (
                            <div className="glass rounded-2xl p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-normal text-stone-900">
                                  {patternAnalysis.analysis_type || "Pattern analysis"}
                                </h3>
                                <span className="rounded-full bg-sky-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-700">
                                  Confidence {patternAnalysis.confidence ?? "N/A"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-light text-stone-500">
                                Timeframe: {labelize(patternAnalysis.timeframe || patternTimeframe)}
                              </p>
                              <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(patternAnalysis.patterns || []).map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                              <h4 className="mt-3 text-lg font-normal text-stone-900">Recommendations</h4>
                              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(patternAnalysis.recommendations || []).map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Panel>
                  ) : null}

                  {activeTab === "history" ? (
                    <Panel
                      title="History"
                      subtitle="Your saved analyses over time."
                    >
                      {history?.length ? (
                        <div className="space-y-3">
                          {history.map((item) => (
                            <article
                              key={item.id}
                              className="glass grid gap-2 rounded-2xl p-4 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]"
                            >
                              <p className="font-display text-lg text-stone-900">
                                {formatDate(item.created_at)}
                              </p>
                              <p className="text-sm text-stone-600">{labelize(item.symptom || "unknown")}</p>
                              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-700">
                                {labelize(item.severity || "low")}
                              </span>
                              <p className="text-sm text-stone-500">{item.duration || "—"}</p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No history yet"
                          body="Complete your first analysis to start tracking progress."
                        />
                      )}
                    </Panel>
                  ) : null}

                  {activeTab === "assistant" ? (
                    <Panel title="Assistant" subtitle="Ask follow-up questions in chat format.">
                      <div className="glass rounded-[24px] p-4">
                        <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                          {lastChatMessage ? (
                            <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-amber-200 px-4 py-3 text-sm text-amber-800">
                              {lastChatMessage}
                            </div>
                          ) : null}

                          {chatResponse ? (
                            <div className="glass w-fit max-w-[90%] rounded-2xl px-4 py-3 text-sm font-light leading-[1.72] text-stone-600">
                              {chatResponse.response}
                            </div>
                          ) : (
                            <div className="glass w-fit max-w-[90%] rounded-2xl px-4 py-3 text-sm text-stone-500">
                              Ask a question to start the conversation.
                            </div>
                          )}

                          {loading.chat ? (
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
                              <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {(chatResponse?.follow_up_questions || []).length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {chatResponse.follow_up_questions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setChatMessage(item)}
                                className="glass rounded-full px-3 py-1.5 text-xs text-stone-600 transition duration-300 hover:border-amber-200 hover:text-amber-700"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (!chatMessage.trim()) {
                              setErrorMessage("Enter a question for the assistant.");
                              return;
                            }
                            const outgoing = chatMessage.trim();
                            submitTool(
                              "chat",
                              () => apiClient.sendChatMessage(outgoing),
                              (response) => {
                                setLastChatMessage(outgoing);
                                setChatResponse(response);
                                setChatMessage("");
                              },
                              "Something went wrong. Please try again."
                            );
                          }}
                          className="mt-4 flex gap-2"
                        >
                          <input
                            value={chatMessage}
                            onChange={(event) => setChatMessage(event.target.value)}
                            className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                            placeholder="Ask a follow-up question..."
                          />
                          <button
                            type="submit"
                            disabled={loading.chat || degraded}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 text-lg text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Send message"
                          >
                            &gt;
                          </button>
                        </form>
                      </div>
                    </Panel>
                  ) : null}

                  {activeTab === "voice" ? (
                    <Panel title="Voice" subtitle="Paste transcript text and review detected symptoms.">
                      <div className="mx-auto max-w-3xl space-y-4">
                        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-200 text-3xl text-amber-700">
                          M
                        </div>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (!voiceText.trim()) {
                              setErrorMessage("Enter voice text before running analysis.");
                              return;
                            }
                            submitTool(
                              "voice",
                              () =>
                                apiClient.analyzeVoiceInput({
                                  audio_text: voiceText.trim(),
                                  confidence: Number(voiceConfidence || 0.9),
                                  language: "en",
                                }),
                              (response) => {
                                setVoiceResponse(response);
                                setSuccessMessage("Voice input analyzed.");
                              },
                              "Something went wrong. Please try again."
                            );
                          }}
                          className="space-y-3"
                        >
                          <textarea
                            rows={5}
                            value={voiceText}
                            onChange={(event) => setVoiceText(event.target.value)}
                            className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                            placeholder="Paste voice transcript..."
                          />
                          <input
                            value={voiceConfidence}
                            onChange={(event) => setVoiceConfidence(event.target.value)}
                            className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                            placeholder="Confidence (e.g. 0.90)"
                          />
                          <button
                            type="submit"
                            disabled={loading.voice || degraded}
                            className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loading.voice ? "Processing..." : "Analyse Voice Input"}
                          </button>
                        </form>

                        {voiceResponse ? (
                          <div className="space-y-3">
                            <div className="glass rounded-2xl p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-normal text-stone-900">Response</h3>
                                <span className="rounded-full bg-sky-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-700">
                                  Confidence {voiceResponse.confidence ?? voiceConfidence}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-light leading-[1.72] text-stone-500">
                                {voiceResponse.response}
                              </p>
                            </div>
                            {(voiceResponse.detected_symptoms || []).length ? (
                              <div className="glass rounded-2xl p-4">
                                <h4 className="text-lg font-normal text-stone-900">Detected symptoms</h4>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {voiceResponse.detected_symptoms.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        setForm((current) => ({ ...current, symptom: item }));
                                        setActiveTab("analysis");
                                        setSuccessMessage(`Added "${item}" to the analysis form.`);
                                      }}
                                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition duration-300 hover:bg-amber-100"
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </Panel>
                  ) : null}

                  {activeTab === "research" ? (
                    <Panel title="Research" subtitle="Search and read educational literature summaries.">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!researchQuery.trim()) {
                            setErrorMessage("Enter a topic to search.");
                            return;
                          }
                          submitTool(
                            "research",
                            () => apiClient.runRealtimeSearch(researchQuery.trim()),
                            (response) => {
                              setResearchResponse(response);
                              setSuccessMessage("Search completed.");
                            },
                            "Something went wrong. Please try again."
                          );
                        }}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          value={researchQuery}
                          onChange={(event) => setResearchQuery(event.target.value)}
                          className="w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)] focus:bg-[rgba(255,252,248,0.95)]"
                          placeholder="e.g. migraine triggers and nutrition"
                        />
                        <button
                          type="submit"
                          disabled={loading.research || degraded}
                          className="rounded-[10px] bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading.research ? "Searching..." : "Search"}
                        </button>
                      </form>

                      {researchResponse !== null ? (
                        <div className="glass mt-4 rounded-[24px] p-5">
                          <h3 className="text-2xl font-normal text-stone-900">
                            {researchResponse.query || "Search result"}
                          </h3>
                          <div className="mt-3 space-y-3">
                            {String(researchResponse.results || "")
                              .split(/\n{2,}/)
                              .filter(Boolean)
                              .map((paragraph, index) => (
                                <p
                                  key={`${index}-${paragraph.slice(0, 24)}`}
                                  className="text-sm font-light leading-[1.72] text-stone-500"
                                >
                                  {paragraph}
                                </p>
                              ))}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-stone-400">
                            <span>Sources {researchResponse.source_count ?? "N/A"}</span>
                            {researchResponse.pubmed_url ? (
                              <a
                                href={researchResponse.pubmed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-[10px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:border-[rgba(20,16,8,0.18)]"
                              >
                                Open source link
                              </a>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm italic text-stone-400">
                            {formatDate(researchResponse.timestamp)}
                          </p>
                        </div>
                      ) : null}
                    </Panel>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-4 md:hidden">
        <div className="pointer-events-auto glass-strong relative mx-auto max-w-xl rounded-[26px] px-3 py-2">
          <div className="grid grid-cols-5 gap-1">
            {mobilePrimaryTabs.map((tab) => {
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMoreOpen(false);
                  }}
                  className={`rounded-xl px-1 py-2 text-[11px] transition duration-300 ${
                    selected
                      ? "bg-amber-500 text-stone-50"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <div className="mx-auto inline-flex h-6 w-6 items-center justify-center rounded-md">
                    {TAB_META[tab].icon}
                  </div>
                  <div className="mt-1">{TAB_META[tab].label}</div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setMobileMoreOpen((current) => !current)}
            className={`mt-2 w-full rounded-xl px-3 py-2 text-xs transition duration-300 ${
              mobileOverflowTabs.includes(activeTab) || mobileMoreOpen
                ? "bg-amber-500 text-stone-50"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            More
          </button>
          {mobileMoreOpen ? (
            <div className="mt-2 space-y-1 rounded-xl border border-stone-200 bg-stone-50 p-2">
              {mobileOverflowTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMoreOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-600 transition duration-300 hover:bg-stone-100 hover:text-amber-700"
                >
                  {TAB_META[tab].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="mt-5 pb-20 text-center text-xs text-stone-400 md:pb-0">
        Vital provides educational guidance only and does not replace licensed medical care.
      </footer>
    </main>
  );
}
