const DEFAULT_API_BASE_URL = (process.env.REACT_APP_BACKEND_URL || "").trim() || "";

function buildUrl(path) {
  if (!path.startsWith("/")) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  if (!DEFAULT_API_BASE_URL) {
    return path;
  }

  return `${DEFAULT_API_BASE_URL}${path}`;
}

async function parseJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function getErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join(", ");
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return fallbackMessage;
}

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token || null;
  }

  clearToken() {
    this.token = null;
  }

  getAuthHeader() {
    if (!this.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  async request(path, options = {}) {
    const {
      method = "GET",
      body,
      headers = {},
      requiresAuth = false,
    } = options;

    if (requiresAuth && !this.token) {
      throw new ApiError("You need to sign in with Google first.", 401);
    }

    let response;

    try {
      response = await fetch(buildUrl(path), {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...this.getAuthHeader(),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new ApiError(
        error?.message || "Unable to reach the backend service.",
        0,
        null
      );
    }

    const payload = await parseJsonSafely(response);

    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
        payload
      );
    }

    return payload;
  }

  authenticateWithGoogle(idToken) {
    return this.request("/api/auth/google", {
      method: "POST",
      body: { id_token: idToken },
    });
  }

  getCurrentUser() {
    return this.request("/api/auth/me", {
      requiresAuth: true,
    });
  }

  getCredits() {
    return this.request("/api/credits", {
      requiresAuth: true,
    });
  }

  analyzeSymptom(payload) {
    return this.request("/api/analyze-symptom", {
      method: "POST",
      body: payload,
      requiresAuth: true,
    });
  }

  getHistory() {
    return this.request("/api/history", {
      requiresAuth: true,
    });
  }

  getDashboard(userId) {
    return this.request(`/api/health-dashboard/${encodeURIComponent(userId)}`, {
      requiresAuth: true,
    });
  }

  sendChatMessage(message) {
    return this.request("/api/ai-chat", {
      method: "POST",
      body: { message },
      requiresAuth: true,
    });
  }

  analyzeVoiceInput(payload) {
    return this.request("/api/voice-input", {
      method: "POST",
      body: payload,
      requiresAuth: true,
    });
  }

  runRealtimeSearch(query) {
    return this.request("/api/real-time-search", {
      method: "POST",
      body: { query },
      requiresAuth: true,
    });
  }

  runPatternAnalysis(timeframe = "month") {
    return this.request("/api/pattern-analysis", {
      method: "POST",
      body: { timeframe },
      requiresAuth: true,
    });
  }

  getHealth() {
    return this.request("/api/health");
  }
}

const apiClient = new ApiClient();

export default apiClient;
