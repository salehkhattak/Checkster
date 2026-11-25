"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { CITIES, AREAS } from "@/lib/data";
import type { Lang3 } from "@/lib/api";
import { SiteHeader } from "@/components/site/header";
import { Mascot } from "@/components/site/brand";

export default function RegisterPage() {
  const { t } = useLang();
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("peshawar");
  const [neighbourhood, setNeighbourhood] = useState("Hayatabad");
  const [preferredLanguage, setPreferredLanguage] = useState<Lang3>("en");
  const [role, setRole] = useState<"homeowner" | "contractor" | "admin">("homeowner");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register({
        name,
        email,
        password,
        phone,
        city,
        neighbourhood,
        preferred_language: preferredLanguage,
        role,
      });
      if (user.role === "contractor") router.push("/worker");
      else if (user.role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10">
        <div className="rounded-3xl bg-white border-2 border-ink p-6 sm:p-8 shadow-[0_6px_0_0_var(--ink)]">
          <div className="flex items-center gap-3">
            <Mascot size={48} />
            <div>
              <h1 className="text-2xl font-black text-ink ur-tight">
                {t({ en: "Create your Checkster account", ur: "اپنا چیکسٹر اکاؤنٹ بنائیں" })}
              </h1>
              <p className="text-sm font-bold text-ink-soft">
                {t({ en: "Save inspections, audit quotes & connect with kaarigars", ur: "اپنے معائنے اور تخمینے محفوظ رکھیں" })}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-danger-soft border border-danger p-3 text-sm font-bold text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-extrabold text-ink mb-1.5">
                {t({ en: "Account type", ur: "اکاؤنٹ کی قسم" })}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "homeowner", label: { en: "Homeowner", ur: "گھر کا مالک" } },
                    { id: "contractor", label: { en: "Contractor", ur: "کاریگر / ٹھیکیدار" } },
                    { id: "admin", label: { en: "Admin", ur: "ایڈمن" } },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-2xl border-2 py-2.5 px-2 text-sm font-extrabold transition-colors ${
                      role === r.id ? "border-ink bg-sun-soft text-ink" : "border-line bg-white text-ink-soft hover:border-ink"
                    }`}
                  >
                    {t(r.label)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-ink" htmlFor="reg-name">
                {t({ en: "Full name", ur: "پورا نام" })}
              </label>
              <input
                id="reg-name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t({ en: "e.g. Saleh Khattak", ur: "مثلاً صالح خٹک" })}
                className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-extrabold text-ink" htmlFor="reg-email">
                  {t({ en: "Email address", ur: "ای میل" })}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40 latin"
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-ink" htmlFor="reg-phone">
                  {t({ en: "Phone (optional)", ur: "فون نمبر (اختیاری)" })}
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40 latin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-ink" htmlFor="reg-password">
                {t({ en: "Password (at least 6 characters)", ur: "پاس ورڈ (کم از کم 6 حروف)" })}
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-4 font-bold bg-cream/40"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-extrabold text-ink" htmlFor="reg-city">
                  {t({ en: "City", ur: "شہر" })}
                </label>
                <select
                  id="reg-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-3 font-bold bg-cream/40"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {t(c.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-extrabold text-ink" htmlFor="reg-area">
                  {t({ en: "Area / Neighbourhood", ur: "علاقہ / محلہ" })}
                </label>
                <input
                  id="reg-area"
                  value={neighbourhood}
                  onChange={(e) => setNeighbourhood(e.target.value)}
                  list="area-suggestions"
                  placeholder={t({ en: "e.g. Hayatabad Phase 3", ur: "مثلاً حیات آباد" })}
                  className="mt-1 w-full h-12 rounded-2xl border-2 border-line focus:border-ink outline-none px-3 font-bold bg-cream/40"
                />
                <datalist id="area-suggestions">
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.label.en} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-ink mb-1">
                {t({ en: "Preferred language", ur: "پسندیدہ زبان" })}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "en", label: "English" },
                    { id: "ur", label: "اردو" },
                    { id: "roman_ur", label: "Roman Urdu" },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setPreferredLanguage(l.id)}
                    className={`rounded-2xl border-2 py-2 text-sm font-extrabold ${
                      preferredLanguage === l.id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-14 rounded-2xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-lg font-black inline-flex items-center justify-center gap-2 shadow-[0_4px_0_0_var(--ink)]"
            >
              <UserPlus className="h-5 w-5" />
              {busy ? t({ en: "Creating account…", ur: "اکاؤنٹ بن رہا ہے…" }) : t({ en: "Create account", ur: "اکاؤنٹ بنائیں" })}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-bold text-ink-soft">
            {t({ en: "Already have an account?", ur: "پہلے سے اکاؤنٹ ہے؟" })}{" "}
            <Link href="/login" className="text-brand-dark font-extrabold underline">
              {t({ en: "Log in", ur: "لاگ ان کریں" })}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
