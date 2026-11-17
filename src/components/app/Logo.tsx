export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-primary-foreground" strokeWidth={2.5} aria-hidden>
          <path d="M4 17l5-6 4 3 7-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Trade<span className="text-gradient">Kit</span>
        </span>
      )}
    </div>
  );
}
