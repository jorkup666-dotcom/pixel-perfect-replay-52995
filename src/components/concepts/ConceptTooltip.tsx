import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IctConcept } from "@/data/ictConcepts";

export function ConceptTooltip({ concept, x, y }: { concept: IctConcept; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 12, top: y + 12 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = x + 12, top = y + 12;
    if (left + w > window.innerWidth - 8) left = x - w - 12;
    if (top + h > window.innerHeight - 8) top = y - h - 12;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y]);
  return createPortal(
    <div ref={ref} role="tooltip" style={pos}
      className="pointer-events-none fixed z-[100] max-w-xs rounded-sm border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
      <div className="font-medium">{concept.name} <span className="text-muted-foreground">({concept.abbr})</span></div>
      <div className="mt-0.5 text-muted-foreground">{concept.short}</div>
    </div>,
    document.body,
  );
}
