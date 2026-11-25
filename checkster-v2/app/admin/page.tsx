"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { api, type ContractorListing } from "@/lib/api";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export default function AdminPage() {
  const { t } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [contractors, setContractors] = useState<ContractorListing[]>([]);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.adminOverview();
      setCounts(res.counts);
      setContractors(res.contractors);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
      return;
    }
    if (user?.role === "admin") load();
  }, [user, loading, router, load]);

  const setStatus = async (cid: string, status: "under_review" | "verified" | "rejected") => {
    try {
      await api.adminVerifyContractor(cid, status, notesMap[cid] || `Reviewed by admin (${status})`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <div className="rounded-3xl bg-ink text-white p-6">
          <h1 className="text-2xl sm:text-3xl font-black">
            {t({ en: "Checkster Administrator Console", ur: "چیکسٹر ایڈمنسٹریٹر پینل" })}
          </h1>
          <p className="text-sm font-bold text-white/75 mt-1">
            {t({
              en: "Review contractor verification submissions before granting a Checkster-Verified badge.",
              ur: "تصدیق شدہ بیج دینے سے پہلے کاریگروں کی درخواستوں کا جائزہ لیں۔",
            })}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { k: "users", label: { en: "Users", ur: "صارفین" } },
              { k: "inspections", label: { en: "Inspections", ur: "معائنے" } },
              { k: "quotations", label: { en: "Quotations", ur: "تخمینے" } },
              { k: "contractors", label: { en: "Contractors", ur: "کاریگر" } },
            ].map((item) => (
              <div key={item.k} className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs font-bold text-white/70">{t(item.label)}</p>
                <p className="text-2xl font-black latin">{counts[item.k] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-danger-soft border border-danger p-4 text-sm font-bold text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-black text-ink">
            {t({ en: "Contractor Verification Queue", ur: "کاریگر تصدیق کی فہرست" })}
          </h2>
          {contractors.length === 0 ? (
            <div className="rounded-3xl bg-white border-2 border-line p-8 text-center font-bold text-ink-soft">
              {t({ en: "No contractors registered yet.", ur: "ابھی کوئی کاریگر رجسٹر نہیں ہوا۔" })}
            </div>
          ) : (
            contractors.map((c) => (
              <div key={c.id} className="rounded-3xl bg-white border-2 border-line p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-black text-ink flex items-center gap-2">
                      {c.business_name}
                      {c.verification_status === "verified" && <BadgeCheck className="h-5 w-5 text-leaf" />}
                    </p>
                    <p className="text-sm font-bold text-ink-soft">
                      {c.owner_name} · {c.phone} · {c.city.toUpperCase()} ({c.neighbourhood}) ·{" "}
                      {c.experience_years} yrs · Rs {c.daily_rate}/day
                    </p>
                    <p className="text-xs font-bold text-ink-soft mt-1">
                      {t({ en: "Categories:", ur: "شعبے:" })} {(c.service_categories || []).join(", ")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                      c.verification_status === "verified"
                        ? "bg-leaf-soft text-[#0f6b43]"
                        : c.verification_status === "rejected"
                          ? "bg-danger-soft text-danger"
                          : "bg-amber-soft text-[#8a5a00]"
                    }`}
                  >
                    {c.verification_status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-line">
                  <input
                    value={notesMap[c.id] ?? ""}
                    onChange={(e) => setNotesMap((m) => ({ ...m, [c.id]: e.target.value }))}
                    placeholder={t({ en: "Admin verification note…", ur: "ایڈمن نوٹ لکھیں…" })}
                    className="flex-1 min-w-[14rem] h-10 rounded-xl border border-line px-3 text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setStatus(c.id, "under_review")}
                    className="h-10 px-3 rounded-xl bg-amber-soft text-[#8a5a00] text-xs font-extrabold inline-flex items-center gap-1"
                  >
                    <Clock className="h-3.5 w-3.5" /> Under Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(c.id, "verified")}
                    className="h-10 px-3 rounded-xl bg-leaf text-white text-xs font-extrabold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve (Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(c.id, "rejected")}
                    className="h-10 px-3 rounded-xl bg-danger-soft text-danger text-xs font-extrabold inline-flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
