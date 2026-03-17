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
      reject(new Error("Google sign-in is not configured."));
      return;
    }

    if (!window.google?.accounts?.id) {
      reject(new Error("Google sign-in is not ready yet. Please try again."));
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
        rejectOnce(new Error("Google sign-in could not be completed."));
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
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-6 py-10 sm:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="glass-strong rounded-[40px] p-8 sm:p-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition duration-300 hover:border-amber-200 hover:text-amber-700"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 font-display text-lg text-stone-50">
              V
            </span>
            Back to Vital
          </Link>

          <div className="mt-10">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-700">
              Secure access
            </span>
            <h1 className="mt-5 font-display text-[clamp(2.2rem,4vw,3.1rem)] font-normal leading-[1.15] text-stone-900">
              Welcome back to your health workspace.
            </h1>
            <p className="mt-4 max-w-xl text-base font-light leading-[1.72] text-stone-400">
              Sign in with Google to continue your symptom timeline, dashboard
              trends, and guided follow-up.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Personalized workspace history",
              "Calm, focused interface",
              "Assistant and voice follow-up",
              "5 analyses included",
            ].map((item) => (
              <div key={item} className="glass rounded-2xl px-4 py-3 text-sm text-stone-600">
                {item}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
          className="glass-strong gradient-ring relative overflow-hidden rounded-[40px] p-8 sm:p-10"
        >
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-200/40 blur-2xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-sky-soft/50 blur-2xl" />

          <div className="relative">
            <h2 className="font-display text-[clamp(2rem,3.2vw,2.7rem)] font-normal text-stone-900">
              Continue with Google
            </h2>
            <p className="mt-3 text-base font-light leading-[1.72] text-stone-400">
              One tap sign-in, then straight into your Vital dashboard.
            </p>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-6 py-4 text-sm font-medium text-stone-50 transition duration-300 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            {!GOOGLE_CLIENT_ID ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Google sign-in is currently unavailable in this environment.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
