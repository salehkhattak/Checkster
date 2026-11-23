// Hand-drawn style line illustrations (ink outline + one soft colour),
// inspired by Lemonade's drawings, but showing Pakistani homes:
// ceiling fan, matka, seelan on plaster walls.

import type { ReactNode } from "react";
import type { ProblemId, Trade } from "@/lib/data";

const S = { stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Frame({ children, size = 120, bg = "var(--sand)", className = "" }: { children: ReactNode; size?: number; bg?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill={bg} />
      {children}
    </svg>
  );
}

export function IllDamp(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <rect x="34" y="34" width="92" height="94" rx="6" fill="#fff" {...S} />
      <path d="M37 125 C 40 100, 58 94, 68 104 C 76 86, 98 90, 100 104 C 108 100, 118 108, 123 125 Z" fill="#e6d3b3" />
      <path d="M44 125 C 48 110, 60 108, 66 114 C 74 102, 90 104, 92 116 C 98 114, 104 118, 108 125 Z" fill="#d6bf98" />
      <circle cx="58" cy="118" r="1.8" fill="#fff" />
      <circle cx="80" cy="113" r="1.8" fill="#fff" />
      <circle cx="70" cy="121" r="1.8" fill="#fff" />
      <path d="M90 60 q10 -8 16 2 q-9 3 -16 -2 z" fill="#fff" {...S} strokeWidth={2.5} />
      <path d="M56 66 q7 -5 11 1" fill="none" {...S} strokeWidth={2.5} />
      <path d="M36 110 h88" {...S} strokeWidth={2} opacity="0.25" />
      <path d="M118 44 c0 0 -6 8 -6 12 a6 6 0 0 0 12 0 c0 -4 -6 -12 -6 -12 z" fill="var(--sky-soft)" {...S} strokeWidth={2.5} />
    </Frame>
  );
}

export function IllLeak(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <path d="M22 62 h46" {...S} strokeWidth={12} stroke="var(--ink)" />
      <path d="M22 62 h46" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d="M92 62 h46" {...S} strokeWidth={12} />
      <path d="M92 62 h46" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <rect x="64" y="50" width="32" height="24" rx="5" fill="var(--sun)" {...S} />
      <path d="M80 80 c0 0 -6 9 -6 13 a6 6 0 0 0 12 0 c0 -4 -6 -13 -6 -13 z" fill="var(--sky-soft)" {...S} strokeWidth={2.5} />
      <path d="M80 104 c0 0 -4 6 -4 9 a4 4 0 0 0 8 0 c0 -3 -4 -9 -4 -9 z" fill="var(--sky-soft)" {...S} strokeWidth={2.2} />
      <path d="M56 128 h48 l-6 18 h-36 z" fill="#fff" {...S} />
      <path d="M60 136 h40" stroke="var(--sky)" strokeWidth={3} strokeLinecap="round" />
    </Frame>
  );
}

export function IllCrack(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <rect x="32" y="34" width="96" height="92" rx="6" fill="#fff" {...S} />
      <path d="M32 64 h96 M32 94 h96 M64 34 v30 M100 64 v30 M70 94 v32" {...S} strokeWidth={2} opacity="0.25" />
      <path d="M84 36 l-8 18 l10 8 l-12 16 l9 10 l-11 18 l6 20" fill="none" {...S} strokeWidth={3.2} />
      <path d="M86 62 l12 4" {...S} strokeWidth={2.4} />
    </Frame>
  );
}

export function IllRoof(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <path d="M36 50 a14 14 0 0 1 26 -6 a12 12 0 0 1 22 8 h2 a9 9 0 0 1 0 18 h-50 a10 10 0 0 1 0 -20 z" fill="#fff" {...S} strokeWidth={2.6} />
      <path d="M46 80 l-3 8 M62 80 l-3 8 M78 80 l-3 8" stroke="var(--sky)" strokeWidth={3} strokeLinecap="round" />
      <path d="M40 112 L80 84 L120 112" fill="var(--brand-soft)" {...S} />
      <rect x="50" y="110" width="60" height="30" fill="#fff" {...S} />
      <path d="M86 118 c0 0 -4 6 -4 9 a4 4 0 0 0 8 0 c0 -3 -4 -9 -4 -9 z" fill="var(--sky-soft)" {...S} strokeWidth={2} />
    </Frame>
  );
}

export function IllWiring(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p} bg={p.bg ?? "var(--danger-soft)"}>
      <rect x="48" y="44" width="64" height="72" rx="10" fill="#fff" {...S} />
      <circle cx="68" cy="74" r="5" fill="var(--ink)" />
      <circle cx="92" cy="74" r="5" fill="var(--ink)" />
      <path d="M72 96 h16" {...S} />
      <path d="M118 36 l-12 20 h12 l-14 22" fill="none" stroke="var(--danger)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export const PROBLEM_ILL: Record<ProblemId, (p: { size?: number; bg?: string }) => ReactNode> = {
  damp: IllDamp,
  leak: IllLeak,
  crack: IllCrack,
  roof: IllRoof,
  wiring: IllWiring,
};

export function IllPhone(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <rect x="52" y="26" width="56" height="108" rx="12" fill="var(--ink)" />
      <rect x="57" y="36" width="46" height="86" rx="5" fill="#fff" />
      <path d="M60 110 c4 -14 16 -14 20 -6 c6 -10 18 -6 20 6 z" fill="#e6d3b3" />
      <path d="M64 70 v-8 h8 M96 62 h8 v8 M104 98 v8 h-8 M72 106 h-8 v-8" fill="none" stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" />
      <circle cx="80" cy="128" r="3" fill="#fff" />
    </Frame>
  );
}

export function IllExperts(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <rect x="26" y="36" width="64" height="34" rx="14" fill="#fff" {...S} />
      <path d="M40 70 l-6 12 l16 -12" fill="#fff" {...S} />
      <rect x="70" y="80" width="64" height="34" rx="14" fill="var(--sun)" {...S} />
      <path d="M120 114 l6 12 l-16 -12" fill="var(--sun)" {...S} />
      <path d="M40 53 h36 M84 97 h36" {...S} strokeWidth={2.6} />
      <circle cx="46" cy="124" r="10" fill="var(--sky-soft)" {...S} strokeWidth={2.4} />
      <circle cx="122" cy="44" r="10" fill="var(--leaf-soft)" {...S} strokeWidth={2.4} />
    </Frame>
  );
}

export function IllPrice(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <path d="M46 28 h68 v100 l-8 -6 l-9 6 l-9 -6 l-9 6 l-9 -6 l-9 6 l-9 -6 l-6 6 z" fill="#fff" {...S} />
      <path d="M58 50 h44 M58 66 h44 M58 82 h28" {...S} strokeWidth={2.6} />
      <circle cx="108" cy="108" r="20" fill="var(--leaf)" {...S} />
      <path d="M99 108 l6 6 l12 -12" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function IllWorker(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <path d="M44 140 c2 -28 16 -40 36 -40 s34 12 36 40" fill="var(--sky)" {...S} />
      <circle cx="80" cy="70" r="20" fill="#f1c9a5" {...S} />
      <path d="M58 64 a22 22 0 0 1 44 0 z" fill="var(--sun)" {...S} />
      <path d="M56 64 h52" {...S} />
      <circle cx="73" cy="72" r="2" fill="var(--ink)" />
      <circle cx="87" cy="72" r="2" fill="var(--ink)" />
      <path d="M74 80 q6 4 12 0" fill="none" {...S} strokeWidth={2.4} />
      <rect x="96" y="112" width="34" height="22" rx="4" fill="var(--brand)" {...S} />
      <path d="M106 112 v-6 h14 v6" fill="none" {...S} strokeWidth={2.6} />
    </Frame>
  );
}

export function IllMapPin(p: { size?: number; bg?: string }) {
  return (
    <Frame {...p}>
      <path d="M30 60 l32 -12 l36 12 l32 -12 v72 l-32 12 l-36 -12 l-32 12 z" fill="#fff" {...S} />
      <path d="M62 48 v72 M98 60 v72" {...S} strokeWidth={2} opacity="0.3" />
      <path d="M80 34 a18 18 0 0 1 18 18 c0 14 -18 32 -18 32 s-18 -18 -18 -32 a18 18 0 0 1 18 -18 z" fill="var(--brand)" {...S} />
      <circle cx="80" cy="52" r="6" fill="#fff" />
    </Frame>
  );
}

// ---------- small trade pictures for the worker app ----------
function TradeArt({ trade }: { trade: Trade }) {
  switch (trade) {
    case "plumber":
      return (
        <>
          <path d="M40 100 h40 a14 14 0 0 0 14 -14 v-26" fill="none" {...S} strokeWidth={10} />
          <path d="M40 100 h40 a14 14 0 0 0 14 -14 v-26" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          <path d="M104 40 l16 16 l-30 30 l-16 -16 z" fill="var(--sun)" {...S} />
          <circle cx="116" cy="44" r="10" fill="var(--sun)" {...S} />
        </>
      );
    case "mason":
      return (
        <>
          <rect x="36" y="88" width="40" height="18" fill="var(--brand-soft)" {...S} />
          <rect x="76" y="88" width="40" height="18" fill="var(--brand-soft)" {...S} />
          <rect x="56" y="106" width="40" height="18" fill="var(--brand-soft)" {...S} />
          <path d="M92 40 l26 22 l-30 14 z" fill="#fff" {...S} />
          <path d="M100 52 l-22 -14" {...S} strokeWidth={5} />
        </>
      );
    case "waterproofing":
      return (
        <>
          <path d="M80 34 l34 12 v24 c0 22 -14 38 -34 46 c-20 -8 -34 -24 -34 -46 v-24 z" fill="var(--leaf-soft)" {...S} />
          <path d="M80 58 c0 0 -10 14 -10 20 a10 10 0 0 0 20 0 c0 -6 -10 -20 -10 -20 z" fill="var(--sky)" {...S} strokeWidth={2.5} />
        </>
      );
    case "painter":
      return (
        <>
          <rect x="44" y="40" width="64" height="26" rx="8" fill="var(--brand)" {...S} />
          <path d="M108 52 h12 v24 h-36 v14" fill="none" {...S} />
          <rect x="78" y="90" width="12" height="36" rx="4" fill="var(--ink)" />
        </>
      );
    case "electrician":
      return (
        <>
          <path d="M80 34 a26 26 0 0 1 16 46 v10 h-32 v-10 a26 26 0 0 1 16 -46 z" fill="var(--sun)" {...S} />
          <path d="M66 100 h28 M68 110 h24" {...S} />
          <path d="M82 46 l-8 14 h10 l-8 14" fill="none" {...S} strokeWidth={2.6} />
        </>
      );
    case "carpenter":
      return (
        <>
          <rect x="32" y="96" width="96" height="16" rx="3" fill="#e2b984" {...S} />
          <path d="M50 44 h50 l14 14 l-50 0 z" fill="#fff" {...S} />
          <path d="M64 58 l0 12 M74 58 l0 12 M84 58 l0 12 M94 58 l0 12" {...S} strokeWidth={2.2} />
          <rect x="100" y="38" width="22" height="16" rx="4" fill="var(--brand)" {...S} />
        </>
      );
  }
}

export function TradePicture({ trade, size = 72, bg = "var(--sand)" }: { trade: Trade; size?: number; bg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill={bg} />
      <TradeArt trade={trade} />
    </svg>
  );
}

/** The big hero picture: a Pakistani room with seelan, a phone checking it, and the mascot. */
export function HeroScene({ bubble }: { bubble: string }) {
  return (
    <svg viewBox="0 0 520 440" className="w-full h-auto" role="img" aria-label="A phone checking a damp wall in a room, with the Checkster mascot">
      <circle cx="268" cy="226" r="206" fill="var(--sand)" />
      {/* room */}
      <rect x="84" y="78" width="356" height="262" rx="12" fill="#fff" {...S} />
      <rect x="84" y="300" width="356" height="40" fill="var(--sun-soft)" {...S} />
      {/* ceiling fan */}
      <path d="M262 78 v26" {...S} />
      <ellipse cx="262" cy="110" rx="12" ry="7" fill="var(--ink)" />
      <path d="M250 110 q-46 -6 -70 4 q34 10 70 0 z M274 110 q46 -6 70 4 q-34 10 -70 0 z" fill="#fff" {...S} strokeWidth={2.6} />
      {/* window */}
      <rect x="108" y="112" width="92" height="88" rx="8" fill="var(--sky-soft)" {...S} />
      <path d="M154 112 v88 M108 156 h92" {...S} strokeWidth={2.4} />
      <path d="M108 200 h92" {...S} strokeWidth={6} />
      {/* seelan on the wall */}
      <path d="M88 300 C 92 248, 120 232, 140 246 C 150 214, 196 216, 204 248 C 220 238, 242 262, 238 300 Z" fill="#e6d3b3" />
      <path d="M100 300 C 106 268, 126 262, 138 270 C 150 250, 180 252, 186 272 C 198 268, 212 280, 214 300 Z" fill="#d6bf98" />
      <circle cx="132" cy="286" r="2.4" fill="#fff" />
      <circle cx="160" cy="278" r="2.4" fill="#fff" />
      <circle cx="184" cy="290" r="2.4" fill="#fff" />
      <path d="M214 222 q14 -10 22 3 q-12 4 -22 -3 z" fill="#fff" {...S} strokeWidth={2.4} />
      {/* matka on a small stand */}
      <path d="M248 300 v-14 h40 v14" fill="none" {...S} />
      <path d="M252 286 c-14 -6 -14 -38 16 -40 c30 2 30 34 16 40 z" fill="#d9844f" {...S} />
      <path d="M258 248 h20" {...S} strokeWidth={4} />
      {/* phone checking the seelan */}
      <g transform="translate(150 -4) rotate(-8 190 250)">
        <rect x="132" y="150" width="118" height="206" rx="20" fill="var(--ink)" />
        <rect x="140" y="166" width="102" height="170" rx="8" fill="#f8f1e6" />
        <path d="M146 336 C 150 300, 168 292, 182 300 C 190 280, 222 282, 228 302 C 234 300, 240 312, 240 336 Z" fill="#d6bf98" />
        <path d="M160 262 v-12 h12 M210 250 h12 v12 M222 316 v12 h-12 M172 328 h-12 v-12" fill="none" stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
        <rect x="150" y="256" width="82" height="4" rx="2" fill="var(--brand)">
          <animate attributeName="y" values="256;322;256" dur="2.4s" repeatCount="indefinite" />
        </rect>
        <rect x="150" y="182" width="58" height="18" rx="9" fill="var(--leaf)" />
        <path d="M158 191 l4 4 l7 -8" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <rect x="172" y="188" width="28" height="5" rx="2.5" fill="#fff" />
      </g>
      {/* mascot + speech bubble */}
      <g transform="translate(372 2)">
        <path d="M10 30 L32 11 L54 30 V52 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 Z" transform="scale(1.6)" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="40" cy="58" r="4.6" fill="var(--ink)" />
        <circle cx="62" cy="58" r="4.6" fill="var(--ink)" />
        <path d="M38 70 q13 11 26 0" stroke="var(--ink)" strokeWidth="4.4" fill="none" strokeLinecap="round" />
        <path d="M66 21 l6 6 l13 -14" stroke="var(--brand)" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g>
        <rect x="150" y="14" width="200" height="54" rx="20" fill="#fff" {...S} />
        <path d="M350 32 l26 6 l-26 14" fill="#fff" {...S} />
        <path d="M348 34 v16" stroke="#fff" strokeWidth={5} />
        <text x="250" y="48" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--ink)">
          {bubble}
        </text>
      </g>
    </svg>
  );
}
