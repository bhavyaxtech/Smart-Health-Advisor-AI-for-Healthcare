"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import { clearAuthSession, getStoredSession, updateStoredUser } from "@/lib/session";

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

/* ── unchanged helpers ── */
function formatDate(value) {
  try { return value ? new Date(value).toLocaleString() : "—"; } catch { return String(value || "—"); }
}
function labelize(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
function isAuthFailure(error) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.status === 401 || msg.includes("token");
}
function probabilityToScore(probability) {
  const raw = String(probability || "");
  const m = raw.match(/(\d+(\.\d+)?)/);
  if (m) { const v = Number(m[1]); return Math.max(0, Math.min(100, v)); }
  if (/critical|very high|high/i.test(raw)) return 86;
  if (/moderate|medium/i.test(raw)) return 58;
  if (/low|minimal/i.test(raw)) return 30;
  return 45;
}

/* ── design components ── */
function Panel({ title, subtitle, action, children }) {
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

function EmptyState({ title, body, action = null }) {
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

const inputCls = "w-full rounded-[12px] border border-[rgba(20,16,8,0.10)] bg-[rgba(255,252,248,0.8)] px-4 py-3 text-sm text-stone-800 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:bg-[rgba(255,252,248,0.95)] focus:shadow-[0_0_0_3px_rgba(201,112,34,0.10)]";
const btnPrimary = "inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-medium text-stone-50 shadow-[0_2px_10px_rgba(168,90,20,0.28)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(168,90,20,0.36)] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost = "rounded-[10px] border border-[rgba(20,16,8,0.11)] bg-[rgba(255,252,248,0.68)] px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition duration-200 hover:bg-[rgba(255,252,248,0.9)] hover:border-[rgba(20,16,8,0.18)]";

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
  const [form, setForm] = useState({ symptom: "", duration: "", severity: "", age: "", gender: "", medicalHistory: "", additionalInfo: "" });
  const [loading, setLoading] = useState({ app: false, analysis: false, chat: false, voice: false, research: false, pattern: false });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [patternTimeframe, setPatternTimeframe] = useState("month");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [lastChatMessage, setLastChatMessage] = useState("");

  const signedInUser = me || authSession?.user || null;
  const creditsTotal = credits?.credits_total ?? DEFAULT_CREDITS;
  const creditsRemaining = credits?.credits_remaining ?? signedInUser?.credits_remaining ?? 0;
  const degraded = health?.status === "degraded" || health?.status === "unavailable" || health?.database_available === false;
  const scoreTone = useMemo(() => {
    const score = Number(dashboard?.health_score ?? 0);
    if (score >= 80) return "text-emerald-700";
    if (score >= 55) return "text-amber-700";
    return "text-rose-700";
  }, [dashboard]);

  const mobilePrimaryTabs = tabs.slice(0, 5);
  const mobileOverflowTabs = tabs.slice(5);

  useEffect(() => { apiClient.setToken(authSession?.token || null); }, [authSession]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const payload = await apiClient.getHealth();
        if (!cancelled) setHealth(payload);
      } catch {
        if (!cancelled) setHealth({ status: "unavailable", database_available: false, database_error: "Unable to reach the backend service." });
      }
      if (!cancelled && !getStoredSession()?.token) { router.replace("/login"); return; }
      if (!cancelled && authSession?.token) await refreshProtectedData(authSession.token, cancelled);
    }
    initialize();
    return () => { cancelled = true; };
  }, [authSession?.token, router]);

  function clearFeedback() { setErrorMessage(""); setSuccessMessage(""); }
  function setBusy(key, value) { setLoading((c) => ({ ...c, [key]: value })); }
  function updateStoredProfile(user) {
    updateStoredUser(user);
    setAuthSessionState((c) => c ? { ...c, user: user || c.user } : c);
  }
  function markServiceHealth(status, message) {
    setHealth((c) => ({ ...(c || {}), status, database_available: false, database_error: message || c?.database_error, degraded_features: c?.degraded_features || [] }));
  }
  function handleLogout(message = "Signed out successfully.") {
    clearAuthSession(); apiClient.clearToken(); setAuthSessionState(null);
    setSuccessMessage(message); router.push("/login");
  }
  function handleProtectedError(error, fallback, degradedMessage = fallback) {
    if (isAuthFailure(error)) { handleLogout("Your session expired. Please sign in again."); return; }
    if (error?.status === 503) { markServiceHealth("degraded", error?.message); setErrorMessage(degradedMessage); return; }
    if (error?.status === 0) { markServiceHealth("unavailable", error?.message); setErrorMessage("Unable to reach the server. Check your connection."); return; }
    setErrorMessage(error?.message || fallback);
  }
  async function refreshProtectedData(tokenOverride = null, cancelled = false) {
    const token = tokenOverride || authSession?.token;
    if (!token) return;
    apiClient.setToken(token);
    setBusy("app", true);
    try {
      const [mePayload, creditsPayload, historyPayload] = await Promise.all([
        apiClient.getCurrentUser(), apiClient.getCredits(), apiClient.getHistory(),
      ]);
      if (cancelled) return;
      setMe(mePayload); updateStoredProfile(mePayload);
      setCredits(creditsPayload); setHistory(historyPayload || []);
      if (mePayload?.user_id) {
        const dashboardPayload = await apiClient.getDashboard(mePayload.user_id);
        if (!cancelled) setDashboard(dashboardPayload);
      }
      setHealth((c) => c ? { ...c, status: "healthy", database_available: true, database_error: null } : c);
    } catch (error) {
      if (!cancelled) handleProtectedError(error, "Failed to refresh your account data.", "Some features may be temporarily limited.");
    } finally {
      if (!cancelled) setBusy("app", false);
    }
  }
  async function submitTool(key, action, onSuccess, fallback) {
    clearFeedback(); setBusy(key, true);
    try { const r = await action(); onSuccess(r); }
    catch (error) { handleProtectedError(error, fallback); }
    finally { setBusy(key, false); }
  }
  async function retryHealth() {
    clearFeedback(); setBusy("app", true);
    try { const p = await apiClient.getHealth(); setHealth(p); await refreshProtectedData(); }
    catch (error) { markServiceHealth("unavailable", error?.message || "Unable to reach the backend service."); setErrorMessage("Unable to reach the server. Check your connection."); }
    finally { setBusy("app", false); }
  }
  async function handleAnalyze(event) {
    event.preventDefault(); clearFeedback();
    if (!form.symptom.trim()) { setErrorMessage("Please enter a symptom to analyze."); return; }
    if (creditsRemaining <= 0) { setErrorMessage(`This account has already used all ${creditsTotal} analyses included.`); return; }
    setBusy("analysis", true);
    try {
      const payload = { symptom: form.symptom.trim(), duration: form.duration.trim(), severity: form.severity.trim(), additional_info: form.additionalInfo.trim(), gender: form.gender.trim(), medical_history: form.medicalHistory.trim() };
      if (form.age) payload.age = Number(form.age);
      const response = await apiClient.analyzeSymptom(payload);
      setAnalysis(response); setAnalysisTab("overview");
      setSuccessMessage("Analysis completed. One credit was used.");
      await refreshProtectedData();
    } catch (error) { handleProtectedError(error, "Something went wrong. Please try again."); }
    finally { setBusy("analysis", false); }
  }

  const analysisViews = {
    overview: (
      <div className="space-y-4">
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-display text-xl font-normal text-stone-900">Summary</h3>
          <p className="mt-3 whitespace-pre-line text-sm font-light leading-[1.72] text-stone-500">{analysis?.symptom_analysis || "No summary available yet."}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-[22px] p-5">
            <h3 className="font-display text-xl font-normal text-stone-900">Possible causes</h3>
            <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
              {(analysis?.possible_causes || []).slice(0, 3).map((item) => (
                <li key={`${item.condition}-${item.probability}`} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                  {item.condition}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-[22px] p-5">
            <h3 className="font-display text-xl font-normal text-stone-900">Red flags</h3>
            <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
              {(analysis?.red_flags || []).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
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
            <div key={`${cause.condition}-${cause.probability}`} className="glass rounded-[22px] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-normal text-stone-900">{cause.condition}</h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">{cause.probability}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, background: "linear-gradient(90deg,#edaf60,#c97022)" }} />
              </div>
              <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500">{cause.description}</p>
            </div>
          );
        })}
      </div>
    ),
    care: (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-display text-xl font-normal text-stone-900">Diet plan</h3>
          <p className="mt-3 text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Consume:</strong> {(analysis?.diet_plan?.foods_to_consume || []).join(", ") || "—"}</p>
          <p className="text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Avoid:</strong> {(analysis?.diet_plan?.foods_to_avoid || []).join(", ") || "—"}</p>
          <p className="text-sm font-light leading-[1.72] text-stone-500"><strong className="font-medium text-stone-700">Focus:</strong> {(analysis?.diet_plan?.nutritional_focus || []).join(", ") || "—"}</p>
        </div>
        <div className="glass rounded-[22px] p-5">
          <h3 className="font-display text-xl font-normal text-stone-900">Lifestyle suggestions</h3>
          <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.lifestyle_suggestions || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
          </ul>
          <h4 className="mt-4 font-display text-lg font-normal text-stone-900">Personalized tips</h4>
          <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
            {(analysis?.personalized_tips || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
          </ul>
        </div>
      </div>
    ),
    insights: (
      <div className="space-y-4">
        <div className="glass rounded-[22px] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-normal text-stone-900">Emergency level</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-700">{analysis?.risk_assessment?.emergency_level || "Low"}</span>
            <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-700">Confidence {analysis?.confidence || "N/A"}</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(analysis?.risk_assessment || {}).map(([key, value]) => (
            <div key={key} className="glass rounded-[22px] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-stone-400">{labelize(key)}</div>
              <p className="mt-2 text-sm font-light leading-[1.72] text-stone-600">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  /* ── No session ── */
  if (!authSession?.token) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <Panel title="Sign-in required" subtitle="Your workspace is linked to your account."
          action={<button type="button" onClick={() => router.push("/login")} className={`${btnPrimary}`} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>Go to login</button>}>
          <EmptyState title="Open your Vital workspace" body="Sign in with Google to continue." />
        </Panel>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">

      {/* Loading overlay */}
      {loading.app ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(236,234,229,0.9)] backdrop-blur-md">
          <div className="glass-strong flex flex-col items-center gap-4 rounded-[28px] px-10 py-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] font-display text-2xl text-stone-50"
              style={{ background: "linear-gradient(135deg,#c97022,#a85a14)", boxShadow: "0 4px 20px rgba(168,90,20,0.36)" }}>V</div>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            <p className="text-sm text-stone-400">Loading your health data...</p>
          </div>
        </div>
      ) : null}

        {/* ── Sidebar ── */}
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
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    title={TAB_META[tab].label}
                    onClick={() => { setActiveTab(tab); setMobileMoreOpen(false); }}
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
                {signedInUser?.picture ? (
                  <img src={signedInUser.picture} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}>
                    {(signedInUser?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-stone-700">{signedInUser?.name || "User"}</p>
                  <p className="truncate text-[10px] text-stone-400">{signedInUser?.email || ""}</p>
                </div>
                <div className="rounded-full px-2 py-0.5 font-display text-[10px] font-medium text-white"
                  style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
                  {creditsRemaining}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content column ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* TopBar */}
          <header className="glass flex h-14 flex-shrink-0 items-center justify-between border-b border-[rgba(20,16,8,0.06)] px-5 sm:px-8">
            <h1 className="font-display text-[1.1rem] font-normal text-stone-900">
              {TAB_META[activeTab]?.label || "Workspace"}
            </h1>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 sm:flex">
                <span className="font-display">{creditsRemaining}</span> credits
              </div>
              <span className={`h-2 w-2 rounded-full ${health?.status === "healthy" ? "bg-emerald-500" : health?.status === "degraded" ? "bg-amber-500" : "bg-red-400"}`} title={health?.status || "unknown"} />
              {signedInUser?.picture ? (
                <img src={signedInUser.picture} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#e09040,#edaf60)" }}>
                  {(signedInUser?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => handleLogout()} className="hidden text-xs text-stone-500 transition hover:text-stone-700 sm:inline" title="Sign out">
                <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10.5 11.5L14 8l-3.5-3.5M5.5 8H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </header>

          {/* Content area */}
          <section className="flex-1 space-y-4 overflow-y-auto px-7 py-7 sm:px-8">

          {/* Degraded banner */}
          {health?.status === "degraded" ? (
            <div className="rounded-[14px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
              <p>Some features may be temporarily limited.</p>
              {(health?.degraded_features || []).length ? (
                <ul className="mt-2 list-disc pl-5">
                  {health.degraded_features.map((f) => <li key={f}>{labelize(f)}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}

          {/* Success banner */}
          {successMessage ? (
            <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[rgba(20,100,40,0.15)] bg-[rgba(20,100,40,0.06)] px-4 py-3 text-sm text-stone-700 backdrop-blur-sm">
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage("")} className="flex-shrink-0 text-stone-500 hover:text-stone-700">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ) : null}

          {/* Error banner */}
          {errorMessage ? (
            <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage("")} className="flex-shrink-0 text-amber-600 hover:text-amber-800">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ) : null}

          {/* Unavailable state */}
          {health?.status === "unavailable" ? (
            <Panel title="Connection issue" subtitle="We could not reach the service.">
              <EmptyState title="Unable to reach the server. Check your connection." body="Retry when your connection is stable."
                action={<button type="button" onClick={retryHealth} className={`${btnPrimary}`} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>Retry</button>} />
            </Panel>
          ) : (
            <>
              {/* Module content */}
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}>

                  {/* ── ANALYSIS ── */}
                  {activeTab === "analysis" ? (
                    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                      <Panel title="Symptom analysis" subtitle="Provide context and receive educational guidance."
                        action={
                          <button type="button" onClick={() => setForm({ symptom: "", duration: "", severity: "", age: "", gender: "", medicalHistory: "", additionalInfo: "" })} className={btnGhost}>
                            Reset form
                          </button>
                        }
                      >
                        <form onSubmit={handleAnalyze} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Symptom</label>
                            <input value={form.symptom} onChange={(e) => setForm((c) => ({ ...c, symptom: e.target.value }))} className={inputCls} placeholder="e.g. headache with nausea" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Duration</label>
                            <input value={form.duration} onChange={(e) => setForm((c) => ({ ...c, duration: e.target.value }))} className={inputCls} placeholder="e.g. 2 days" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Severity</label>
                            <select value={form.severity} onChange={(e) => setForm((c) => ({ ...c, severity: e.target.value }))} className={inputCls}>
                              <option value="">Select</option>
                              <option value="low">Low</option>
                              <option value="moderate">Moderate</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Age</label>
                            <input value={form.age} onChange={(e) => setForm((c) => ({ ...c, age: e.target.value }))} className={inputCls} placeholder="e.g. 34" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Gender</label>
                            <input value={form.gender} onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))} className={inputCls} placeholder="Optional" />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Medical history</label>
                            <textarea rows={3} value={form.medicalHistory} onChange={(e) => setForm((c) => ({ ...c, medicalHistory: e.target.value }))} className={inputCls} placeholder="Optional background information" />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Additional details</label>
                            <textarea rows={4} value={form.additionalInfo} onChange={(e) => setForm((c) => ({ ...c, additionalInfo: e.target.value }))} className={inputCls} placeholder="Any extra context" />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                            <button type="submit" disabled={loading.analysis || degraded} className={`${btnPrimary}`}
                              style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
                              {loading.analysis ? (
                                <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Analyzing...</>
                              ) : "Analyse symptom"}
                            </button>
                            <span className="text-[11px] uppercase tracking-[0.16em] text-stone-400">5 analyses included</span>
                          </div>
                        </form>
                      </Panel>

                      <Panel title="Analysis details" subtitle="Switch tabs to review each part of the result.">
                        {!analysis ? (
                          <EmptyState title="No analysis yet" body="Submit the form to see your result." />
                        ) : (
                          <div className="space-y-4">
                            <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
                              {["overview", "causes", "care", "insights"].map((tab) => (
                                <button key={tab} type="button" onClick={() => setAnalysisTab(tab)}
                                  className={`rounded-[8px] px-3 py-1.5 text-sm transition duration-200 ${analysisTab === tab
                                      ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                                      : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)] hover:text-stone-700"
                                    }`}>
                                  {labelize(tab)}
                                </button>
                              ))}
                            </div>
                            <AnimatePresence mode="wait">
                              <motion.div key={analysisTab}
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}>
                                {analysisViews[analysisTab]}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        )}
                      </Panel>
                    </div>
                  ) : null}

                  {/* ── DASHBOARD ── */}
                  {activeTab === "dashboard" ? (
                    <Panel title="Health dashboard" subtitle="Review trends and run pattern analysis by timeframe."
                      action={
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="glass inline-flex gap-0.5 rounded-[12px] p-1">
                            {PATTERN_TIMEFRAMES.map((opt) => (
                              <button key={opt} type="button" onClick={() => setPatternTimeframe(opt)}
                                className={`rounded-[8px] px-3 py-1 text-xs uppercase tracking-[0.14em] transition duration-200 ${patternTimeframe === opt
                                    ? "bg-amber-500 text-stone-50 shadow-[0_2px_8px_rgba(168,90,20,0.28)]"
                                    : "text-stone-500 hover:bg-[rgba(255,255,255,0.6)]"
                                  }`}>
                                {labelize(opt)}
                              </button>
                            ))}
                          </div>
                          <button type="button" disabled={loading.pattern || degraded}
                            onClick={() => submitTool("pattern", () => apiClient.runPatternAnalysis(patternTimeframe), (r) => { setPatternAnalysis(r); setSuccessMessage("Pattern analysis refreshed."); }, "Something went wrong. Please try again.")}
                            className={`${btnPrimary}`} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
                            {loading.pattern ? "Running..." : "Run Pattern Analysis"}
                          </button>
                        </div>
                      }
                    >
                      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="glass rounded-2xl p-4">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Health score</p>
                              <p className={`mt-1.5 font-display text-4xl ${scoreTone}`}>{dashboard?.health_score ?? "—"}</p>
                            </div>
                            <div className="glass rounded-2xl p-4">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Latest symptom</p>
                              <p className="mt-1.5 text-lg text-stone-700">{dashboard?.latest_symptom || "No data"}</p>
                            </div>
                          </div>
                          {dashboard?.symptom_trends?.length ? (
                            dashboard.symptom_trends.map((item, i) => (
                              <article key={`${item.date}-${item.symptom}-${i}`} className="glass rounded-2xl p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-display text-xl font-normal text-stone-900">{item.symptom || "Unknown symptom"}</h3>
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-700">{labelize(item.severity_label || item.severity || "low")}</span>
                                </div>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-stone-400">{formatDate(item.date)}</p>
                                <p className="mt-2 text-sm font-light leading-[1.72] text-stone-500">{item.summary || "No summary available."}</p>
                              </article>
                            ))
                          ) : (
                            <EmptyState title="No trend data" body="Run an analysis to generate dashboard trends." />
                          )}
                        </div>
                        <div className="space-y-3">
                          {[["Risk factors", dashboard?.risk_factors], ["Improvement areas", dashboard?.improvement_areas], ["Recommendations", dashboard?.ai_recommendations]].map(([title, items]) => (
                            <div key={title} className="glass rounded-2xl p-4">
                              <h3 className="font-display text-xl font-normal text-stone-900">{title}</h3>
                              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(items || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
                              </ul>
                            </div>
                          ))}
                          {patternAnalysis ? (
                            <div className="glass rounded-2xl p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-xl font-normal text-stone-900">{patternAnalysis.analysis_type || "Pattern analysis"}</h3>
                                <span className="rounded-full bg-sky-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-700">Confidence {patternAnalysis.confidence ?? "N/A"}</span>
                              </div>
                              <p className="mt-2 text-sm font-light text-stone-500">Timeframe: {labelize(patternAnalysis.timeframe || patternTimeframe)}</p>
                              <ul className="mt-3 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(patternAnalysis.patterns || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
                              </ul>
                              <h4 className="mt-3 font-display text-lg font-normal text-stone-900">Recommendations</h4>
                              <ul className="mt-2 space-y-2 text-sm font-light leading-[1.72] text-stone-500">
                                {(patternAnalysis.recommendations || []).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />{item}</li>)}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Panel>
                  ) : null}

                  {/* ── HISTORY ── */}
                  {activeTab === "history" ? (
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
                  ) : null}

                  {/* ── ASSISTANT ── */}
                  {activeTab === "assistant" ? (
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
                              <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">{item}</span>
                            ))}
                          </div>
                        ) : null}
                        {(chatResponse?.follow_up_questions || []).length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {chatResponse.follow_up_questions.map((item) => (
                              <button key={item} type="button" onClick={() => setChatMessage(item)}
                                className="glass rounded-full px-3 py-1.5 text-xs text-stone-600 transition duration-200 hover:text-amber-700">{item}</button>
                            ))}
                          </div>
                        ) : null}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!chatMessage.trim()) { setErrorMessage("Enter a question for the assistant."); return; }
                          const outgoing = chatMessage.trim();
                          submitTool("chat", () => apiClient.sendChatMessage(outgoing), (r) => { setLastChatMessage(outgoing); setChatResponse(r); setChatMessage(""); }, "Something went wrong. Please try again.");
                        }} className="mt-4 flex gap-2">
                          <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className={`${inputCls} flex-1`} placeholder="Ask a follow-up question..." />
                          <button type="submit" disabled={loading.chat || degraded}
                            className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-stone-50 transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }} aria-label="Send message">
                            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
                              <path d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </Panel>
                  ) : null}

                  {/* ── VOICE ── */}
                  {activeTab === "voice" ? (
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
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!voiceText.trim()) { setErrorMessage("Enter voice text before running analysis."); return; }
                          submitTool("voice", () => apiClient.analyzeVoiceInput({ audio_text: voiceText.trim(), confidence: Number(voiceConfidence || 0.9), language: "en" }), (r) => { setVoiceResponse(r); setSuccessMessage("Voice input analyzed."); }, "Something went wrong. Please try again.");
                        }} className="space-y-3">
                          <textarea rows={5} value={voiceText} onChange={(e) => setVoiceText(e.target.value)} className={inputCls} placeholder="Paste voice transcript..." />
                          <input value={voiceConfidence} onChange={(e) => setVoiceConfidence(e.target.value)} className={inputCls} placeholder="Confidence (e.g. 0.90)" />
                          <button type="submit" disabled={loading.voice || degraded} className={`${btnPrimary}`}
                            style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
                            {loading.voice ? "Processing..." : "Analyse Voice Input"}
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
                                      onClick={() => { setForm((c) => ({ ...c, symptom: item })); setActiveTab("analysis"); setSuccessMessage(`Added "${item}" to the analysis form.`); }}
                                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition duration-200 hover:bg-amber-100">{item}</button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </Panel>
                  ) : null}

                  {/* ── RESEARCH ── */}
                  {activeTab === "research" ? (
                    <Panel title="Research" subtitle="Search and read educational literature summaries.">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!researchQuery.trim()) { setErrorMessage("Enter a topic to search."); return; }
                        submitTool("research", () => apiClient.runRealtimeSearch(researchQuery.trim()), (r) => { setResearchResponse(r); setSuccessMessage("Search completed."); }, "Something went wrong. Please try again.");
                      }} className="flex flex-col gap-2 sm:flex-row">
                        <input value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} className={`${inputCls} flex-1`} placeholder="e.g. migraine triggers and nutrition" />
                        <button type="submit" disabled={loading.research || degraded} className={`${btnPrimary} sm:flex-shrink-0`}
                          style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>
                          {loading.research ? "Searching..." : "Search"}
                        </button>
                      </form>
                      {researchResponse !== null ? (
                        <div className="glass mt-4 rounded-[24px] p-5">
                          <h3 className="font-display text-2xl font-normal text-stone-900">{researchResponse.query || "Search result"}</h3>
                          <div className="mt-3 space-y-3">
                            {String(researchResponse.results || "").split(/\n{2,}/).filter(Boolean).map((para, i) => (
                              <p key={`${i}-${para.slice(0, 24)}`} className="text-sm font-light leading-[1.72] text-stone-500">{para}</p>
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
                  ) : null}

                </motion.div>
              </AnimatePresence>
            </>
          )}

          <footer className="mt-2 pb-20 text-center text-xs text-stone-400 md:pb-4">
            Vital provides educational guidance only and does not replace licensed medical care.
          </footer>
        </section>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-4 md:hidden">
        <div className="pointer-events-auto glass-strong relative mx-auto max-w-xl rounded-[26px] px-3 py-2">
          <div className="grid grid-cols-5 gap-1">
            {mobilePrimaryTabs.map((tab) => {
              const selected = activeTab === tab;
              return (
                <button key={tab} type="button"
                  onClick={() => { setActiveTab(tab); setMobileMoreOpen(false); }}
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
          <button type="button" onClick={() => setMobileMoreOpen((c) => !c)}
            className={`mt-2 w-full rounded-xl px-3 py-2 text-xs transition duration-200 ${mobileOverflowTabs.includes(activeTab) || mobileMoreOpen ? "text-stone-50" : "bg-stone-100 text-stone-600"}`}
            style={mobileOverflowTabs.includes(activeTab) || mobileMoreOpen ? { background: "linear-gradient(135deg,#c97022,#a85a14)" } : {}}>
            More
          </button>
          {mobileMoreOpen ? (
            <div className="mt-2 space-y-1 rounded-xl border border-stone-200 bg-stone-50 p-2">
              {mobileOverflowTabs.map((tab) => (
                <button key={tab} type="button"
                  onClick={() => { setActiveTab(tab); setMobileMoreOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-600 transition duration-200 hover:bg-stone-100 hover:text-amber-700">
                  {TAB_META[tab].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}