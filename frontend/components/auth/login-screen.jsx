"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import apiClient, { ApiError } from "@/lib/api-client";
import { getStoredSession, setAuthSession } from "@/lib/session";

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
const GSI_SCRIPT_TIMEOUT_MS = 8000;

function getGoogleErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Sign-in failed. Please try again.";
}

export default function LoginScreen() {
  const router = useRouter();
  const googleButtonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [scriptFailed, setScriptFailed] = useState(false);

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

  const handleCredentialResponse = useCallback(
    async (response) => {
      setError("");
      setLoading(true);
      try {
        if (!response?.credential) {
          throw new Error("Google sign-in did not return a credential.");
        }
        const authPayload = await apiClient.authenticateWithGoogle(response.credential);
        setAuthSession(authPayload);
        apiClient.setToken(authPayload.access_token);
        router.push("/app");
      } catch (caughtError) {
        setError(getGoogleErrorMessage(caughtError));
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    let cancelled = false;

    function initGoogle(attempt) {
      if (cancelled || !googleButtonRef.current) return;

      const gsi = window.google?.accounts?.id;
      if (!gsi) {
        if (attempt * 100 >= GSI_SCRIPT_TIMEOUT_MS) {
          setScriptFailed(true);
          return;
        }
        window.setTimeout(() => initGoogle(attempt + 1), 100);
        return;
      }

      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      gsi.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 320,
      });
    }

    initGoogle(0);
    return () => {
      cancelled = true;
    };
  }, [handleCredentialResponse]);

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

          {/* Official Google Sign-In button target */}
          <div className="relative mt-6 flex min-h-[48px] items-center justify-center">
            <div ref={googleButtonRef} className={loading ? "pointer-events-none opacity-40" : ""} />
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-[12px] border border-stone-200 bg-white/90 text-sm font-medium text-stone-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
                Signing in...
              </div>
            ) : null}
          </div>

          {/* Config warning */}
          {!GOOGLE_CLIENT_ID ? (
            <div className="mt-4 rounded-[12px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800">
              Google sign-in is not configured. Set{" "}
              <code className="rounded bg-[rgba(201,112,34,0.12)] px-1 py-0.5 text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
              in <code className="rounded bg-[rgba(201,112,34,0.12)] px-1 py-0.5 text-xs">frontend/.env</code> and restart the dev server.
            </div>
          ) : scriptFailed ? (
            <div className="mt-4 rounded-[12px] border border-[rgba(201,112,34,0.25)] bg-[rgba(201,112,34,0.08)] px-4 py-3 text-sm text-amber-800">
              The Google sign-in script could not load. Check your connection or any content blockers and refresh.
            </div>
          ) : null}

          {/* Error */}
          {error ? (
            <div role="alert" className="mt-4 rounded-[12px] border border-[rgba(180,40,20,0.28)] bg-[rgba(180,40,20,0.07)] px-4 py-3 text-sm text-red-700">
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
