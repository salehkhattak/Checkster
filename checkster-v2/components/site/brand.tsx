"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

/** The Checkster mascot: a smiling little house. mood="think" looks up while it works. */
export function Mascot({ size = 48, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "think" | "wink"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M10 30 L32 11 L54 30 V52 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 Z"
        fill="var(--sun)"
        stroke="var(--ink)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* chimney is a tick mark: "checked" */}
      <path d="M41 13 l4 4 l8 -9" stroke="var(--brand)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {mood === "think" ? (
        <>
          <circle cx="25" cy="34" r="3" fill="var(--ink)" />
          <circle cx="39" cy="34" r="3" fill="var(--ink)" />
          <path d="M27 46 h10" stroke="var(--ink)" strokeWidth="3.2" strokeLinecap="round" />
        </>
      ) : mood === "wink" ? (
        <>
          <path d="M22 37 q3 -3 6 0" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="36" r="3" fill="var(--ink)" />
          <path d="M24 44 q8 7 16 0" stroke="var(--ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="25" cy="36" r="3" fill="var(--ink)" />
          <circle cx="39" cy="36" r="3" fill="var(--ink)" />
          <path d="M24 44 q8 7 16 0" stroke="var(--ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="19" cy="43" r="2.6" fill="var(--brand)" opacity="0.35" />
      <circle cx="45" cy="43" r="2.6" fill="var(--brand)" opacity="0.35" />
    </svg>
  );
}

export function Logo({ href = "/", worker = false }: { href?: string; worker?: boolean }) {
  const { t } = useLang();
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0 wiggle" aria-label="Checkster home">
      <Mascot size={38} />
      <span className="text-[1.45rem] font-black tracking-tight text-ink ur-tight">
        {t({ en: "checkster", ur: "چیکسٹر" })}
      </span>
      {worker && (
        <span className="rounded-full bg-sky text-white text-xs font-extrabold px-2.5 py-0.5">
          {t({ en: "Kaarigar", ur: "کاریگر" })}
        </span>
      )}
    </Link>
  );
}

/** One tap to switch the whole site between English and Urdu. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { isUrdu, toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-full border-2 border-ink px-3.5 py-1.5 text-sm font-extrabold text-ink hover:bg-sun transition-colors ${className}`}
      aria-label={isUrdu ? "Switch to English" : "اردو میں دیکھیں"}
    >
      {isUrdu ? <span className="latin">English</span> : <span style={{ fontFamily: "var(--font-urdu)" }}>اردو</span>}
    </button>
  );
}

/** Small amber label for anything that is demo / sample data. */
export function DemoTag({ className = "" }: { className?: string }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full bg-amber-soft text-[#8a5a00] text-[11px] font-extrabold px-2 py-0.5 ${className}`}>
      {t({ en: "Demo data", ur: "ڈیمو ڈیٹا" })}
    </span>
  );
}

/** Green label for real government figures. */
export function OfficialTag({ className = "" }: { className?: string }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full bg-leaf-soft text-[#0f6b43] text-[11px] font-extrabold px-2 py-0.5 ${className}`}>
      {t({ en: "Official rate", ur: "سرکاری ریٹ" })}
    </span>
  );
}
