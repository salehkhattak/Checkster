"use client";

import { OBSERVATIONS } from "@/lib/data";

/** A drawn "photo" of a damp wall, used when the homeowner has no photo. */
export function SampleWall({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Sample photo of a damp wall">
      <defs>
        <radialGradient id="ck-damp" cx="40%" cy="88%" r="58%">
          <stop offset="0%" stopColor="#7a6a55" stopOpacity="0.8" />
          <stop offset="55%" stopColor="#9c8a70" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#c9bba3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ck-wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f1ebe0" />
          <stop offset="100%" stopColor="#e5dccb" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ck-wall)" />
      <path d="M30 300 C 40 220, 90 196, 122 214 C 150 160, 214 168, 232 206 C 270 190, 304 232, 296 300 Z" fill="url(#ck-damp)" />
      <path d="M24 158 C 58 140, 96 168, 132 150" stroke="#8a7a62" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="248" cy="118" rx="22" ry="12" fill="#f6f1e8" stroke="#b9a988" strokeWidth="1.5" />
      <ellipse cx="282" cy="140" rx="14" ry="8" fill="#f6f1e8" stroke="#b9a988" strokeWidth="1.5" />
      <path d="M228 152 l18 -6 l10 12 l-14 8 z" fill="#d8ccb6" stroke="#a89878" strokeWidth="1.2" />
      {[
        [200, 238],
        [214, 250],
        [236, 244],
        [252, 258],
        [226, 262],
        [262, 240],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="#fbf9f4" />
      ))}
      <rect y="282" width="400" height="18" fill="#cbbfa9" />
      <rect y="280" width="400" height="3" fill="#b3a68e" />
      <rect x="334" y="232" width="26" height="30" rx="3" fill="#fbf8f2" stroke="#b9ad97" />
      <circle cx="343" cy="247" r="2.2" fill="#9c907a" />
      <circle cx="351" cy="247" r="2.2" fill="#9c907a" />
    </svg>
  );
}

/** The photo (or the sample) with numbered boxes on what the scan noticed. */
export function PhotoView({ src, boxes = 0, scanning = false }: { src: string | null; boxes?: number; scanning?: boolean }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-ink bg-sand">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <SampleWall className="absolute inset-0 h-full w-full" />
      )}
      {scanning && (
        <>
          <div className="absolute inset-0 bg-ink/10" />
          <div className="absolute inset-x-0 h-1 bg-brand shadow-[0_0_0_6px_rgba(232,71,28,0.25)] scan-line" />
        </>
      )}
      {OBSERVATIONS.slice(0, boxes).map((o, i) => (
        <div
          key={o.id}
          className="absolute rounded-xl border-[3px] border-sun bg-sun/15 pop-in"
          style={{ left: `${o.box.x}%`, top: `${o.box.y}%`, width: `${o.box.w}%`, height: `${o.box.h}%` }}
        >
          <span className="absolute -top-3.5 -left-3.5 h-7 w-7 rounded-full bg-sun border-2 border-ink text-ink text-sm font-black grid place-items-center latin">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
