export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-foreground/20 font-mono text-xs font-medium">TK</div>
      {!compact && <span className="text-base font-semibold">TradeKit</span>}
    </div>
  );
}
