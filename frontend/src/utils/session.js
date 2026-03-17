const STORAGE_KEYS = {
  authToken: "smart-health-auth-token",
  authUser: "smart-health-auth-user",
  authExpiry: "smart-health-auth-expiry",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key) {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Unable to read session key "${key}"`, error);
    return null;
  }
}

function safeWrite(key, value) {
  if (!isBrowser()) return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Unable to write session key "${key}"`, error);
    return false;
  }
}

function safeRemove(key) {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Unable to remove session key "${key}"`, error);
  }
}

export function setAuthSession({ access_token, expires_in, user }) {
  const expiryTimestamp = Date.now() + Number(expires_in || 0) * 1000;

  safeWrite(STORAGE_KEYS.authToken, access_token || "");
  safeWrite(STORAGE_KEYS.authExpiry, String(expiryTimestamp));
  safeWrite(STORAGE_KEYS.authUser, JSON.stringify(user || null));

  return {
    token: access_token || "",
    expiryTimestamp,
    user: user || null,
  };
}

export function getAuthToken() {
  return safeRead(STORAGE_KEYS.authToken);
}

export function getSessionExpiry() {
  const rawValue = safeRead(STORAGE_KEYS.authExpiry);
  if (!rawValue) return null;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAuthUser() {
  const rawValue = safeRead(STORAGE_KEYS.authUser);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.error("Unable to parse stored auth user", error);
    clearAuthSession();
    return null;
  }
}

export function isSessionExpired() {
  const expiry = getSessionExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

export function hasValidSession() {
  const token = getAuthToken();
  return Boolean(token) && !isSessionExpired();
}

export function getStoredSession() {
  if (!hasValidSession()) {
    clearAuthSession();
    return null;
  }

  return {
    token: getAuthToken(),
    expiryTimestamp: getSessionExpiry(),
    user: getAuthUser(),
  };
}

export function clearAuthSession() {
  safeRemove(STORAGE_KEYS.authToken);
  safeRemove(STORAGE_KEYS.authUser);
  safeRemove(STORAGE_KEYS.authExpiry);
}

export function updateStoredUser(user) {
  if (user == null) {
    safeRemove(STORAGE_KEYS.authUser);
    return;
  }

  safeWrite(STORAGE_KEYS.authUser, JSON.stringify(user));
}

export function getAuthorizationHeader() {
  const session = getStoredSession();
  if (!session?.token) return {};
  return {
    Authorization: `Bearer ${session.token}`,
  };
}
