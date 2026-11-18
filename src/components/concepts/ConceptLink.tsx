import { useState, type ReactNode } from "react";
import { getConcept } from "@/data/ictConcepts";
import { useConcepts } from "./ConceptProvider";
import { ConceptTooltip } from "./ConceptTooltip";
import { cn } from "@/lib/utils";

export function ConceptLink({ id, children, className }: { id: string; children?: ReactNode; className?: string }) {
  const c = getConcept(id);
  const { open } = useConcepts();
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  if (!c) return <>{children}</>;
  const move = (e: React.PointerEvent) => { if (e.pointerType === "mouse") setPt({ x: e.clientX, y: e.clientY }); };
  return (
    <>
      <button type="button" onClick={() => { setPt(null); open(id); }}
        onPointerEnter={move} onPointerMove={move} onPointerLeave={() => setPt(null)}
        className={cn("cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4 hover:text-primary", className)}>
        {children ?? c.name}
      </button>
      {pt && <ConceptTooltip concept={c} x={pt.x} y={pt.y} />}
    </>
  );
}
