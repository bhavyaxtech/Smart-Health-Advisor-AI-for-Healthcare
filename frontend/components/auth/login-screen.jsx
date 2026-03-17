"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import { getStoredSession, setAuthSession } from "@/lib/session";

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

function getGoogleCredential(clientId) {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(
        new Error(
          "Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID first."
        )
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      reject(
        new Error(
          "Google sign-in library is not loaded yet. Please try again in a moment."
        )
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
          new Error("Google sign-in could not be completed from the browser prompt.")
        );
      }
    });
  });
}

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredSession()?.token) {
      router.replace("/app");
    }
  }, [router]);

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      const idToken = await getGoogleCredential(GOOGLE_CLIENT_ID);
      const authPayload = await apiClient.authenticateWithGoogle(idToken);
      setAuthSession(authPayload);
      apiClient.setToken(authPayload.access_token);
      router.push("/app");
    } catch (loginError) {
      setError(loginError?.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, x: -26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-[36px] p-8 lg:p-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">
              SH
            </span>
            Back to the landing page
          </Link>

          <div className="mt-8 max-w-xl">
            <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-700">
              Secure access
            </div>
            <h1 className="mt-6 font-display text-5xl font-black tracking-[-0.06em] text-slate-950">
              Sign in to open your health intelligence workspace.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Your account unlocks persistent symptom history, dashboard
              insights, AI follow-up tools, and research-aware educational
              guidance in one place.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              "Private, account-bound history and credits",
              "Structured educational analysis instead of vague chatbot output",
              "A cleaner, recruiter-grade UI around real product logic",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4 text-sm leading-7 text-slate-600"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.22),transparent_24%),linear-gradient(135deg,#0f172a,#111827)]" />
          <div className="relative">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-sky-100">
              Google-only authentication
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.05em]">
              Clear trust signals. Zero auth confusion.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              This flow stays intentionally simple: Google identity in the
              browser, backend verification, JWT session for product access.
            </p>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connecting to Google..." : "Continue with Google"}
            </button>

            {!GOOGLE_CLIENT_ID ? (
              <div className="mt-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
                Missing <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in the
                frontend environment.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-[22px] border border-rose-300/20 bg-rose-300/10 p-4 text-sm leading-7 text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Session model
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  ID token to JWT
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Next destination
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  /app workspace
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
