"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site/header";
import { Mascot } from "@/components/site/brand";

export default function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Password reset modal state
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "contractor") router.push("/worker");
      else router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMsg("");
    try {
      const res = await api.requestPasswordReset(resetEmail);
      if (res.reset_token_preview) {
        setResetToken(res.reset_token_preview);
      }
      setResetMsg(res.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.confirmPasswordReset(resetToken, newPassword);
      setResetMsg(res.message);
      setResetMode(false);
      setPassword(newPassword);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-3xl bg-white border-2 border-ink p-6 sm:p-8 shadow-[0_6px_0_0_var(--ink)]">
          <div className="flex items-center gap-3">
            <Mascot size={48} />
            <div>
              <h1 className="text-2xl font-black text-ink ur-tight">
                {resetMode
                  ? t({ en: "Reset your password", ur: "پاس ورڈ ری سیٹ کریں" })
                  : t({ en: "Welcome back", ur: "خوش آمدید" })}
              </h1>
              <p className="text-sm font-bold text-ink-soft">
                {t({ en: "Access your saved inspections & quote audits", ur: "اپنے محفوظ معائنے اور تخمینے دیکھیں" })}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-danger-soft border border-danger p-3 text-sm font-bold text-danger">
              {error}
            </div>
          )}
          {resetMsg && (
            <div className="mt-4 rounded-2xl bg-leaf-soft border border-leaf p-3 text-sm font-bold text-[#0f6b43]">
              {resetMsg}
            </div>
          )}

          {!resetMode ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-ink" htmlFor="login-email">
                  {t({ en: "Email address", ur: "ای میل ایڈریس" })}
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40 latin"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-extrabold text-ink" htmlFor="login-password">
                    {t({ en: "Password", ur: "پاس ورڈ" })}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setResetEmail(email);
                    }}
                    className="text-xs font-extrabold text-sky-dark hover:underline"
                  >
                    {t({ en: "Forgot password?", ur: "پاس ورڈ بھول گئے؟" })}
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-14 rounded-2xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-lg font-black inline-flex items-center justify-center gap-2 shadow-[0_4px_0_0_var(--ink)]"
              >
                <LogIn className="h-5 w-5" />
                {busy ? t({ en: "Logging in…", ur: "لاگ ان ہو رہا ہے…" }) : t({ en: "Log in", ur: "لاگ ان کریں" })}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <form onSubmit={handleRequestReset} className="space-y-3">
                <label className="block text-sm font-extrabold text-ink">
                  {t({ en: "1. Enter your account email", ur: "1۔ اپنا ای میل لکھیں" })}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold latin"
                  />
                  <button
                    type="submit"
                    className="h-12 px-4 rounded-2xl bg-ink text-white font-extrabold text-sm"
                  >
                    {t({ en: "Get token", ur: "ٹوکن لیں" })}
                  </button>
                </div>
              </form>

              <form onSubmit={handleConfirmReset} className="space-y-3 pt-3 border-t border-line">
                <label className="block text-sm font-extrabold text-ink">
                  {t({ en: "2. Reset token & new password", ur: "2۔ ری سیٹ ٹوکن اور نیا پاس ورڈ" })}
                </label>
                <input
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  placeholder={t({ en: "Paste reset token", ur: "ری سیٹ ٹوکن" })}
                  className="w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold latin text-sm"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t({ en: "New password (min 6 chars)", ur: "نیا پاس ورڈ (کم از کم 6 حروف)" })}
                  className="w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold text-sm"
                />
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-leaf text-white font-black inline-flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {t({ en: "Set new password", ur: "نیا پاس ورڈ محفوظ کریں" })}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full text-center text-sm font-extrabold text-ink-soft hover:text-ink"
              >
                {t({ en: "Back to login", ur: "واپس لاگ ان پر" })}
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm font-bold text-ink-soft">
            {t({ en: "New to Checkster?", ur: "چیکسٹر پر نئے ہیں؟" })}{" "}
            <Link href="/register" className="text-brand-dark font-extrabold underline">
              {t({ en: "Create an account", ur: "نیا اکاؤنٹ بنائیں" })}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
