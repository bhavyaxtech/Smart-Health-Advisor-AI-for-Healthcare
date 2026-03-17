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
    const finish = (cb) => (val) => { if (settled) return; settled = true; cb(val); };
    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);
    const timeoutId = window.setTimeout(() => {
      rejectOnce(new Error("Google sign-in timed out. Please try again."));
    }, 60000);
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        window.clearTimeout(timeoutId);
        if (!response?.credential) { rejectOnce(new Error("Google sign-in did not return a credential.")); return; }
        resolveOnce(response.credential);
      },
    });
    window.google.accounts.id.prompt((notification) => {
      if (settled) return;
      const notDisplayed = typeof notification?.isNotDisplayed === "function" && notification.isNotDisplayed();
      const skipped = typeof notification?.isSkippedMoment === "function" && notification.isSkippedMoment();
      const dismissed = typeof notification?.isDismissedMoment === "function" && notification.isDismissedMoment();
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
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (getStoredSession()?.token) router.replace("/app");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      try {
        const payload = await apiClient.getHealth();
        if (!cancelled) setHealth(payload);
      } catch {
        if (!cancelled) setHealth({ status: "degraded" });
      }
    }
    checkHealth();
    return () => { cancelled = true; };
  }, []);

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

  const healthDot = health
    ? health.status === "healthy"
      ? "bg-emerald-500"
      : "bg-amber-500"
    : "bg-stone-300";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-6 py-10">

      {/* Ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-44 h-[600px] w-[600px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(201,112,34,0.12) 0%,transparent 70%)" }} />
        <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(237,175,96,0.09) 0%,transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="glass-strong relative w-full max-w-[420px] overflow-hidden rounded-[24px] p-12"
      >
        {/* Glow blobs inside card */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle,rgba(237,175,96,0.18),transparent 70%)" }} />
          <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle,rgba(137,184,204,0.15),transparent 70%)" }} />
        </div>

        <div className="relative">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] font-display text-base text-stone-50"
              style={{ background: "linear-gradient(135deg,#c97022,#edaf60)", boxShadow: "0 2px 10px rgba(201,112,34,0.36)" }}>V</span>
            <span className="font-display text-xl font-normal text-stone-900">Vital</span>
          </Link>

          {/* Headline */}
          <h1 className="mt-8 font-display text-[2rem] font-normal leading-[1.15] tracking-[-0.022em] text-stone-900">
            Welcome back.
          </h1>
          <p className="mt-3 text-base font-light leading-[1.72] text-stone-400">
            Sign in to access your health dashboard.
          </p>

          {/* Divider */}
          <div className="mt-6 border-t border-[rgba(20,16,8,0.07)]" />

          {/* Google button — white bg, colored G */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[12px] border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 transition duration-200 hover:-translate-y-px hover:border-stone-300 hover:shadow-[0_4px_16px_rgba(20,16,8,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
                Signing in...
              </>
            ) : (
              <>
                {/* Colored Google G icon */}
                <svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Config warning */}
          {!GOOGLE_CLIENT_ID ? (
            <div className="mt-4 rounded-[12px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800">
              Google sign-in is currently unavailable in this environment.
            </div>
          ) : null}

          {/* Error */}
          {error ? (
            <div className="mt-4 rounded-[12px] border border-[rgba(201,112,34,0.3)] bg-[rgba(201,112,34,0.09)] px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : null}

          <p className="mt-5 text-center text-xs text-stone-400">
            5 free analyses included · No card required
          </p>

          {/* Divider */}
          <div className="mt-6 border-t border-[rgba(20,16,8,0.07)]" />

          <p className="mt-5 text-xs leading-relaxed text-stone-400">
            By continuing you agree to Vital&apos;s{" "}
            <a href="#" className="text-amber-600 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-amber-600 hover:underline">Privacy Policy</a>.
            Vital provides educational guidance only and does not replace licensed medical care.
          </p>

          {/* Health status indicator */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className={`h-2 w-2 rounded-full ${healthDot}`} style={health?.status === "healthy" ? {} : { animation: "pulseDot 2s ease-in-out infinite" }} />
            <span className="text-[11px] text-stone-400">
              {health ? (health.status === "healthy" ? "All systems operational" : "Some features may be limited") : "Checking status…"}
            </span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}