"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  ClipboardList,
  ExternalLink,
  FileText,
  HardHat,
  Plus,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  resolveFileUrl,
  type ContractorListing,
  type Lang3,
  type RepairRequestRecord,
  type SavedInspectionRecord,
} from "@/lib/api";
import { CITIES } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Mascot } from "@/components/site/brand";

export default function DashboardPage() {
  const { t, money } = useLang();
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"inspections" | "quotes" | "contractors" | "requests" | "account">("inspections");
  const [inspections, setInspections] = useState<SavedInspectionRecord[]>([]);
  const [quotations, setQuotations] = useState<Record<string, any>[]>([]);
  const [savedContractors, setSavedContractors] = useState<
    { id: string; contractor_id?: string; google_place_id?: string; snapshot: ContractorListing; created_at: string }[]
  >([]);
  const [requests, setRequests] = useState<RepairRequestRecord[]>([]);
  const [fetching, setFetching] = useState(true);

  // Account edit state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("peshawar");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [prefLang, setPrefLang] = useState<Lang3>("en");
  const [profileMsg, setProfileMsg] = useState("");

  const loadAll = useCallback(async () => {
    setFetching(true);
    try {
      const [iRes, qRes, sRes, rRes] = await Promise.all([
        api.listInspections(),
        api.listQuotations(),
        api.listSavedContractors(),
        api.listRepairRequests(),
      ]);
      setInspections(iRes.inspections || []);
      setQuotations(qRes.quotations || []);
      setSavedContractors(sRes.saved || []);
      setRequests(rRes.requests || []);
    } catch {
      /* ignore */
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setCity(user.city || "peshawar");
      setNeighbourhood(user.neighbourhood || "");
      setPrefLang(user.preferred_language || "en");
      loadAll();
    }
  }, [user, loading, router, loadAll]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    try {
      await api.updateProfile({
        name,
        phone,
        city,
        neighbourhood,
        preferred_language: prefLang,
      });
      await refreshUser();
      setProfileMsg(t({ en: "Profile saved.", ur: "پروفائل محفوظ ہو گیا۔" }));
    } catch (err) {
      setProfileMsg((err as Error).message);
    }
  };

  const handleDeleteInspection = async (id: string) => {
    try {
      await api.deleteInspection(id);
      setInspections((prev) => prev.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleRemoveSaved = async (id: string) => {
    try {
      await api.deleteSavedContractor(id);
      setSavedContractors((prev) => prev.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        t({
          en: "Delete your account and all uploaded photographs and quotations permanently?",
          ur: "کیا آپ واقعی اپنا اکاؤنٹ اور تمام اپ لوڈ کردہ تصاویر مستقل طور پر حذف کرنا چاہتے ہیں؟",
        }),
      )
    )
      return;
    await api.deleteAccount();
    logout();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center p-8">
          <p className="font-extrabold text-ink-soft">{t({ en: "Loading your dashboard…", ur: "ڈیش بورڈ لوڈ ہو رہا ہے…" })}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <div className="rounded-3xl bg-white border-2 border-ink p-6 flex flex-wrap items-center gap-4">
          <Mascot size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-ink ur-tight">
              {t({ en: `Salaam, ${user.name}`, ur: `السلام علیکم، ${user.name}` })}
            </h1>
            <p className="text-sm font-bold text-ink-soft">
              {user.email} · {user.neighbourhood ? `${user.neighbourhood}, ` : ""}
              {user.city.toUpperCase()} ·{" "}
              <span className="rounded-full bg-sun-soft text-ink px-2.5 py-0.5 text-xs font-extrabold uppercase">
                {user.role}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.role === "contractor" && (
              <Link
                href="/worker"
                className="rounded-full bg-sky hover:bg-sky-dark text-white font-extrabold px-4 py-2.5 text-sm inline-flex items-center gap-1.5"
              >
                <HardHat className="h-4 w-4" />
                {t({ en: "Contractor Dashboard", ur: "کاریگر ڈیش بورڈ" })}
              </Link>
            )}
            <Link
              href="/check"
              className="rounded-full bg-brand hover:bg-brand-dark text-white font-extrabold px-5 py-2.5 text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t({ en: "New inspection", ur: "نیا معائنہ" })}
            </Link>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "inspections", icon: ClipboardList, label: { en: `Inspections (${inspections.length})`, ur: `معائنے (${inspections.length})` } },
              { id: "quotes", icon: FileText, label: { en: `Quotations (${quotations.length})`, ur: `تخمینے (${quotations.length})` } },
              { id: "contractors", icon: Bookmark, label: { en: `Saved Kaarigars (${savedContractors.length})`, ur: `محفوظ کاریگر (${savedContractors.length})` } },
              { id: "requests", icon: Wrench, label: { en: `Repair Requests (${requests.length})`, ur: `مرمت کی درخواستیں (${requests.length})` } },
              { id: "account", icon: Settings, label: { en: "Account & Privacy", ur: "اکاؤنٹ اور رازداری" } },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold inline-flex items-center gap-1.5 transition-colors ${
                  active ? "bg-ink border-ink text-white" : "bg-white border-line text-ink hover:border-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Inspections */}
        {tab === "inspections" && (
          <div className="space-y-4">
            {fetching ? (
              <p className="text-ink-soft font-bold">{t({ en: "Loading inspections…", ur: "معائنے لوڈ ہو رہے ہیں…" })}</p>
            ) : inspections.length === 0 ? (
              <div className="rounded-3xl bg-white border-2 border-dashed border-line p-10 text-center">
                <p className="text-lg font-black text-ink">
                  {t({ en: "No saved inspections yet", ur: "ابھی کوئی معائنہ محفوظ نہیں" })}
                </p>
                <p className="mt-1 text-sm font-bold text-ink-soft">
                  {t({ en: "Upload a photo of a home problem to get an AI-assisted inspection.", ur: "گھر کے کسی مسئلے کی تصویر اپ لوڈ کر کے معائنہ شروع کریں۔" })}
                </p>
                <Link
                  href="/check"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand text-white font-extrabold px-6 py-3"
                >
                  {t({ en: "Start your first inspection", ur: "پہلا معائنہ شروع کریں" })}
                  <ArrowRight className="h-4 w-4 flip-rtl" />
                </Link>
              </div>
            ) : (
              inspections.map((insp) => (
                <div key={insp.id} className="rounded-3xl bg-white border-2 border-line p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {insp.image_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveFileUrl(insp.image_urls[0])}
                      alt="Inspection thumbnail"
                      className="h-24 w-32 rounded-2xl object-cover border border-ink shrink-0 bg-sand"
                    />
                  ) : (
                    <div className="h-24 w-32 rounded-2xl bg-sand border border-line grid place-items-center text-xs font-extrabold text-ink-soft shrink-0">
                      {insp.issue_category}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sun-soft border border-ink px-2.5 py-0.5 text-xs font-extrabold text-ink uppercase">
                        {insp.issue_category}
                      </span>
                      <span className="rounded-full bg-leaf-soft text-[#0f6b43] px-2.5 py-0.5 text-xs font-extrabold">
                        {insp.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-bold text-ink-soft latin">{insp.id}</span>
                    </div>
                    <h3 className="text-lg font-black text-ink">
                      {insp.diagnosis || insp.initial_analysis?.summary_en || insp.description || t({ en: "Home Inspection", ur: "گھر کا معائنہ" })}
                    </h3>
                    <p className="text-xs font-bold text-ink-soft">
                      {insp.room} · {insp.city} · {insp.area_sqft} sq ft · {new Date(insp.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/check?id=${encodeURIComponent(insp.id)}`}
                      className="rounded-2xl bg-ink hover:bg-black text-white font-extrabold px-4 py-2.5 text-sm inline-flex items-center gap-1.5"
                    >
                      {t({ en: "Resume / Report", ur: "جاری رکھیں / رپورٹ" })}
                      <ArrowRight className="h-4 w-4 flip-rtl" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteInspection(insp.id)}
                      className="h-10 w-10 rounded-xl border border-line hover:border-danger text-ink-soft hover:text-danger grid place-items-center"
                      title={t({ en: "Delete inspection", ur: "حذف کریں" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Quotations */}
        {tab === "quotes" && (
          <div className="space-y-4">
            {quotations.length === 0 ? (
              <div className="rounded-3xl bg-white border-2 border-dashed border-line p-10 text-center">
                <p className="text-lg font-black text-ink">
                  {t({ en: "No uploaded contractor quotations yet", ur: "ابھی کوئی ٹھیکیدار کا تخمینہ اپ لوڈ نہیں ہوا" })}
                </p>
              </div>
            ) : (
              quotations.map((q) => (
                <div key={q.id} className="rounded-3xl bg-white border-2 border-line p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-ink">
                        {q.contractor_name || t({ en: "Contractor Quotation", ur: "ٹھیکیدار کا تخمینہ" })}
                      </p>
                      <p className="text-xs font-bold text-ink-soft">
                        {q.created_at ? new Date(q.created_at).toLocaleDateString() : ""} · {q.line_items?.length || 0}{" "}
                        {t({ en: "line items", ur: "آئٹمز" })}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs font-bold text-ink-soft">{t({ en: "Audited sum", ur: "آڈٹ شدہ جوڑ" })}</p>
                      <p className="text-xl font-black text-ink latin">{money(q.audited_total || 0)}</p>
                    </div>
                  </div>
                  {q.findings?.length > 0 && (
                    <p className="text-sm font-bold text-[#8a5a00] bg-amber-soft rounded-xl px-3 py-1.5">
                      {q.findings.length} {t({ en: "audit findings recorded", ur: "آڈٹ نکات ملے" })}
                    </p>
                  )}
                  {q.inspection_id && (
                    <Link
                      href={`/check?id=${encodeURIComponent(q.inspection_id)}`}
                      className="inline-flex items-center gap-1 text-sm font-extrabold text-sky-dark hover:underline"
                    >
                      {t({ en: "Open linked inspection report", ur: "منسلک معائنہ رپورٹ کھولیں" })}
                      <ArrowRight className="h-3.5 w-3.5 flip-rtl" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Saved Contractors */}
        {tab === "contractors" && (
          <div className="space-y-3">
            {savedContractors.length === 0 ? (
              <div className="rounded-3xl bg-white border-2 border-dashed border-line p-10 text-center">
                <p className="text-lg font-black text-ink">
                  {t({ en: "No saved contractors yet", ur: "ابھی کوئی کاریگر محفوظ نہیں" })}
                </p>
              </div>
            ) : (
              savedContractors.map((item) => {
                const c = item.snapshot;
                return (
                  <div key={item.id} className="rounded-3xl bg-white border-2 border-line p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-black text-ink">{c.business_name}</p>
                        {c.listing_status === "checkster_verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft text-[#0f6b43] text-xs font-extrabold px-2.5 py-0.5">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {t({ en: "Checkster Verified", ur: "چیکسٹر تصدیق شدہ" })}
                          </span>
                        ) : c.listing_status === "checkster_registered" ? (
                          <span className="rounded-full bg-sky-soft text-sky-dark text-xs font-extrabold px-2.5 py-0.5">
                            {t({ en: "Checkster Registered", ur: "چیکسٹر رجسٹرڈ" })}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-soft text-[#8a5a00] text-xs font-extrabold px-2.5 py-0.5">
                            {t({ en: "Google Maps Listed (External)", ur: "گوگل میپس لسٹنگ (بیرونی)" })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-ink-soft">
                        {(c.service_categories || []).join(", ")} · {c.address || c.city}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.google_maps_url && (
                        <a
                          href={c.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-line px-3 py-1.5 text-xs font-extrabold text-ink inline-flex items-center gap-1"
                        >
                          Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(item.id)}
                        className="h-9 w-9 rounded-xl border border-line hover:border-danger text-ink-soft hover:text-danger grid place-items-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 4: Repair Requests */}
        {tab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-3xl bg-white border-2 border-dashed border-line p-10 text-center">
                <p className="text-lg font-black text-ink">
                  {t({ en: "No active repair requests", ur: "ابھی مرمت کی کوئی درخواست نہیں" })}
                </p>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-3xl bg-white border-2 border-line p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-extrabold text-ink uppercase">
                        {r.trade}
                      </span>
                      <span className="rounded-full bg-leaf-soft text-[#0f6b43] px-2.5 py-0.5 text-xs font-extrabold uppercase">
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-black text-ink">{r.title}</p>
                    <p className="text-xs font-bold text-ink-soft">
                      {r.neighbourhood ? `${r.neighbourhood}, ` : ""}
                      {r.city} · {r.scheduled_date || t({ en: "Flexible", ur: "جلد" })}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs font-bold text-ink-soft">{t({ en: "Offered price", ur: "پیشکش" })}</p>
                    <p className="text-xl font-black text-ink latin">{money(r.offered_price)}</p>
                    {r.counter_price && (
                      <p className="text-xs font-extrabold text-amber">
                        {t({ en: "Counter offer:", ur: "کاریگر کی قیمت:" })} {money(r.counter_price)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Account & Privacy */}
        {tab === "account" && (
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleSaveProfile} className="rounded-3xl bg-white border-2 border-line p-6 space-y-4">
              <h2 className="text-xl font-black text-ink">{t({ en: "Account Settings", ur: "اکاؤنٹ کی ترتیبات" })}</h2>
              {profileMsg && (
                <p className="rounded-xl bg-leaf-soft text-[#0f6b43] px-3 py-2 text-sm font-bold">{profileMsg}</p>
              )}
              <div>
                <label className="block text-sm font-extrabold text-ink">{t({ en: "Full name", ur: "پورا نام" })}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-extrabold text-ink">{t({ en: "Phone", ur: "فون نمبر" })}</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold latin"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-ink">{t({ en: "City", ur: "شہر" })}</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold"
                  >
                    {CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(c.label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-ink">{t({ en: "Neighbourhood", ur: "علاقہ" })}</label>
                  <input
                    value={neighbourhood}
                    onChange={(e) => setNeighbourhood(e.target.value)}
                    className="mt-1 w-full h-11 rounded-xl border-2 border-line focus:border-ink outline-none px-3 font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-ink text-white font-black"
              >
                {t({ en: "Save changes", ur: "تبدیلیاں محفوظ کریں" })}
              </button>
            </form>

            <div className="rounded-3xl bg-white border-2 border-line p-6 space-y-4">
              <h2 className="text-xl font-black text-ink">{t({ en: "Privacy & Data Controls", ur: "رازداری اور ڈیٹا کنٹرول" })}</h2>
              <p className="text-sm text-ink-soft font-semibold leading-relaxed">
                {t({
                  en: "Your uploaded home photographs and contractor quotations are stored in private storage with expiring signed URLs and are stripped of GPS EXIF metadata before AI analysis.",
                  ur: "آپ کی اپ لوڈ کردہ تصاویر اور تخمینے نجی سٹوریج میں محفوظ ہوتے ہیں اور تجزیے سے پہلے ان سے GPS ڈیٹا ہٹا دیا جاتا ہے۔",
                })}
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full h-12 rounded-2xl border-2 border-danger bg-danger-soft text-danger font-black hover:bg-danger hover:text-white transition-colors"
              >
                {t({ en: "Delete my account & all uploaded files", ur: "میرا اکاؤنٹ اور تمام فائلیں حذف کریں" })}
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
