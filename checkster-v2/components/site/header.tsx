"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { LangToggle, Logo } from "./brand";

export function SiteHeader() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const links = [
    { href: "/#how", label: t({ en: "How it works", ur: "یہ کیسے کام کرتا ہے" }) },
    { href: "/#prices", label: t({ en: "Sarkari rates", ur: "سرکاری ریٹ" }) },
    { href: "/worker", label: t({ en: "For kaarigars", ur: "کاریگروں کے لیے" }) },
  ];
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-3">
        <Logo />
        <nav className="hidden lg:flex items-center gap-5 ms-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[15px] font-bold text-ink-soft hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <LangToggle />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white hover:bg-sun-soft px-3.5 py-1.5 text-sm font-extrabold text-ink"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-full bg-ink text-white px-3 py-1.5 text-xs font-extrabold"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t({ en: "Admin", ur: "ایڈمن" })}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white hover:border-ink px-2.5 py-1.5 text-xs font-bold text-ink-soft hover:text-ink"
                title={t({ en: "Log out", ur: "لاگ آؤٹ" })}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-white hover:border-ink px-3.5 py-1.5 text-sm font-extrabold text-ink"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t({ en: "Log in", ur: "لاگ ان" })}</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-sun-soft hover:bg-sun px-3.5 py-1.5 text-sm font-extrabold text-ink"
              >
                <UserPlus className="h-4 w-4" />
                {t({ en: "Sign up", ur: "اکاؤنٹ بنائیں" })}
              </Link>
            </>
          )}
          <Link
            href="/check"
            className="whitespace-nowrap rounded-full bg-brand hover:bg-brand-dark text-white font-extrabold px-4 sm:px-5 py-2 text-sm sm:text-[15px] transition-colors"
          >
            <span className="sm:hidden">{t({ en: "Check", ur: "چیک کریں" })}</span>
            <span className="hidden sm:inline">{t({ en: "Start a check", ur: "چیک شروع کریں" })}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
