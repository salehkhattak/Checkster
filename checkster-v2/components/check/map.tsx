"use client";

// A drawn neighbourhood map (no API key needed for the prototype).
// Real version: Google Maps / Mapbox with live locations.

export interface MapPin {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

export const HOME = { x: 200, y: 136 };

export function NeighbourhoodMap({ pins, routeTo, homeLabel, areaLabel }: { pins: MapPin[]; routeTo?: MapPin | null; homeLabel: string; areaLabel: string }) {
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto rounded-3xl border-2 border-ink bg-[#f3eee3]" role="img" aria-label={areaLabel}>
      {/* park and canal */}
      <rect x="24" y="22" width="92" height="64" rx="14" fill="var(--leaf-soft)" />
      <circle cx="50" cy="48" r="9" fill="#bfe6d2" />
      <circle cx="78" cy="60" r="12" fill="#bfe6d2" />
      <path d="M0 214 C 80 196, 140 240, 230 222 S 360 196, 400 210" stroke="var(--sky-soft)" strokeWidth="16" fill="none" />
      {/* blocks of houses */}
      {[
        [140, 24, 70, 50],
        [234, 24, 64, 50],
        [322, 24, 60, 74],
        [24, 112, 70, 56],
        [118, 98, 56, 40],
        [234, 160, 70, 34],
        [326, 122, 56, 50],
        [118, 160, 58, 36],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="8" fill="#fff" stroke="var(--line)" strokeWidth="2" />
      ))}
      {/* roads */}
      <g stroke="#e0d5c2" strokeWidth="20" strokeLinecap="round" fill="none">
        <path d="M0 92 H400" />
        <path d="M218 0 V260" />
        <path d="M106 92 V260" />
        <path d="M310 92 V200" />
      </g>
      <g stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none">
        <path d="M0 92 H400" />
        <path d="M218 0 V260" />
        <path d="M106 92 V260" />
        <path d="M310 92 V200" />
      </g>
      <path d="M0 92 H400" stroke="var(--sun)" strokeWidth="2" strokeDasharray="8 8" />
      <text x="372" y="86" textAnchor="end" fontSize="10" fontWeight="800" fill="var(--ink-soft)">
        {areaLabel}
      </text>

      {/* route from the chosen kaarigar */}
      {routeTo && (
        <path
          d={`M${routeTo.x} ${routeTo.y} L${routeTo.x} 92 L${HOME.x} 92 L${HOME.x} ${HOME.y}`}
          stroke="var(--sky)"
          strokeWidth="5"
          strokeDasharray="2 9"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* your home */}
      <circle cx={HOME.x} cy={HOME.y} r="14" fill="var(--brand)" opacity="0.35" className="ripple" style={{ transformOrigin: `${HOME.x}px ${HOME.y}px` }} />
      <g>
        <circle cx={HOME.x} cy={HOME.y} r="15" fill="var(--brand)" stroke="var(--ink)" strokeWidth="2.5" />
        <path d={`M${HOME.x - 7} ${HOME.y + 1} L${HOME.x} ${HOME.y - 6} L${HOME.x + 7} ${HOME.y + 1} V${HOME.y + 7} H${HOME.x - 7} Z`} fill="#fff" />
        <rect x={HOME.x - 24} y={HOME.y + 19} width="48" height="16" rx="8" fill="var(--ink)" />
        <text x={HOME.x} y={HOME.y + 30.5} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
          {homeLabel}
        </text>
      </g>

      {/* kaarigars */}
      {pins.map((p) => (
        <g key={p.id} className="pop-in" style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: "view-box" }}>
          <path d={`M${p.x} ${p.y + 22} l-6 -9 h12 z`} fill="var(--ink)" />
          <circle cx={p.x} cy={p.y} r="15" fill={p.color} stroke="var(--ink)" strokeWidth="2.5" />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export const TONE_COLOR: Record<string, string> = {
  "bg-sky": "var(--sky)",
  "bg-leaf": "var(--leaf)",
  "bg-amber": "var(--amber)",
  "bg-brand": "var(--brand)",
  "bg-ink": "var(--ink)",
};
