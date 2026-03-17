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

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="glass-panel rounded-[32px] border border-white/80 bg-white/84 p-6 shadow-halo">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
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
    }));
  }

  function handleLogout(message = "Signed out successfully.") {
    clearAuthSession();
    apiClient.clearToken();
    setAuthSessionState(null);
    setSuccessMessage(message);
    router.replace("/login");
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
      setErrorMessage("The backend service could not be reached.");
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
          "Protected account data is temporarily unavailable while the backend recovers."
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

  async function handleAnalyze(event) {
    event.preventDefault();
    clearFeedback();

    if (!form.symptom.trim()) {
      setErrorMessage("Please enter a symptom to analyze.");
      return;
    }

    if (creditsRemaining <= 0) {
      setErrorMessage(
        `This account has already used all ${creditsTotal} analysis credits.`
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
      setSuccessMessage("Symptom analysis completed. One credit was used.");
      await refreshProtectedData();
    } catch (error) {
      handleProtectedError(error, "Failed to analyze the symptom.");
    } finally {
      setBusy("analysis", false);
    }
  }

  const analysisViews = {
    overview: (
      <div className="space-y-4">
        <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <h3 className="text-lg font-bold text-slate-950">Summary</h3>
          <p className="mt-3">{analysis?.symptom_analysis}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] bg-rose-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">Red flags</h3>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
              {(analysis?.red_flags || []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] bg-emerald-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">Tips</h3>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
              {(analysis?.personalized_tips || []).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ),
    causes: (
      <div className="space-y-4">
        {(analysis?.possible_causes || []).map((cause) => (
          <div
            key={`${cause.condition}-${cause.probability}`}
            className="rounded-[24px] border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-bold text-slate-950">
                {cause.condition}
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {cause.probability}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {cause.description}
            </p>
          </div>
        ))}
      </div>
    ),
    care: (
      <div className="grid gap-4 md:grid-cols-2 text-sm leading-7 text-slate-600">
        <div className="rounded-[24px] bg-emerald-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">Diet plan</h3>
          <p className="mt-4">
            <strong>Consume:</strong>{" "}
            {(analysis?.diet_plan?.foods_to_consume || []).join(", ") || "—"}
          </p>
          <p>
            <strong>Avoid:</strong>{" "}
            {(analysis?.diet_plan?.foods_to_avoid || []).join(", ") || "—"}
          </p>
          <p>
            <strong>Focus:</strong>{" "}
            {(analysis?.diet_plan?.nutritional_focus || []).join(", ") || "—"}
          </p>
        </div>
        <div className="rounded-[24px] bg-amber-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">Lifestyle</h3>
          <ul className="mt-4 space-y-2">
            {(analysis?.lifestyle_suggestions || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
    insights: (
      <div className="rounded-[24px] bg-sky-50 p-5">
        <h3 className="text-lg font-bold text-slate-950">Risk assessment</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(analysis?.risk_assessment || {}).map(([key, value]) => (
            <div
              key={key}
              className="rounded-[18px] bg-white/80 p-4 text-sm leading-7 text-slate-600"
            >
              <strong>{labelize(key)}:</strong> {String(value)}
            </div>
          ))}
        </div>
      </div>
    ),
  };

  if (!authSession?.token) {
    return (
      <main className="section-shell py-12">
        <Panel
          title="Google sign-in required"
          subtitle="The application workspace depends on protected account context."
          action={
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Go to login
            </button>
          }
        >
          <EmptyState
            title="Sign in to open the workspace"
            body="Credits, history, dashboard summaries, assistant context, voice tools, and research are tied to your account."
          />
        </Panel>
      </main>
    );
  }

  return (
    <main className="section-shell py-6 sm:py-8 lg:py-10">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-white/88 px-6 py-7 shadow-halo sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(253,224,71,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,249,255,0.92))]" />
          <div className="relative space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">SH</span>
                  Smart Health Advisor AI
                </Link>
                <h1 className="mt-5 max-w-3xl font-display text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
                  Health guidance that looks and behaves like a real SaaS product.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 sm:text-[15px]">
                  Structured symptom analysis, protected history, dashboard summaries,
                  follow-up guidance, voice helpers, and PubMed-backed research in one
                  calmer workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => refreshProtectedData()} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  {loading.app ? "Refreshing..." : "Refresh workspace"}
                </button>
                <button type="button" onClick={() => handleLogout()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                  Sign out
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="surface-muted p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Signed in account
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {(signedInUser?.name || "U").slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-950">
                      {signedInUser?.name || "Authenticated user"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {signedInUser?.email || "No email available"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="surface-muted p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Active product surfaces
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {tabs.map((tab) => (
                    <span
                      key={tab}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
                    >
                      {labelize(tab)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-[0.26em] text-sky-700">Backend status</div><div className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{health?.status === "healthy" ? "Ready" : "Degraded"}</div><p className="mt-3 text-sm leading-6 text-slate-500">{health?.database_error || "Protected services available."}</p></div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-700">Credits left</div><div className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{creditsRemaining}</div><p className="mt-3 text-sm leading-6 text-slate-500">{creditsTotal - creditsRemaining} used out of {creditsTotal}</p></div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700">Stored analyses</div><div className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{history.length}</div><p className="mt-3 text-sm leading-6 text-slate-500">Your timeline grows as you complete symptom reports.</p></div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-sm"><div className={`text-xs font-bold uppercase tracking-[0.26em] ${scoreTone}`}>Health score</div><div className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">{dashboard?.health_score ?? "—"}</div><p className="mt-3 text-sm leading-6 text-slate-500">Educational only, based on recent patterns.</p></div>
            </div>
          </div>
        </section>

        {degraded ? <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">The backend is in a degraded state. Protected features may fail until the database reconnects.</div> : null}
        {successMessage ? <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">{successMessage}</div> : null}
        {errorMessage ? <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-800">{errorMessage}</div> : null}

        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"}`}>
              {labelize(tab)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {activeTab === "analysis" ? (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Panel title="Symptom analysis" subtitle="Capture structured inputs so the backend can return a richer educational report than a generic chatbot response." action={<button type="button" onClick={() => setForm({ symptom: "", duration: "", severity: "", age: "", gender: "", medicalHistory: "", additionalInfo: "" })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Reset form</button>}>
                  <form onSubmit={handleAnalyze} className="grid gap-5 md:grid-cols-2">
                    <input value={form.symptom} onChange={(event) => setForm((current) => ({ ...current, symptom: event.target.value }))} placeholder="Symptom" className="md:col-span-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <input value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} placeholder="Duration" className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))} className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300"><option value="">Severity</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select>
                    <input value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} placeholder="Age" className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <input value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} placeholder="Gender" className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <textarea value={form.medicalHistory} onChange={(event) => setForm((current) => ({ ...current, medicalHistory: event.target.value }))} rows={3} placeholder="Medical history" className="md:col-span-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <textarea value={form.additionalInfo} onChange={(event) => setForm((current) => ({ ...current, additionalInfo: event.target.value }))} rows={4} placeholder="Additional context" className="md:col-span-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" />
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3"><button type="submit" disabled={loading.analysis || degraded} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading.analysis ? "Analyzing..." : "Run analysis"}</button><span className="text-sm text-slate-500">Each completed analysis consumes one credit.</span></div>
                  </form>
                </Panel>
                <Panel title="Analysis result" subtitle="This mirrors the current backend behavior and stays framed as educational guidance.">
                  {!analysis ? <EmptyState title="No analysis yet" body="Submit a symptom on the left to generate a structured report and add it to your stored history." /> : <div className="space-y-5"><div className="flex flex-wrap gap-3">{["overview", "causes", "care", "insights"].map((tab) => <button key={tab} type="button" onClick={() => setAnalysisTab(tab)} className={`rounded-full px-4 py-2 text-sm font-semibold ${analysisTab === tab ? "bg-sky-100 text-sky-900" : "border border-slate-200 bg-white text-slate-500"}`}>{labelize(tab)}</button>)}</div>{analysisViews[analysisTab]}</div>}
                </Panel>
              </div>
            ) : null}

            {activeTab === "dashboard" ? <Panel title="Health dashboard" subtitle="Summary views derived from your stored analyses and recent symptom activity." action={<button type="button" onClick={() => submitTool("pattern", () => apiClient.runPatternAnalysis("month"), (response) => { setPatternAnalysis(response); setSuccessMessage("Pattern analysis refreshed."); }, "Failed to generate pattern analysis.")} disabled={loading.pattern || degraded} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading.pattern ? "Analyzing..." : "Run pattern analysis"}</button>}><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><div className="space-y-4">{dashboard?.symptom_trends?.length ? dashboard.symptom_trends.map((item, index) => <div key={`${item.date}-${item.symptom}-${index}`} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-slate-950">{item.symptom || "Unknown symptom"}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{item.severity_label || item.severity || "Unknown"}</span></div><p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(item.date)}</p><p className="mt-3 text-sm leading-7 text-slate-600">{item.summary || "No summary available."}</p></div>) : <EmptyState title="No dashboard timeline yet" body="Complete an analysis first so the backend has data to summarize." />}</div><div className="space-y-4">{[["Risk factors", dashboard?.risk_factors, "bg-amber-50"], ["Improvement areas", dashboard?.improvement_areas, "bg-sky-50"], ["AI recommendations", dashboard?.ai_recommendations, "bg-emerald-50"]].map(([title, items, color]) => <div key={title} className={`rounded-[24px] p-5 ${color}`}><h3 className="text-lg font-bold text-slate-950">{title}</h3><ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">{(items || []).map((item) => <li key={item}>• {item}</li>)}</ul></div>)}{patternAnalysis ? <div className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold text-slate-950">{patternAnalysis.analysis_type}</h3><p className="mt-2 text-sm leading-7 text-slate-600">Generated {formatDate(patternAnalysis.timestamp)} for the {patternAnalysis.timeframe} timeframe.</p></div> : null}</div></div></Panel> : null}

            {activeTab === "history" ? <Panel title="Analysis history" subtitle="Every completed symptom analysis is stored against your authenticated account.">{history.length ? <div className="grid gap-4 xl:grid-cols-2">{history.map((item) => <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-slate-950">{item.symptom || "Unknown symptom"}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{item.severity || "No severity"}</span></div><p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(item.created_at)}</p></article>)}</div> : <EmptyState title="No stored analyses yet" body="Run your first symptom analysis to start building a protected health history." />}</Panel> : null}

            {activeTab === "assistant" ? <Panel title="AI health assistant" subtitle="Ask follow-up questions based on the backend’s recent account context."><div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]"><form onSubmit={(event) => { event.preventDefault(); if (!chatMessage.trim()) { setErrorMessage("Enter a question for the AI assistant."); return; } submitTool("chat", () => apiClient.sendChatMessage(chatMessage.trim()), (response) => { setChatResponse(response); setSuccessMessage("Assistant response generated successfully."); }, "Failed to get a chat response."); }} className="space-y-5"><textarea value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} rows={8} placeholder="Ask about symptoms, warning signs, lifestyle support, or next steps" className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" /><button type="submit" disabled={loading.chat || degraded} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading.chat ? "Sending..." : "Ask assistant"}</button></form>{!chatResponse ? <EmptyState title="No assistant response yet" body="Ask a follow-up question and the backend will reply using the authenticated product context." /> : <div className="rounded-[24px] bg-slate-50 p-5"><h3 className="text-lg font-bold text-slate-950">Response</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{chatResponse.response}</p></div>}</div></Panel> : null}

            {activeTab === "voice" ? <Panel title="Voice symptom tools" subtitle="Paste recognized transcript text to detect likely symptom categories."><div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]"><form onSubmit={(event) => { event.preventDefault(); if (!voiceText.trim()) { setErrorMessage("Enter a transcript before running voice analysis."); return; } submitTool("voice", () => apiClient.analyzeVoiceInput({ audio_text: voiceText.trim(), confidence: Number(voiceConfidence || 0.9), language: "en" }), (response) => { setVoiceResponse(response); setSuccessMessage("Voice transcript processed successfully."); }, "Failed to process the voice transcript."); }} className="space-y-5"><textarea value={voiceText} onChange={(event) => setVoiceText(event.target.value)} rows={7} placeholder="Example: I have had a headache and feel nauseous since yesterday" className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" /><input value={voiceConfidence} onChange={(event) => setVoiceConfidence(event.target.value)} placeholder="0.90" className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" /><button type="submit" disabled={loading.voice || degraded} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading.voice ? "Processing..." : "Analyze transcript"}</button></form>{!voiceResponse ? <EmptyState title="No transcript analysis yet" body="Paste transcript text to detect likely symptom categories." /> : <div className="space-y-4"><div className="rounded-[24px] bg-slate-50 p-5"><h3 className="text-lg font-bold text-slate-950">Voice response</h3><p className="mt-3 text-sm leading-7 text-slate-600">{voiceResponse.response}</p></div>{(voiceResponse.detected_symptoms || []).length ? <div className="rounded-[24px] bg-emerald-50 p-5"><h3 className="text-lg font-bold text-slate-950">Detected symptoms</h3><div className="mt-4 flex flex-wrap gap-3">{voiceResponse.detected_symptoms.map((item) => <button key={item} type="button" onClick={() => { setForm((current) => ({ ...current, symptom: item })); setActiveTab("analysis"); setSuccessMessage(`Inserted detected symptom "${item}" into the analysis form.`); }} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">Use "{item}" in analysis</button>)}</div></div> : null}</div>}</div></Panel> : null}

            {activeTab === "research" ? <Panel title="Research and literature search" subtitle="Run a PubMed-backed search for a symptom or topic without leaving the product."><div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]"><form onSubmit={(event) => { event.preventDefault(); if (!researchQuery.trim()) { setErrorMessage("Enter a search topic for PubMed research."); return; } submitTool("research", () => apiClient.runRealtimeSearch(researchQuery.trim()), (response) => { setResearchResponse(response); setSuccessMessage("PubMed search completed successfully."); }, "Failed to run the literature search."); }} className="space-y-5"><input value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} placeholder="e.g. migraine nutrition, fatigue causes, nausea management" className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300" /><button type="submit" disabled={loading.research || degraded} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading.research ? "Searching..." : "Search PubMed"}</button></form>{!researchResponse ? <EmptyState title="No research search yet" body="Search a topic here to get the current backend’s PubMed-backed digest." /> : <div className="rounded-[24px] bg-slate-50 p-5"><h3 className="text-lg font-bold text-slate-950">Search result</h3><p className="mt-3 text-sm leading-7 text-slate-600">Query: <strong>{researchResponse.query}</strong></p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{researchResponse.results}</p>{researchResponse.pubmed_url ? <a href={researchResponse.pubmed_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700">Open full PubMed search</a> : null}</div>}</div></Panel> : null}
          </motion.div>
        </AnimatePresence>

        <footer className="rounded-[28px] border border-white/80 bg-white/80 px-6 py-5 text-sm leading-7 text-slate-500 shadow-sm">
          This application provides educational guidance only. It does not diagnose, treat, or replace licensed medical care. Seek urgent professional care immediately for severe or rapidly worsening symptoms.
        </footer>
      </div>
    </main>
  );
}
