import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone, icon: Icon }: {
  label: string; value: ReactNode; hint?: string; tone?: "pos" | "neg" | "neutral"; icon?: LucideIcon;
}) {
  return (
    <div className="surface animate-rise p-5">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {Icon && <Icon className="h-4 w-4 text-cyan" />}
      </div>
      <div className={cn("num mt-3 text-2xl font-semibold",
        tone === "pos" && "text-success", tone === "neg" && "text-loss")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("surface animate-rise p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border bg-muted">
        <Icon className="h-5 w-5 text-cyan" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function RValue({ r }: { r: number | null | undefined }) {
  if (r == null) return <span className="num text-muted-foreground">—</span>;
  return (
    <span className={cn("num font-medium", r > 0 ? "text-success" : r < 0 ? "text-loss" : "text-muted-foreground")}>
      {r > 0 ? "+" : ""}{Number(r).toFixed(2)}R
    </span>
  );
}
