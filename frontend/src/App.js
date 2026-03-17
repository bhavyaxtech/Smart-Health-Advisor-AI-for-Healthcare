import React, { useEffect, useState } from "react";
import "./App.css";
import apiClient from "./services/api";
import {
  clearAuthSession,
  getStoredSession,
  setAuthSession,
  updateStoredUser,
} from "./utils/session";

const DEFAULT_CREDITS = 5;
const GOOGLE_CLIENT_ID = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function toLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUrgencyTone(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return "high";
  }

  if (normalized.includes("medium") || normalized.includes("prompt")) {
    return "medium";
  }

  return "low";
}

function isAuthFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.status === 401 || message.includes("token");
}

function isServiceDegradedError(error) {
  return error?.status === 503;
}

function isNetworkFailure(error) {
  return error?.status === 0;
}

function getGoogleCredential(clientId) {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(
        new Error(
          "Google sign-in is not configured. Set REACT_APP_GOOGLE_CLIENT_ID first.",
        ),
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      reject(
        new Error(
          "Google sign-in library is not loaded yet. Please try again in a moment.",
        ),
      );
      return;
    }

    let settled = false;

    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };

    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);

    const timeoutId = window.setTimeout(() => {
      rejectOnce(new Error("Google sign-in timed out. Please try again."));
    }, 60000);

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        window.clearTimeout(timeoutId);

        if (!response?.credential) {
          rejectOnce(new Error("Google sign-in did not return a credential."));
          return;
        }

        resolveOnce(response.credential);
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (settled) return;

      const notDisplayed =
        typeof notification?.isNotDisplayed === "function" &&
        notification.isNotDisplayed();
      const skipped =
        typeof notification?.isSkippedMoment === "function" &&
        notification.isSkippedMoment();
      const dismissed =
        typeof notification?.isDismissedMoment === "function" &&
        notification.isDismissedMoment();

      if (notDisplayed || skipped || dismissed) {
        window.clearTimeout(timeoutId);
        rejectOnce(
          new Error(
            "Google sign-in could not be completed from the browser prompt.",
          ),
        );
      }
    });
  });
}

function StatCard({ label, value, helper, tone = "blue" }) {
  return (
    <div className={`panel stat-card stat-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {helper ? <div className="stat-helper">{helper}</div> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="panel section-card">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function MessageBanner({ type = "info", children }) {
  return <div className={`message-banner message-${type}`}>{children}</div>;
}

function TabButton({ id, activeTab, onClick, children }) {
  const isActive = id === activeTab;

  return (
    <button
      type="button"
      className={`tab-button ${isActive ? "active" : ""}`}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
  );
}

function ResultTabButton({ id, activeTab, onClick, children }) {
  const isActive = id === activeTab;

  return (
    <button
      type="button"
      className={`result-tab-button ${isActive ? "active" : ""}`}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
  );
}

function App() {
  const [authSession, setAuthSessionState] = useState(() => getStoredSession());
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [patternAnalysis, setPatternAnalysis] = useState(null);

  const [symptom, setSymptom] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [analysisTab, setAnalysisTab] = useState("overview");
  const [activeTab, setActiveTab] = useState("analysis");
  const [showEnhancedForm, setShowEnhancedForm] = useState(true);

  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState(null);

  const [voiceText, setVoiceText] = useState("");
  const [voiceConfidence, setVoiceConfidence] = useState("0.90");
  const [voiceResponse, setVoiceResponse] = useState(null);

  const [researchQuery, setResearchQuery] = useState("");
  const [researchResponse, setResearchResponse] = useState(null);

  const [appLoading, setAppLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [patternLoading, setPatternLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const signedInUser = me || authSession?.user || null;
  const isAuthenticated = Boolean(authSession?.token);
  const creditsTotal = credits?.credits_total ?? DEFAULT_CREDITS;
  const creditsRemaining =
    credits?.credits_remaining ?? signedInUser?.credits_remaining ?? 0;
  const creditsUsed =
    credits?.credits_used ?? Math.max(creditsTotal - creditsRemaining, 0);
  const isServiceDegraded =
    health?.status === "degraded" ||
    health?.status === "unavailable" ||
    health?.database_available === false;
  const healthStatusLabel =
    health?.status === "healthy"
      ? "Ready"
      : health?.status === "degraded"
        ? "Degraded"
        : "Offline";

  useEffect(() => {
    apiClient.setToken(authSession?.token || null);
  }, [authSession]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const healthPayload = await apiClient.getHealth();
        if (!cancelled) {
          setHealth(healthPayload);
        }
      } catch {
        if (!cancelled) {
          setHealth({
            status: "unavailable",
            database_available: false,
            database_error: "Unable to reach the backend service.",
            google_auth_enabled: Boolean(GOOGLE_CLIENT_ID),
            pubmed_enabled: false,
          });
        }
      }

      if (authSession?.token) {
        await refreshProtectedData(authSession.token, cancelled);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  function clearFeedback() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleLogout(message = "Signed out successfully.") {
    clearAuthSession();
    apiClient.clearToken();
    setAuthSessionState(null);
    setMe(null);
    setCredits(null);
    setHistory([]);
    setDashboard(null);
    setPatternAnalysis(null);
    setAnalysis(null);
    setChatResponse(null);
    setVoiceResponse(null);
    setResearchResponse(null);
    setChatMessage("");
    setVoiceText("");
    setResearchQuery("");
    setActiveTab("analysis");
    setAnalysisTab("overview");
    setErrorMessage("");
    setSuccessMessage(message || "");
  }

  function updateStoredProfile(user) {
    updateStoredUser(user);
    setAuthSessionState((current) =>
      current ? { ...current, user: user || current.user } : current,
    );
  }

  function markServiceHealth(status, message) {
    setHealth((current) => ({
      ...(current || {}),
      status,
      database_available: false,
      database_error:
        message || current?.database_error || "Backend service is unavailable.",
      google_auth_enabled:
        current?.google_auth_enabled ?? Boolean(GOOGLE_CLIENT_ID),
      pubmed_enabled: current?.pubmed_enabled ?? false,
    }));
  }

  function handleProtectedApiError(
    error,
    fallbackMessage,
    serviceMessage = fallbackMessage,
  ) {
    const message = error?.message || fallbackMessage;

    if (isAuthFailure(error)) {
      handleLogout("");
      setErrorMessage("Your session expired or could not be verified.");
      return;
    }

    if (isServiceDegradedError(error)) {
      markServiceHealth("degraded", message);
      setErrorMessage(serviceMessage);
      return;
    }

    if (isNetworkFailure(error)) {
      markServiceHealth("unavailable", message);
      setErrorMessage(
        "The backend service could not be reached. Please try again shortly.",
      );
      return;
    }

    setErrorMessage(message);
  }

  async function refreshProtectedData(tokenOverride = null, cancelled = false) {
    const token = tokenOverride || authSession?.token;
    if (!token) return;

    apiClient.setToken(token);
    setAppLoading(true);

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
      setHealth((current) =>
        current
          ? {
              ...current,
              status: "healthy",
              database_available: true,
              database_error: null,
            }
          : current,
      );

      if (mePayload?.user_id) {
        const dashboardPayload = await apiClient.getDashboard(
          mePayload.user_id,
        );
        if (!cancelled) {
          setDashboard(dashboardPayload);
        }
      } else if (!cancelled) {
        setDashboard(null);
      }
    } catch (error) {
      if (cancelled) return;
      handleProtectedApiError(
        error,
        "Failed to refresh your account data.",
        "Protected account data is temporarily unavailable. Please try again shortly.",
      );
    } finally {
      if (!cancelled) {
        setAppLoading(false);
      }
    }
  }

  async function handleGoogleLogin() {
    clearFeedback();
    setAuthLoading(true);

    try {
      const idToken = await getGoogleCredential(GOOGLE_CLIENT_ID);
      const authPayload = await apiClient.authenticateWithGoogle(idToken);
      const session = setAuthSession(authPayload);

      apiClient.setToken(session.token);
      setAuthSessionState(session);
      setSuccessMessage("Signed in successfully with Google.");

      await refreshProtectedData(session.token);
    } catch (error) {
      if (isServiceDegradedError(error)) {
        markServiceHealth("degraded", error?.message);
      } else if (isNetworkFailure(error)) {
        markServiceHealth("unavailable", error?.message);
      }
      setErrorMessage(error?.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function resetAnalysisForm() {
    setSymptom("");
    setDuration("");
    setSeverity("");
    setAdditionalInfo("");
    setAge("");
    setGender("");
    setMedicalHistory("");
    setAnalysis(null);
    setAnalysisTab("overview");
    clearFeedback();
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    clearFeedback();

    if (!isAuthenticated) {
      setErrorMessage("Sign in with Google before requesting an analysis.");
      return;
    }

    if (!symptom.trim()) {
      setErrorMessage("Please enter a symptom to analyze.");
      return;
    }

    if (creditsRemaining <= 0) {
      setErrorMessage(
        `This account has already used all ${creditsTotal} available analysis credits.`,
      );
      return;
    }

    setAnalysisLoading(true);

    try {
      const payload = {
        symptom: symptom.trim(),
        duration: duration.trim(),
        severity: severity.trim(),
        additional_info: additionalInfo.trim(),
        gender: gender.trim(),
        medical_history: medicalHistory.trim(),
      };

      if (age) {
        payload.age = Number(age);
      }

      const response = await apiClient.analyzeSymptom(payload);
      setAnalysis(response);
      setAnalysisTab("overview");
      setActiveTab("analysis");
      setSuccessMessage("Symptom analysis completed. One credit was used.");
      await refreshProtectedData();
    } catch (error) {
      handleProtectedApiError(
        error,
        "Failed to analyze the symptom.",
        "Symptom analysis is temporarily unavailable while the backend is degraded.",
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    clearFeedback();

    if (!isAuthenticated) {
      setErrorMessage("Sign in with Google before using the assistant.");
      return;
    }

    if (!chatMessage.trim()) {
      setErrorMessage("Enter a question for the AI assistant.");
      return;
    }

    setChatLoading(true);

    try {
      const response = await apiClient.sendChatMessage(chatMessage.trim());
      setChatResponse(response);
    } catch (error) {
      handleProtectedApiError(
        error,
        "Failed to get a chat response.",
        "The assistant is temporarily unavailable while protected services recover.",
      );
    } finally {
      setChatLoading(false);
    }
  }

  async function handleVoiceSubmit(event) {
    event.preventDefault();
    clearFeedback();

    if (!isAuthenticated) {
      setErrorMessage("Sign in with Google before using voice tools.");
      return;
    }

    if (!voiceText.trim()) {
      setErrorMessage("Enter a transcript before running voice analysis.");
      return;
    }

    setVoiceLoading(true);

    try {
      const response = await apiClient.analyzeVoiceInput({
        audio_text: voiceText.trim(),
        confidence: Number(voiceConfidence || 0.9),
        language: "en",
      });
      setVoiceResponse(response);
    } catch (error) {
      handleProtectedApiError(
        error,
        "Failed to process the voice transcript.",
        "Voice tools are temporarily unavailable while protected services recover.",
      );
    } finally {
      setVoiceLoading(false);
    }
  }

  async function handleResearchSubmit(event) {
    event.preventDefault();
    clearFeedback();

    if (!isAuthenticated) {
      setErrorMessage("Sign in with Google before running literature search.");
      return;
    }

    if (!researchQuery.trim()) {
      setErrorMessage("Enter a search topic for PubMed research.");
      return;
    }

    setResearchLoading(true);

    try {
      const response = await apiClient.runRealtimeSearch(researchQuery.trim());
      setResearchResponse(response);
      setSuccessMessage("PubMed search completed successfully.");
    } catch (error) {
      handleProtectedApiError(
        error,
        "Failed to run the literature search.",
        "Research search is temporarily unavailable while protected services recover.",
      );
    } finally {
      setResearchLoading(false);
    }
  }

  async function handlePatternAnalysis() {
    clearFeedback();

    if (!isAuthenticated) {
      setErrorMessage(
        "Sign in with Google before requesting pattern analysis.",
      );
      return;
    }

    setPatternLoading(true);

    try {
      const response = await apiClient.runPatternAnalysis("month");
      setPatternAnalysis(response);
    } catch (error) {
      handleProtectedApiError(
        error,
        "Failed to generate pattern analysis.",
        "Pattern analysis is temporarily unavailable while protected services recover.",
      );
    } finally {
      setPatternLoading(false);
    }
  }

  function renderAuthRequired(message) {
    return (
      <SectionCard
        title="Google sign-in required"
        subtitle="This product only supports Google-authenticated usage."
      >
        <p className="section-subtitle">{message}</p>
        <div className="button-row">
          <button
            type="button"
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={authLoading}
          >
            {authLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </div>
        {!GOOGLE_CLIENT_ID ? (
          <MessageBanner type="warning">
            Missing{" "}
            <span className="code-like">REACT_APP_GOOGLE_CLIENT_ID</span> in the
            frontend environment.
          </MessageBanner>
        ) : null}
      </SectionCard>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-wrap">
            <div className="brand-badge">AI</div>
            <div className="brand-copy">
              <h1>Smart Health Advisor AI</h1>
              <p>
                Google-authenticated symptom guidance, history, dashboard, and
                PubMed research
              </p>
            </div>
          </div>

          <div className="header-actions">
            {signedInUser ? (
              <div className="user-chip">
                {signedInUser.picture ? (
                  <img
                    src={signedInUser.picture}
                    alt={signedInUser.name || "User"}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {String(signedInUser.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="user-chip-meta">
                  <span className="user-chip-name">
                    {signedInUser.name || "Google user"}
                  </span>
                  <span className="user-chip-email">
                    {signedInUser.email || "Authenticated account"}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-google"
                onClick={handleGoogleLogin}
                disabled={authLoading}
              >
                {authLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>
            )}

            {signedInUser ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleLogout()}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="main-layout">
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <h2>
                From symptom entry to personalized educational guidance in one
                secured workflow
              </h2>
              <p>
                The system combines Google-only authentication, a strict
                lifetime credit model, structured health heuristics,
                PubMed-backed research, and persistent symptom history tracking
                for each account.
              </p>
              <div className="hero-pills">
                <div className="hero-pill">Google auth only</div>
                <div className="hero-pill">
                  {creditsTotal} total analysis credits
                </div>
                <div className="hero-pill">PubMed literature search</div>
                <div className="hero-pill">History and dashboard insights</div>
              </div>
            </div>

            <div className="credit-summary-card">
              <div>
                <h3>Account status</h3>
                <p>
                  {isAuthenticated
                    ? "You are signed in and can access protected tools from your personal workspace."
                    : "Sign in with Google to unlock analysis, history, dashboard, chat, voice tools, and research search."}
                </p>
              </div>
              <div className="credit-metrics">
                <div className="credit-metric">
                  <span className="credit-metric-label">Auth</span>
                  <span className="credit-metric-value">
                    {isAuthenticated ? "On" : "Off"}
                  </span>
                </div>
                <div className="credit-metric">
                  <span className="credit-metric-label">Credits</span>
                  <span className="credit-metric-value">
                    {creditsRemaining}
                  </span>
                </div>
                <div className="credit-metric">
                  <span className="credit-metric-label">Health API</span>
                  <span className="credit-metric-value">
                    {healthStatusLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isServiceDegraded ? (
          <MessageBanner type="warning">
            {health?.database_error ||
              "Protected backend features are temporarily degraded. Retry after the service reconnects."}
          </MessageBanner>
        ) : null}
        {errorMessage ? (
          <MessageBanner type="error">{errorMessage}</MessageBanner>
        ) : null}
        {successMessage ? (
          <MessageBanner type="success">{successMessage}</MessageBanner>
        ) : null}

        <div className="stats-grid">
          <StatCard
            label="Authentication"
            value={isAuthenticated ? "Active" : "Required"}
            helper={
              isAuthenticated
                ? "Protected APIs are available."
                : "Google sign-in is required for all protected features."
            }
            tone={isAuthenticated ? "green" : "amber"}
          />
          <StatCard
            label="Credits Remaining"
            value={creditsRemaining}
            helper={`Used ${creditsUsed} of ${creditsTotal} total credits`}
            tone={creditsRemaining > 0 ? "blue" : "amber"}
          />
          <StatCard
            label="Stored Analyses"
            value={history.length}
            helper="Persistent per Google account"
            tone="purple"
          />
          <StatCard
            label="Health Score"
            value={dashboard?.health_score ?? "—"}
            helper={
              health?.pubmed_enabled
                ? "Live research integration enabled"
                : "Research integration unavailable"
            }
            tone="green"
          />
        </div>

        <div className="dashboard-grid">
          <aside className="sidebar">
            <div className="sidebar-card">
              <h3>Workspace</h3>
              <p>
                Use the tabs below to move between symptom analysis, dashboard
                insights, history, and supporting AI tools.
              </p>
              <div className="nav-list">
                <TabButton
                  id="analysis"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  Symptom Analysis
                </TabButton>
                <TabButton
                  id="dashboard"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  Dashboard
                </TabButton>
                <TabButton
                  id="history"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  History
                </TabButton>
                <TabButton
                  id="assistant"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  AI Assistant
                </TabButton>
                <TabButton
                  id="voice"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  Voice Tools
                </TabButton>
                <TabButton
                  id="research"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                >
                  Research
                </TabButton>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Product rules</h3>
              <p>
                Each completed symptom analysis consumes exactly one credit.
                Credits are enforced on the backend and tied to your
                authenticated account.
              </p>
            </div>

            <div className="sidebar-card">
              <h3>Service snapshot</h3>
              <p>
                Status: <strong>{health?.status || "loading"}</strong>
              </p>
              <p>
                Database:{" "}
                <strong>
                  {health?.database_available === false
                    ? "degraded"
                    : "available"}
                </strong>
              </p>
              <p>
                PubMed:{" "}
                <strong>
                  {health?.pubmed_enabled ? "enabled" : "unavailable"}
                </strong>
              </p>
              <p>
                Google auth configured:{" "}
                <strong>{health?.google_auth_enabled ? "yes" : "no"}</strong>
              </p>
            </div>
          </aside>

          <div className="content-area">
            {activeTab === "analysis" ? (
              <SectionCard
                title="Symptom analysis"
                subtitle="Educational symptom review, possible causes, diet guidance, and risk signals."
                action={
                  <button
                    type="button"
                    className="toggle-inline"
                    onClick={() => setShowEnhancedForm((value) => !value)}
                  >
                    {showEnhancedForm
                      ? "Use simpler form"
                      : "Use enhanced form"}
                  </button>
                }
              >
                <form onSubmit={handleAnalyze}>
                  <div className="form-grid">
                    <div className="field-group form-grid-full">
                      <label htmlFor="symptom">Primary symptom</label>
                      <input
                        id="symptom"
                        className="input"
                        value={symptom}
                        onChange={(event) => setSymptom(event.target.value)}
                        placeholder="e.g. headache, fatigue, nausea"
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="duration">Duration</label>
                      <select
                        id="duration"
                        className="select"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                      >
                        <option value="">Select duration</option>
                        <option value="less than 1 hour">
                          Less than 1 hour
                        </option>
                        <option value="1-6 hours">1-6 hours</option>
                        <option value="6-24 hours">6-24 hours</option>
                        <option value="1-3 days">1-3 days</option>
                        <option value="3-7 days">3-7 days</option>
                        <option value="1-2 weeks">1-2 weeks</option>
                        <option value="more than 2 weeks">
                          More than 2 weeks
                        </option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor="severity">Severity</label>
                      <select
                        id="severity"
                        className="select"
                        value={severity}
                        onChange={(event) => setSeverity(event.target.value)}
                      >
                        <option value="">Select severity</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                        <option value="very severe">Very severe</option>
                      </select>
                    </div>

                    {showEnhancedForm ? (
                      <>
                        <div className="field-group">
                          <label htmlFor="age">Age</label>
                          <input
                            id="age"
                            type="number"
                            min="1"
                            max="120"
                            className="input"
                            value={age}
                            onChange={(event) => setAge(event.target.value)}
                            placeholder="e.g. 34"
                          />
                        </div>

                        <div className="field-group">
                          <label htmlFor="gender">Gender</label>
                          <select
                            id="gender"
                            className="select"
                            value={gender}
                            onChange={(event) => setGender(event.target.value)}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer not to say">
                              Prefer not to say
                            </option>
                          </select>
                        </div>

                        <div className="field-group form-grid-full">
                          <label htmlFor="medicalHistory">
                            Medical history
                          </label>
                          <textarea
                            id="medicalHistory"
                            className="textarea"
                            rows={3}
                            value={medicalHistory}
                            onChange={(event) =>
                              setMedicalHistory(event.target.value)
                            }
                            placeholder="Relevant conditions, medications, or prior history"
                          />
                        </div>
                      </>
                    ) : null}

                    <div className="field-group form-grid-full">
                      <label htmlFor="additionalInfo">Additional context</label>
                      <textarea
                        id="additionalInfo"
                        className="textarea"
                        rows={4}
                        value={additionalInfo}
                        onChange={(event) =>
                          setAdditionalInfo(event.target.value)
                        }
                        placeholder="Triggers, associated symptoms, notes, or recent changes"
                      />
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <MessageBanner type="warning">
                      Sign in with Google before submitting an analysis request.
                    </MessageBanner>
                  ) : null}

                  {isAuthenticated && creditsRemaining <= 0 ? (
                    <MessageBanner type="error">
                      This account has no remaining analysis credits.
                    </MessageBanner>
                  ) : null}

                  {isAuthenticated && isServiceDegraded ? (
                    <MessageBanner type="warning">
                      Analysis, history refresh, and credit updates are paused
                      until the backend database reconnects.
                    </MessageBanner>
                  ) : null}

                  <div className="button-row">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        analysisLoading ||
                        !isAuthenticated ||
                        creditsRemaining <= 0 ||
                        isServiceDegraded
                      }
                    >
                      {analysisLoading
                        ? "Analyzing symptom..."
                        : `Run analysis (${creditsRemaining} credits left)`}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetAnalysisForm}
                      disabled={analysisLoading}
                    >
                      Reset form
                    </button>

                    {isAuthenticated ? (
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => refreshProtectedData()}
                        disabled={appLoading}
                      >
                        Refresh account data
                      </button>
                    ) : null}
                  </div>
                </form>

                {analysis ? (
                  <div className="results-shell">
                    <div className="result-tabs">
                      <ResultTabButton
                        id="overview"
                        activeTab={analysisTab}
                        onClick={setAnalysisTab}
                      >
                        Overview
                      </ResultTabButton>
                      <ResultTabButton
                        id="diet"
                        activeTab={analysisTab}
                        onClick={setAnalysisTab}
                      >
                        Diet Plan
                      </ResultTabButton>
                      <ResultTabButton
                        id="causes"
                        activeTab={analysisTab}
                        onClick={setAnalysisTab}
                      >
                        Possible Causes
                      </ResultTabButton>
                      <ResultTabButton
                        id="insights"
                        activeTab={analysisTab}
                        onClick={setAnalysisTab}
                      >
                        AI Insights
                      </ResultTabButton>
                    </div>

                    {analysisTab === "overview" ? (
                      <div className="analysis-layout">
                        <div className="panel-stack">
                          <div className="callout-card callout-blue">
                            <h3>Analysis summary</h3>
                            <p className="content-prose">
                              {analysis.symptom_analysis}
                            </p>
                          </div>

                          <div className="callout-card callout-purple">
                            <h3>PubMed-backed literature notes</h3>
                            <p className="content-prose">
                              {analysis.ai_web_research}
                            </p>
                          </div>

                          <div className="callout-card callout-green">
                            <h3>Risk assessment</h3>
                            <div className="cause-grid">
                              {Object.entries(
                                analysis.risk_assessment || {},
                              ).map(([key, value]) => (
                                <div key={key} className="cause-card">
                                  <h4>{toLabel(key)}</h4>
                                  <p>{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="panel-stack">
                          <div className="callout-card callout-amber">
                            <h3>Personalized tips</h3>
                            <ul className="clean-list">
                              {(analysis.personalized_tips || []).map((tip) => (
                                <li key={tip}>{tip}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="callout-card callout-red">
                            <h3>Red flags</h3>
                            <ul className="clean-list">
                              {(analysis.red_flags || []).map((flag) => (
                                <li key={flag}>{flag}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="callout-card callout-purple">
                            <h3>Medical disclaimer</h3>
                            <p className="content-prose">
                              {analysis.medical_disclaimer}
                            </p>
                            <p className="section-subtitle">
                              Generated at{" "}
                              {formatDate(analysis.search_timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {analysisTab === "diet" ? (
                      <div className="two-column-lists">
                        <div className="list-card">
                          <h4>Foods to consume</h4>
                          <ul className="clean-list">
                            {(analysis.diet_plan?.foods_to_consume || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div className="list-card">
                          <h4>Foods to avoid</h4>
                          <ul className="clean-list">
                            {(analysis.diet_plan?.foods_to_avoid || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div className="list-card">
                          <h4>Nutritional focus</h4>
                          <ul className="clean-list">
                            {(analysis.diet_plan?.nutritional_focus || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div className="list-card">
                          <h4>Supplements</h4>
                          <ul className="clean-list">
                            {(analysis.diet_plan?.supplements || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div className="list-card">
                          <h4>Meal suggestions</h4>
                          <ul className="clean-list">
                            {(analysis.diet_plan?.meal_suggestions || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : null}

                    {analysisTab === "causes" ? (
                      <div className="panel-stack">
                        <div className="cause-grid">
                          {(analysis.possible_causes || []).map((cause) => (
                            <div
                              key={`${cause.condition}-${cause.probability}`}
                              className="cause-card"
                            >
                              <h4>{cause.condition}</h4>
                              <div className="meta-row">
                                <span className="meta-pill">
                                  {cause.probability}
                                </span>
                                <span
                                  className={`meta-pill ${getUrgencyTone(
                                    cause.urgency_level,
                                  )}`}
                                >
                                  {cause.urgency_level}
                                </span>
                                <span className="meta-pill">
                                  {cause.ai_confidence}
                                </span>
                              </div>
                              <p>{cause.description}</p>
                            </div>
                          ))}
                        </div>

                        <div className="callout-card callout-blue">
                          <h3>Lifestyle suggestions</h3>
                          <ul className="clean-list">
                            {(analysis.lifestyle_suggestions || []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : null}

                    {analysisTab === "insights" ? (
                      <div className="insight-grid">
                        {(analysis.ai_insights || []).map((insight) => (
                          <div
                            key={`${insight.insight_type}-${insight.title}`}
                            className="insight-card"
                          >
                            <h4>{insight.title}</h4>
                            <div className="meta-row">
                              <span className="meta-pill">
                                {insight.insight_type}
                              </span>
                              <span className="meta-pill">
                                {insight.evidence_level}
                              </span>
                            </div>
                            <p>{insight.description}</p>
                            <p>
                              <strong>Recommendation:</strong>{" "}
                              {insight.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {activeTab === "dashboard" ? (
              isAuthenticated ? (
                <SectionCard
                  title="Health dashboard"
                  subtitle="Summary views derived from your stored analyses."
                  action={
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={handlePatternAnalysis}
                      disabled={patternLoading || isServiceDegraded}
                    >
                      {patternLoading
                        ? "Generating patterns..."
                        : "Run pattern analysis"}
                    </button>
                  }
                >
                  <div className="dashboard-panels">
                    <div className="panel-stack">
                      <div className="callout-card callout-blue">
                        <h3>Symptom trend timeline</h3>
                        {dashboard?.symptom_trends?.length ? (
                          <ul className="timeline-list">
                            {dashboard.symptom_trends.map((item, index) => (
                              <li key={`${item.date}-${item.symptom}-${index}`}>
                                <div className="timeline-title">
                                  {item.symptom || "Unknown symptom"}
                                </div>
                                <div className="timeline-meta">
                                  {formatDate(item.date)} • Severity{" "}
                                  {item.severity_label || item.severity}
                                </div>
                                <div>
                                  {item.summary || "No summary available."}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="empty-state">
                            No trend data yet. Complete at least one analysis.
                          </div>
                        )}
                      </div>

                      {patternAnalysis ? (
                        <div className="pattern-response">
                          <h3>{patternAnalysis.analysis_type}</h3>
                          <p>
                            Confidence:{" "}
                            <strong>{patternAnalysis.confidence}</strong> •
                            Generated {formatDate(patternAnalysis.timestamp)}
                          </p>
                          <div className="panel-stack">
                            {Object.entries(patternAnalysis.patterns || {}).map(
                              ([key, values]) => (
                                <div
                                  key={key}
                                  className="callout-card callout-purple"
                                >
                                  <h4>{toLabel(key)}</h4>
                                  <ul className="clean-list">
                                    {(values || []).map((item) => (
                                      <li key={`${key}-${item}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="panel-stack">
                      <div className="callout-card callout-green">
                        <h3>Health score</h3>
                        <p className="stat-value">
                          {dashboard?.health_score ?? "—"}
                        </p>
                        <p>
                          This score is derived from recent symptom severity
                          patterns and should be interpreted only as educational
                          guidance.
                        </p>
                      </div>

                      <div className="callout-card callout-amber">
                        <h3>Risk factors</h3>
                        <ul className="clean-list">
                          {(dashboard?.risk_factors || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="callout-card callout-blue">
                        <h3>Improvement areas</h3>
                        <ul className="clean-list">
                          {(dashboard?.improvement_areas || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="callout-card callout-purple">
                        <h3>AI recommendations</h3>
                        <ul className="clean-list">
                          {(dashboard?.ai_recommendations || []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              ) : (
                renderAuthRequired(
                  "The dashboard uses your protected symptom history and is unavailable without sign-in.",
                )
              )
            ) : null}

            {activeTab === "history" ? (
              isAuthenticated ? (
                <SectionCard
                  title="Analysis history"
                  subtitle="Every completed symptom analysis is stored for your authenticated account."
                >
                  {history.length ? (
                    <div className="history-grid">
                      {history.map((item) => (
                        <div key={item.id} className="history-card">
                          <h4>{item.symptom || "Unknown symptom"}</h4>
                          <div className="meta-row">
                            <span className="meta-pill">
                              {item.severity || "Unspecified severity"}
                            </span>
                            <span className="meta-pill">
                              {item.duration || "No duration"}
                            </span>
                            <span className="meta-pill">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          {Object.keys(item.risk_assessment || {}).length ? (
                            <ul className="clean-list">
                              {Object.entries(item.risk_assessment).map(
                                ([key, value]) => (
                                  <li key={`${item.id}-${key}`}>
                                    <strong>{toLabel(key)}:</strong>{" "}
                                    {String(value)}
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <p>
                              No stored risk assessment details were found for
                              this record.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No analyses stored yet. Run your first symptom analysis to
                      build history.
                    </div>
                  )}
                </SectionCard>
              ) : (
                renderAuthRequired(
                  "History is protected because it is tied to your Google account.",
                )
              )
            ) : null}

            {activeTab === "assistant" ? (
              isAuthenticated ? (
                <SectionCard
                  title="AI health assistant"
                  subtitle="Ask follow-up questions based on your recent symptom activity."
                >
                  <div className="chat-shell">
                    <form onSubmit={handleChatSubmit}>
                      <div className="field-group">
                        <label htmlFor="chatMessage">Your question</label>
                        <textarea
                          id="chatMessage"
                          className="textarea"
                          rows={4}
                          value={chatMessage}
                          onChange={(event) =>
                            setChatMessage(event.target.value)
                          }
                          placeholder="Ask about symptoms, warning signs, or supportive next steps"
                        />
                      </div>
                      <div className="button-row">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={chatLoading || isServiceDegraded}
                        >
                          {chatLoading
                            ? "Sending question..."
                            : "Ask assistant"}
                        </button>
                      </div>
                    </form>

                    {chatResponse ? (
                      <div className="chat-response">
                        <p className="content-prose">{chatResponse.response}</p>
                        <div className="suggestion-row">
                          {(chatResponse.suggestions || []).map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="suggestion-chip"
                              onClick={() => setChatMessage(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        {(chatResponse.follow_up_questions || []).length ? (
                          <div className="callout-card callout-blue">
                            <h4>Follow-up questions</h4>
                            <ul className="clean-list">
                              {chatResponse.follow_up_questions.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : (
                renderAuthRequired(
                  "Assistant context is based on authenticated account history.",
                )
              )
            ) : null}

            {activeTab === "voice" ? (
              isAuthenticated ? (
                <SectionCard
                  title="Voice symptom tools"
                  subtitle="Paste recognized transcript text to detect likely symptom categories."
                >
                  <div className="tools-grid">
                    <form onSubmit={handleVoiceSubmit}>
                      <div className="form-grid">
                        <div className="field-group form-grid-full">
                          <label htmlFor="voiceText">Transcript text</label>
                          <textarea
                            id="voiceText"
                            className="textarea"
                            rows={5}
                            value={voiceText}
                            onChange={(event) =>
                              setVoiceText(event.target.value)
                            }
                            placeholder="Example: I have had a headache and feel nauseous since yesterday"
                          />
                        </div>
                        <div className="field-group">
                          <label htmlFor="voiceConfidence">
                            Transcript confidence
                          </label>
                          <input
                            id="voiceConfidence"
                            className="input"
                            value={voiceConfidence}
                            onChange={(event) =>
                              setVoiceConfidence(event.target.value)
                            }
                            placeholder="0.90"
                          />
                        </div>
                      </div>
                      <div className="button-row">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={voiceLoading || isServiceDegraded}
                        >
                          {voiceLoading
                            ? "Processing transcript..."
                            : "Analyze transcript"}
                        </button>
                      </div>
                    </form>

                    {voiceResponse ? (
                      <div className="voice-response">
                        <p>{voiceResponse.response}</p>
                        <div className="meta-row">
                          <span className="meta-pill">
                            Confidence: {voiceResponse.confidence}
                          </span>
                          <span className="meta-pill">
                            Status: {voiceResponse.status}
                          </span>
                        </div>
                        {(voiceResponse.detected_symptoms || []).length ? (
                          <div className="suggestion-row">
                            {voiceResponse.detected_symptoms.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="suggestion-chip"
                                onClick={() => {
                                  setSymptom(item);
                                  setActiveTab("analysis");
                                  setSuccessMessage(
                                    `Inserted detected symptom "${item}" into the analysis form.`,
                                  );
                                }}
                              >
                                Use "{item}" in analysis
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : (
                renderAuthRequired("Voice analysis is a protected user tool.")
              )
            ) : null}

            {activeTab === "research" ? (
              isAuthenticated ? (
                <SectionCard
                  title="Research and literature search"
                  subtitle="Search PubMed-backed literature notes for a symptom or topic."
                >
                  <div className="tools-grid">
                    <form onSubmit={handleResearchSubmit}>
                      <div className="search-row">
                        <input
                          className="search-input"
                          value={researchQuery}
                          onChange={(event) =>
                            setResearchQuery(event.target.value)
                          }
                          placeholder="e.g. migraine nutrition, fatigue causes, nausea management"
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={researchLoading || isServiceDegraded}
                        >
                          {researchLoading ? "Searching..." : "Search PubMed"}
                        </button>
                      </div>
                    </form>

                    {researchResponse ? (
                      <div className="research-response">
                        <p>
                          Query: <strong>{researchResponse.query}</strong>
                        </p>
                        <p>
                          Source count:{" "}
                          <strong>{researchResponse.source_count}</strong>
                        </p>
                        <p className="content-prose">
                          {researchResponse.results}
                        </p>
                        {researchResponse.pubmed_url ? (
                          <p>
                            <a
                              href={researchResponse.pubmed_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open full PubMed search in a new tab
                            </a>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </SectionCard>
              ) : (
                renderAuthRequired(
                  "Literature search is protected because it is integrated into the authenticated product workflow.",
                )
              )
            ) : null}
          </div>
        </div>

        <p className="footer-note">
          This application provides educational guidance only. It does not
          diagnose, treat, or replace licensed medical care. Seek urgent
          professional care immediately for severe, rapidly worsening, or
          red-flag symptoms.
          {appLoading ? " Refreshing account data..." : ""}
        </p>
      </main>
    </div>
  );
}

export default App;
