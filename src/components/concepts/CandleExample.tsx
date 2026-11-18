import type { Pattern } from "@/data/ictConcepts";

type C = [number, number, number, number]; // open, high, low, close (0-100, up = higher)
interface Shape { candles: C[]; zone?: [number, number, number, number]; line?: number; }

const SHAPES: Record<Pattern, Shape> = {
  gap: { candles: [[40, 46, 34, 44], [44, 47, 38, 40], [40, 72, 39, 70], [70, 80, 60, 76], [76, 78, 64, 66], [66, 84, 63, 82]], zone: [1, 5, 47, 60] },
  sweep: { candles: [[50, 56, 44, 46], [46, 50, 36, 40], [40, 46, 22, 44], [44, 60, 42, 58], [58, 70, 54, 68], [68, 80, 64, 78]], line: 34 },
  structure: { candles: [[60, 64, 46, 50], [50, 58, 40, 56], [56, 60, 34, 38], [38, 50, 30, 48], [48, 70, 46, 68], [68, 78, 62, 76]], line: 60 },
  block: { candles: [[50, 54, 40, 42], [42, 46, 32, 34], [34, 60, 33, 58], [58, 74, 56, 72], [72, 74, 48, 52], [52, 80, 50, 78]], zone: [1, 5, 32, 42] },
  range: { candles: [[50, 70, 46, 66], [66, 72, 40, 44], [44, 50, 30, 34], [34, 60, 30, 56], [56, 70, 52, 68], [68, 74, 62, 72]], line: 72 },
  ote: { candles: [[30, 36, 26, 34], [34, 60, 32, 58], [58, 80, 56, 78], [78, 80, 60, 62], [62, 64, 46, 50], [50, 76, 48, 74]], zone: [0, 5, 42, 52] },
  po3: { candles: [[50, 54, 46, 48], [48, 52, 44, 50], [50, 52, 30, 34], [34, 56, 32, 54], [54, 74, 52, 72], [72, 86, 70, 84]], line: 50 },
};

export function CandleExample({ pattern, bearish = false, label }: { pattern: Pattern; bearish?: boolean; label: string }) {
  const s = SHAPES[pattern];
  const W = 240, H = 140, pad = 10, cw = 18, gap = (W - pad * 2) / s.candles.length;
  const y = (v: number) => { const val = bearish ? 100 - v : v; return H - pad - (val / 100) * (H - pad * 2); };
  return (
    <figure className="rounded-sm border bg-background p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {s.zone && (() => { const [a, b, lo, hi] = s.zone; const y1 = y(hi), y2 = y(lo);
          return <rect x={pad + a * gap} width={(b - a + 1) * gap} y={Math.min(y1, y2)} height={Math.abs(y2 - y1)} className="fill-primary/15" />; })()}
        {s.line != null && <line x1={pad} x2={W - pad} y1={y(s.line)} y2={y(s.line)} className="stroke-muted-foreground" strokeDasharray="3 3" />}
        {s.candles.map(([o, h, l, c], i) => {
          const up = bearish ? c < o : c > o;
          const x = pad + i * gap + gap / 2;
          const cls = up ? "fill-success stroke-success" : "fill-loss stroke-loss";
          return (
            <g key={i} className={cls}>
              <line x1={x} x2={x} y1={y(h)} y2={y(l)} strokeWidth={1.2} />
              <rect x={x - cw / 2} width={cw} y={Math.min(y(o), y(c))} height={Math.max(2, Math.abs(y(o) - y(c)))} />
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
