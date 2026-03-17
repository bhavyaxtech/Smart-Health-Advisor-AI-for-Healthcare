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
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-44 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(201,112,34,0.12)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(237,175,96,0.09)_0%,transparent_70%)] blur-[80px]" />
      </div>

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

          <div className="mt-8 space-y-2.5">
            {[
              "Personalized workspace history",
              "Calm, focused interface",
              "Assistant and voice follow-up",
              "5 analyses included",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[14px] border border-white/80 bg-[rgba(255,252,248,0.6)] px-4 py-3 text-sm text-stone-600 backdrop-blur-sm">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(201,112,34,0.11)]">
                  <svg viewBox="0 0 9 9" fill="none" width="8" height="8">
                    <path d="M1.8 4.5l2 2 3.4-3.4" stroke="#c97022" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
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
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[40px]">
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(237,175,96,0.18),transparent_70%)] blur-2xl" />
            <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(137,184,204,0.15),transparent_70%)] blur-2xl" />
          </div>

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
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-medium text-stone-50 shadow-[0_4px_20px_rgba(168,90,20,0.36)] transition duration-200 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(168,90,20,0.46)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#fff" fillOpacity=".9" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                    <path fill="#fff" fillOpacity=".75" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                    <path fill="#fff" fillOpacity=".6" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                    <path fill="#fff" fillOpacity=".5" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                  </svg>
                  Continue with Google
                </>
              )}
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

            <p className="mt-4 text-center text-xs text-stone-400">
              5 free analyses included · No card required
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
