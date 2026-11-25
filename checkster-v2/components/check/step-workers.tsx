"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Send,
  Star,
  X,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AREAS, TRADES, WORKERS, tradeLabel, type Trade, type WorkerOffer } from "@/lib/data";
import { api, type ContractorListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DemoTag } from "@/components/site/brand";
import { TradePicture } from "@/components/site/illustrations";
import { Card, CardTitle, Chip } from "./shell";
import { NeighbourhoodMap, TONE_COLOR } from "./map";

export const SUGGESTED: Record<Trade, number> = {
  plumber: 4500,
  mason: 6000,
  waterproofing: 8000,
  painter: 5000,
  electrician: 2500,
  carpenter: 4000,
};

export type WhenId = "today" | "tomorrow" | "week";
const WHEN: { id: WhenId; label: { en: string; ur: string } }[] = [
  { id: "today", label: { en: "Today", ur: "آج" } },
  { id: "tomorrow", label: { en: "Tomorrow", ur: "کل" } },
  { id: "week", label: { en: "This week", ur: "اس ہفتے" } },
];

export function StepWorkers({
  trade,
  setTrade,
  offer,
  setOffer,
  when,
  setWhen,
  sent,
  setSent,
  city,
  neighbourhood,
  inspectionId,
  onAccept,
}: {
  trade: Trade;
  setTrade: (t: Trade) => void;
  offer: number;
  setOffer: (n: number) => void;
  when: WhenId;
  setWhen: (w: WhenId) => void;
  sent: boolean;
  setSent: (b: boolean) => void;
  city: string;
  neighbourhood: string;
  inspectionId?: string;
  onAccept: (w: WorkerOffer, price: number) => void;
}) {
  const { t, money } = useLang();
  const { user } = useAuth();
  const base = SUGGESTED[trade];
  const low = Math.round((base * 0.7) / 100) * 100;
  const high = Math.round((base * 1.3) / 100) * 100;
  const pct = Math.min(100, Math.max(0, ((offer - low) / (high - low)) * 100));

  const [checksterContractors, setChecksterContractors] = useState<ContractorListing[]>([]);
  const [gmapsListings, setGmapsListings] = useState<ContractorListing[]>([]);
  const [mapsConfigured, setMapsConfigured] = useState(false);
  const [mapsMsg, setMapsMsg] = useState("");
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showDemoOffers, setShowDemoOffers] = useState(true);

  const runDiscovery = useCallback(
    async (lat?: number, lng?: number) => {
      setLoadingDiscovery(true);
      try {
        const res = await api.discoverContractors({
          category: trade,
          city: city || "peshawar",
          neighbourhood,
          lat,
          lng,
        });
        setChecksterContractors(res.checkster_contractors || []);
        setGmapsListings(res.google_maps_listings || []);
        setMapsConfigured(res.maps_configured);
        setMapsMsg(res.maps_setup_message || res.maps_error || "");
      } catch {
        /* ignore */
      } finally {
        setLoadingDiscovery(false);
      }
    },
    [trade, city, neighbourhood],
  );

  useEffect(() => {
    runDiscovery(coords?.lat, coords?.lng);
  }, [runDiscovery, coords]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* user declined geolocation; manual city/neighbourhood remains active */
      },
    );
  };

  const handleSaveContractor = async (c: ContractorListing) => {
    if (!user) return;
    try {
      await api.saveContractor(c);
      setSavedIds((prev) => [...prev, c.id]);
    } catch {
      /* ignore */
    }
  };

  const handleBookChecksterContractor = async (c: ContractorListing) => {
    const price = c.daily_rate || offer;
    if (user) {
      try {
        await api.createRepairRequest({
          inspection_id: inspectionId,
          contractor_id: c.is_external_listing ? undefined : c.id,
          trade,
          title: `${trade.toUpperCase()} repair (${city})`,
          description: `Requested via Checkster discovery for ${c.business_name}`,
          city,
          neighbourhood,
          offered_price: price,
          scheduled_date: when,
        });
      } catch {
        /* ignore */
      }
    }
    const asWorker: WorkerOffer = {
      id: c.id,
      name: { en: c.business_name, ur: c.business_name },
      initials: c.business_name.slice(0, 2).toUpperCase(),
      trade,
      rating: c.rating || 4.8,
      jobs: c.review_count || c.user_ratings_total || 1,
      years: c.experience_years || 5,
      km: c.distance_km || 2.0,
      eta: 20,
      extra: 0,
      pin: { x: 268, y: 92 },
      tone: "bg-leaf",
    };
    onAccept(asWorker, price);
  };

  if (!sent) {
    return (
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <CardTitle>{t({ en: "1. Select service category & location", ur: "1۔ کاریگر کی قسم اور علاقہ منتخب کریں" })}</CardTitle>
            <button
              type="button"
              onClick={requestGeolocation}
              className="rounded-full border-2 border-line hover:border-ink bg-cream px-3 py-1.5 text-xs font-extrabold text-ink inline-flex items-center gap-1.5"
            >
              <Navigation className="h-3.5 w-3.5 text-brand" />
              {coords
                ? t({ en: "Using your GPS location", ur: "آپ کی لوکیشن استعمال ہو رہی ہے" })
                : t({ en: "Use my current location (optional)", ur: "میری موجودہ لوکیشن استعمال کریں" })}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TRADES.map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => {
                  setTrade(tr.id);
                  setOffer(SUGGESTED[tr.id]);
                }}
                aria-pressed={trade === tr.id}
                className={`rounded-2xl border-2 p-2 flex flex-col items-center text-center ${
                  trade === tr.id ? "border-ink bg-sun-soft" : "border-line bg-white hover:border-ink"
                }`}
              >
                <TradePicture trade={tr.id} size={52} bg={trade === tr.id ? "#fff" : "var(--sand)"} />
                <span className="mt-1 text-xs sm:text-sm font-extrabold text-ink leading-tight ur-tight">{t(tr.label)}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Live Directory & Google Maps Platform Results */}
        <Card>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle
              sub={t({
                en: `Showing providers in ${neighbourhood ? `${neighbourhood}, ` : ""}${city.toUpperCase()}. Strictly distinguishes Checkster-Verified, Checkster-Registered, and external Google Maps listings.`,
                ur: `${city.toUpperCase()} میں دستیاب کاریگر۔ چیکسٹر تصدیق شدہ، رجسٹرڈ اور بیرونی گوگل میپس لسٹنگ الگ دکھائی گئی ہیں۔`,
              })}
            >
              {t({ en: "2. Local Contractor Directory & Google Maps Discovery", ur: "2۔ مقامی کاریگر اور گوگل میپس ڈسکوری" })}
            </CardTitle>
            {loadingDiscovery && <Loader2 className="h-5 w-5 animate-spin text-brand" />}
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs font-extrabold">
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft text-[#0f6b43] px-3 py-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t({ en: "Checkster-Verified (Admin checked)", ur: "چیکسٹر تصدیق شدہ" })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft text-sky-dark px-3 py-1">
              {t({ en: "Checkster-Registered (Independent account)", ur: "چیکسٹر رجسٹرڈ" })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft text-[#8a5a00] px-3 py-1">
              {t({ en: "Google Maps-Listed (External business — unverified)", ur: "گوگل میپس لسٹنگ (بیرونی)" })}
            </span>
          </div>

          {/* Checkster Registered & Verified Contractors */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-ink-soft uppercase">
              {t({ en: "Checkster Worker Directory", ur: "چیکسٹر کاریگر ڈائریکٹری" })} ({checksterContractors.length})
            </p>
            {checksterContractors.length === 0 ? (
              <p className="rounded-2xl bg-cream border border-line p-3 text-sm font-bold text-ink-soft">
                {t({
                  en: `No registered Checkster ${trade} found in ${city} yet. Contractors can register at /worker.`,
                  ur: `ابھی اس شہر میں کوئی رجسٹرڈ کاریگر موجود نہیں۔ کاریگر /worker پر رجسٹر ہو سکتے ہیں۔`,
                })}
              </p>
            ) : (
              checksterContractors.map((c) => (
                <div key={c.id} className="rounded-2xl border-2 border-line p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-ink text-lg">{c.business_name}</p>
                      {c.listing_status === "checkster_verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft text-[#0f6b43] text-xs font-extrabold px-2.5 py-0.5">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {t({ en: "Checkster-Verified", ur: "چیکسٹر تصدیق شدہ" })}
                        </span>
                      ) : (
                        <span className="rounded-full bg-sky-soft text-sky-dark text-xs font-extrabold px-2.5 py-0.5">
                          {t({ en: "Checkster-Registered", ur: "چیکسٹر رجسٹرڈ" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-ink-soft">
                      {c.owner_name} · {c.neighbourhood ? `${c.neighbourhood}, ` : ""}
                      {c.city} · {c.experience_years} {t({ en: "yrs exp", ur: "سال تجربہ" })} ·{" "}
                      <span className="latin">{money(c.daily_rate || 2000)}/day</span>
                    </p>
                    {c.description && <p className="text-xs text-ink font-semibold">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        type="button"
                        onClick={() => handleSaveContractor(c)}
                        className="h-10 px-3 rounded-xl border border-line hover:border-ink text-xs font-extrabold inline-flex items-center gap-1"
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {savedIds.includes(c.id) ? t({ en: "Saved", ur: "محفوظ" }) : t({ en: "Save", ur: "محفوظ کریں" })}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBookChecksterContractor(c)}
                      className="h-10 px-4 rounded-xl bg-leaf text-white text-sm font-black"
                    >
                      {t({ en: "Request Repair", ur: "درخواست بھیجیں" })}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Google Maps Platform External Listings */}
          <div className="mt-5 pt-4 border-t border-line space-y-3">
            <p className="text-xs font-extrabold text-ink-soft uppercase">
              {t({ en: "Google Maps Platform — External Business Listings", ur: "گوگل میپس — بیرونی کاروباری لسٹنگ" })} ({gmapsListings.length})
            </p>
            {!mapsConfigured && (
              <div className="rounded-2xl bg-cream border border-line p-3.5 text-xs font-semibold text-ink-soft flex gap-2.5 items-start">
                <Info className="h-4 w-4 text-ink shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-ink">
                    {t({ en: "Google Maps API setup notice:", ur: "گوگل میپس اے پی آئی نوٹس:" })}
                  </p>
                  <p>{mapsMsg}</p>
                </div>
              </div>
            )}
            {gmapsListings.map((g) => (
              <div key={g.id} className="rounded-2xl bg-cream/60 border border-line p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-ink">{g.business_name}</p>
                    <span className="rounded-full bg-amber-soft text-[#8a5a00] text-[11px] font-extrabold px-2.5 py-0.5">
                      {t({ en: "Google Maps-Listed (External)", ur: "گوگل میپس لسٹنگ (بیرونی)" })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-ink-soft flex flex-wrap items-center gap-2">
                    <span>{g.address}</span>
                    {g.rating && (
                      <span className="inline-flex items-center gap-0.5 latin">
                        <Star className="h-3.5 w-3.5 fill-sun text-sun" /> {g.rating} ({g.user_ratings_total})
                      </span>
                    )}
                    {g.distance_km !== null && g.distance_km !== undefined && (
                      <span className="latin">{g.distance_km} km</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <button
                      type="button"
                      onClick={() => handleSaveContractor(g)}
                      className="h-9 px-3 rounded-xl border border-line bg-white text-xs font-extrabold inline-flex items-center gap-1"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      {savedIds.includes(g.id) ? t({ en: "Saved", ur: "محفوظ" }) : t({ en: "Save", ur: "محفوظ کریں" })}
                    </button>
                  )}
                  {g.google_maps_url && (
                    <a
                      href={g.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-xl bg-ink text-white text-xs font-extrabold inline-flex items-center gap-1"
                    >
                      Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 3. Offer your price */}
        <Card>
          <CardTitle
            sub={t({
              en: "Or broadcast your price offer to nearby kaarigars.",
              ur: "یا قریبی کاریگروں کو اپنی پیشکش بھیجیں۔",
            })}
          >
            {t({ en: "3. Broadcast an offer price", ur: "3۔ اپنی قیمت کی پیشکش لگائیں" })}
          </CardTitle>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setOffer(Math.max(500, offer - 500))}
              className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sand"
              aria-label="-500"
            >
              <Minus className="h-6 w-6" />
            </button>
            <p className="text-3xl sm:text-5xl font-black text-ink text-center latin whitespace-nowrap">{money(offer)}</p>
            <button
              type="button"
              onClick={() => setOffer(offer + 500)}
              className="h-14 w-14 rounded-full border-2 border-ink bg-white grid place-items-center hover:bg-sand"
              aria-label="+500"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6">
            <div className="relative h-3 rounded-full bg-amber-soft">
              <div className="absolute inset-y-0 start-[20%] end-[20%] rounded-full bg-leaf/70" />
              <span
                className="absolute -top-1.5 h-6 w-6 rounded-full bg-ink border-4 border-white shadow"
                style={{ insetInlineStart: `calc(${pct}% - 12px)` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-bold text-ink-soft latin">
              <span>{money(low)}</span>
              <span className="text-[#0f6b43]">{t({ en: "Fair range", ur: "مناسب حد" })}</span>
              <span>{money(high)}</span>
            </div>
          </div>

          <p className="font-extrabold text-ink-soft text-sm mb-2 mt-6">{t({ en: "When?", ur: "کب؟" })}</p>
          <div className="flex flex-wrap gap-2">
            {WHEN.map((w) => (
              <Chip key={w.id} active={when === w.id} onClick={() => setWhen(w.id)}>
                {t(w.label)}
              </Chip>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Offers
      trade={trade}
      offer={offer}
      checksterContractors={checksterContractors}
      showDemo={showDemoOffers}
      setShowDemo={setShowDemoOffers}
      onEdit={() => setSent(false)}
      onAccept={onAccept}
    />
  );
}

function Offers({
  trade,
  offer,
  checksterContractors,
  showDemo,
  setShowDemo,
  onEdit,
  onAccept,
}: {
  trade: Trade;
  offer: number;
  checksterContractors: ContractorListing[];
  showDemo: boolean;
  setShowDemo: (b: boolean) => void;
  onEdit: () => void;
  onAccept: (w: WorkerOffer, price: number) => void;
}) {
  const { t, money } = useLang();
  const realAsOffers: WorkerOffer[] = checksterContractors.map((c, idx) => ({
    id: c.id,
    name: { en: c.business_name, ur: c.business_name },
    initials: c.business_name.slice(0, 2).toUpperCase(),
    trade,
    rating: c.rating || 4.8,
    jobs: c.review_count || 12,
    years: c.experience_years || 5,
    km: c.distance_km || 1.8,
    eta: 15,
    extra: 0,
    pin: { x: 120 + idx * 60, y: 110 + idx * 30 },
    tone: "bg-leaf",
  }));

  const demoPool = [...WORKERS]
    .sort((a, b) => (a.trade === trade ? 0 : 1) - (b.trade === trade ? 0 : 1) || a.km - b.km)
    .slice(0, 4);
  const pool = [...realAsOffers, ...(showDemo ? demoPool : [])];
  const [declined, setDeclined] = useState<string[]>([]);
  const visible = pool.filter((w) => !declined.includes(w.id));
  const area = t(AREAS[0].label);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink text-white p-4 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sun" />
        </span>
        <p className="font-bold flex-1">
          {t({ en: `${visible.length} available providers. Pick the one you like.`, ur: `${visible.length} کاریگر دستیاب ہیں۔ جو پسند ہو چنیں۔` })}
        </p>
        <span className="font-black latin">{money(offer)}</span>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full bg-white/10 hover:bg-white/20 p-2"
          aria-label={t({ en: "Change my offer", ur: "پیشکش بدلیں" })}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <NeighbourhoodMap
        pins={visible.map((w) => ({ id: w.id, x: w.pin.x, y: w.pin.y, label: w.initials, color: TONE_COLOR[w.tone] || "var(--leaf)" }))}
        homeLabel={t({ en: "You", ur: "آپ" })}
        areaLabel={area}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <DemoTag />
          <span className="text-xs font-bold text-ink-soft">
            {t({
              en: "Sample kaarigar offers are explicitly labelled as Demo data",
              ur: "نمونہ کاریگر پروفائل واضح طور پر ڈیمو کے طور پر دکھائے گئے ہیں",
            })}
          </span>
        </div>
        {realAsOffers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="text-xs font-extrabold text-sky-dark underline"
          >
            {showDemo ? t({ en: "Hide sample offers", ur: "ڈیمو پروفائل چھپائیں" }) : t({ en: "Show sample offers", ur: "ڈیمو پروفائل دکھائیں" })}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((w) => {
          const price = offer + w.extra;
          const isReal = w.id.startsWith("ctr_");
          return (
            <div key={w.id} className="rounded-3xl bg-white border-2 border-line p-4 pop-in">
              <div className="flex items-center gap-3">
                <span
                  className={`h-14 w-14 shrink-0 rounded-full ${w.tone} text-white text-lg font-black grid place-items-center border-2 border-ink latin`}
                >
                  {w.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-ink text-lg">{t(w.name)}</p>
                    {isReal ? (
                      <span className="rounded-full bg-leaf-soft text-[#0f6b43] text-xs font-extrabold px-2 py-0.5">
                        {t({ en: "Checkster Directory", ur: "چیکسٹر کاریگر" })}
                      </span>
                    ) : (
                      <DemoTag />
                    )}
                  </div>
                  <p className="text-sm text-ink-soft font-bold flex flex-wrap items-center gap-x-3">
                    <span>{t(tradeLabel(w.trade))}</span>
                    <span className="inline-flex items-center gap-1 latin">
                      <Star className="h-3.5 w-3.5 fill-sun text-sun" /> {w.rating} ({w.jobs})
                    </span>
                    <span>
                      {w.years} {t({ en: "yrs", ur: "سال" })}
                    </span>
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className={`text-xl font-black latin ${w.extra ? "text-amber" : "text-ink"}`}>{money(price)}</p>
                  <p className="text-xs font-bold text-ink-soft inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {w.eta} {t({ en: "min", ur: "منٹ" })} · <span className="latin">{w.km} km</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={() => setDeclined((d) => [...d, w.id])}
                  className="h-12 px-5 rounded-2xl bg-sand hover:bg-line font-extrabold text-ink-soft inline-flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" /> {t({ en: "No thanks", ur: "نہیں شکریہ" })}
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(w, price)}
                  className="h-12 rounded-2xl bg-leaf hover:brightness-95 text-white font-black text-lg"
                >
                  {t({ en: `Select & Generate Report (${money(price)})`, ur: `${money(price)} منتخب کریں اور رپورٹ بنائیں` })}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
