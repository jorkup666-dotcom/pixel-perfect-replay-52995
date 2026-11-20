const LOGOS: Record<string, { bg: string; fg: string; node: React.ReactNode }> = {
  oil: { bg: "#1f2937", fg: "#f8fafc", node: <path d="M12 5c-2.5 3.5-4 5.8-4 7.6A4 4 0 0 0 12 17a4 4 0 0 0 4-4.4C16 10.8 14.5 8.5 12 5z" fill="currentColor" /> },
  gold: { bg: "#d4a017", fg: "#3b2a00", node: <g fill="currentColor"><path d="M5 16l1.5-4h5L13 16z" /><path d="M11 16l1.5-4h5L19 16z" /><path d="M8 11.5l1.5-4h5l1.5 4z" /></g> },
  silver: { bg: "#9ca3af", fg: "#1f2937", node: <g fill="currentColor"><path d="M5 16l1.5-4h5L13 16z" /><path d="M11 16l1.5-4h5L19 16z" /><path d="M8 11.5l1.5-4h5l1.5 4z" /></g> },
  nq: { bg: "#2563eb", fg: "#ffffff", node: <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="sans-serif">100</text> },
  es: { bg: "#dc2626", fg: "#ffffff", node: <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="sans-serif">500</text> },
  btc: { bg: "#f7931a", fg: "#ffffff", node: <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="sans-serif">₿</text> },
};

export function logoKey(tv: string): string | null {
  const t = tv.toUpperCase();
  if (t.includes("USOIL") || t.includes("CL1")) return "oil";
  if (t.includes("XAU") || t.includes("GC1")) return "gold";
  if (t.includes("XAG") || t.includes("SI1")) return "silver";
  if (t.includes("NQ")) return "nq";
  if (t.includes("ES1")) return "es";
  if (t.includes("BTC")) return "btc";
  return null;
}

export function SymbolLogo({ tv, label, color }: { tv: string; label: string; color?: string }) {
  const k = logoKey(tv);
  const l = k ? LOGOS[k]! : { bg: color ?? "#334155", fg: "#ffffff", node: <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" fontFamily="sans-serif">{label.slice(0, 2)}</text> };
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden style={{ color: l.fg }}>
      <circle cx="12" cy="12" r="12" fill={l.bg} />
      {l.node}
    </svg>
  );
}
