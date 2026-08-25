"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import { clearAuthSession, getStoredSession, updateStoredUser } from "@/lib/session";
import { Panel, EmptyState, btnPrimary } from "@/components/ui/primitives";
import { EMPTY_FORM, isAuthFailure, labelize } from "@/lib/format";
import Sidebar from "./workspace/sidebar";
import Topbar from "./workspace/topbar";
import MobileNav from "./workspace/mobile-nav";
import AnalysisTab from "./workspace/tabs/analysis-tab";
import DashboardTab from "./workspace/tabs/dashboard-tab";
import HistoryTab from "./workspace/tabs/history-tab";
import AssistantTab from "./workspace/tabs/assistant-tab";
import VoiceTab from "./workspace/tabs/voice-tab";
import ResearchTab from "./workspace/tabs/research-tab";

const DEFAULT_CREDITS = 5;
const INITIAL_LOADING = { app: false, analysis: false, chat: false, voice: false, research: false, pattern: false };

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
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState({ ...INITIAL_LOADING });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [patternTimeframe, setPatternTimeframe] = useState("month");
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
        if (!cancelled) setHealth({ status: "unavailable", database_available: false, database_error: "Unable to reach the backend service." });
      }
      if (!cancelled && !getStoredSession()?.token) { router.replace("/login"); return; }
      if (!cancelled && authSession?.token) await refreshProtectedData(authSession.token, cancelled);
    }
    initialize();
    return () => { cancelled = true; };
  }, [authSession?.token, router]);

  function clearFeedback() { setErrorMessage(""); setSuccessMessage(""); }
  function setBusy(key, value) { setLoading((current) => ({ ...current, [key]: value })); }
  function updateStoredProfile(user) {
    updateStoredUser(user);
    setAuthSessionState((current) => current ? { ...current, user: user || current.user } : current);
  }
  function markServiceHealth(status, message) {
    setHealth((current) => ({ ...(current || {}), status, database_available: false, database_error: message || current?.database_error, degraded_features: current?.degraded_features || [] }));
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
      setHealth((current) => current ? { ...current, status: "healthy", database_available: true, database_error: null } : current);
    } catch (error) {
      if (!cancelled) handleProtectedError(error, "Failed to refresh your account data.", "Some features may be temporarily limited.");
    } finally {
      if (!cancelled) setBusy("app", false);
    }
  }
  async function submitTool(key, action, onSuccess, fallback) {
    clearFeedback(); setBusy(key, true);
    try { const result = await action(); onSuccess(result); }
    catch (error) { handleProtectedError(error, fallback); }
    finally { setBusy(key, false); }
  }
  async function retryHealth() {
    clearFeedback(); setBusy("app", true);
    try {
      const payload = await apiClient.getHealth();
      setHealth(payload);
      await refreshProtectedData();
    } catch (error) {
      markServiceHealth("unavailable", error?.message || "Unable to reach the backend service.");
      setErrorMessage("Unable to reach the server. Check your connection.");
    } finally { setBusy("app", false); }
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

  /* ── No session ── */
  if (!authSession?.token) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <Panel title="Sign-in required" subtitle="Your workspace is linked to your account."
          action={<button type="button" onClick={() => router.push("/login")} className={btnPrimary} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>Go to login</button>}>
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

      <Sidebar activeTab={activeTab} onSelect={setActiveTab} user={signedInUser} creditsRemaining={creditsRemaining} />

      {/* ── Main content column ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        <Topbar activeTab={activeTab} creditsRemaining={creditsRemaining}
          healthStatus={health?.status} user={signedInUser} onLogout={() => handleLogout()} />

        {/* Content area */}
        <section className="flex-1 space-y-4 overflow-y-auto px-7 py-7 sm:px-8">

          {/* Degraded banner */}
          {health?.status === "degraded" ? (
            <div className="rounded-[14px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800 backdrop-blur-sm">
              <p>Some features may be temporarily limited.</p>
              {(health?.degraded_features || []).length ? (
                <ul className="mt-2 list-disc pl-5">
                  {health.degraded_features.map((feature) => <li key={feature}>{labelize(feature)}</li>)}
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
                action={<button type="button" onClick={retryHealth} className={btnPrimary} style={{ background: "linear-gradient(135deg,#c97022,#a85a14)" }}>Retry</button>} />
            </Panel>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}>

                {activeTab === "analysis" ? (
                  <AnalysisTab form={form} setForm={setForm} onSubmit={handleAnalyze}
                    busy={loading.analysis} degraded={degraded} analysis={analysis}
                    analysisTab={analysisTab} onAnalysisTabChange={setAnalysisTab} />
                ) : null}

                {activeTab === "dashboard" ? (
                  <DashboardTab dashboard={dashboard} scoreTone={scoreTone}
                    patternAnalysis={patternAnalysis} patternTimeframe={patternTimeframe}
                    onPatternTimeframeChange={setPatternTimeframe}
                    onRunPattern={() => submitTool("pattern", () => apiClient.runPatternAnalysis(patternTimeframe), (result) => { setPatternAnalysis(result); setSuccessMessage("Pattern analysis refreshed."); }, "Something went wrong. Please try again.")}
                    patternBusy={loading.pattern} degraded={degraded} />
                ) : null}

                {activeTab === "history" ? (
                  <HistoryTab history={history} />
                ) : null}

                {activeTab === "assistant" ? (
                  <AssistantTab chatResponse={chatResponse} lastChatMessage={lastChatMessage}
                    chatBusy={loading.chat} degraded={degraded}
                    chatMessage={chatMessage} onChatMessageChange={setChatMessage}
                    onSubmitChat={(event) => {
                      event.preventDefault();
                      if (!chatMessage.trim()) { setErrorMessage("Enter a question for the assistant."); return; }
                      const outgoing = chatMessage.trim();
                      submitTool("chat", () => apiClient.sendChatMessage(outgoing), (result) => { setLastChatMessage(outgoing); setChatResponse(result); setChatMessage(""); }, "Something went wrong. Please try again.");
                    }} />
                ) : null}

                {activeTab === "voice" ? (
                  <VoiceTab voiceText={voiceText} onVoiceTextChange={setVoiceText}
                    voiceConfidence={voiceConfidence} onVoiceConfidenceChange={setVoiceConfidence}
                    voiceBusy={loading.voice} degraded={degraded}
                    onSubmitVoice={(event) => {
                      event.preventDefault();
                      if (!voiceText.trim()) { setErrorMessage("Enter voice text before running analysis."); return; }
                      submitTool("voice", () => apiClient.analyzeVoiceInput({ audio_text: voiceText.trim(), confidence: Number(voiceConfidence || 0.9), language: "en" }), (result) => { setVoiceResponse(result); setSuccessMessage("Voice input analyzed."); }, "Something went wrong. Please try again.");
                    }}
                    voiceResponse={voiceResponse}
                    onUseDetectedSymptom={(symptom) => {
                      setForm((current) => ({ ...current, symptom }));
                      setActiveTab("analysis");
                      setSuccessMessage(`Added "${symptom}" to the analysis form.`);
                    }} />
                ) : null}

                {activeTab === "research" ? (
                  <ResearchTab researchQuery={researchQuery} onResearchQueryChange={setResearchQuery}
                    researchBusy={loading.research} degraded={degraded}
                    onSubmitResearch={(event) => {
                      event.preventDefault();
                      if (!researchQuery.trim()) { setErrorMessage("Enter a topic to search."); return; }
                      submitTool("research", () => apiClient.runRealtimeSearch(researchQuery.trim()), (result) => { setResearchResponse(result); setSuccessMessage("Search completed."); }, "Something went wrong. Please try again.");
                    }}
                    researchResponse={researchResponse} />
                ) : null}

              </motion.div>
            </AnimatePresence>
          )}

          <footer className="mt-2 pb-20 text-center text-xs text-stone-400 md:pb-4">
            Vital provides educational guidance only and does not replace licensed medical care.
          </footer>
        </section>
      </div>

      <MobileNav activeTab={activeTab} onSelect={setActiveTab} />
    </main>
  );
}
