export function formatDate(value) {
  try {
    return value ? new Date(value).toLocaleString() : "—";
  } catch {
    return String(value || "—");
  }
}

export function labelize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isAuthFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.status === 401 || message.includes("token");
}

export function probabilityToScore(probability) {
  const raw = String(probability || "");
  const match = raw.match(/(\d+(\.\d+)?)/);
  if (match) {
    const value = Number(match[1]);
    return Math.max(0, Math.min(100, value));
  }
  if (/critical|very high|high/i.test(raw)) return 86;
  if (/moderate|medium/i.test(raw)) return 58;
  if (/low|minimal/i.test(raw)) return 30;
  return 45;
}

export const EMPTY_FORM = {
  symptom: "",
  duration: "",
  severity: "",
  age: "",
  gender: "",
  medicalHistory: "",
  additionalInfo: "",
};
