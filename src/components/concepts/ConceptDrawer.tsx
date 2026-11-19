import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getConcept } from "@/data/ictConcepts";
import { CandleExample } from "./CandleExample";

export function ConceptDrawer({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const c = id ? getConcept(id) : undefined;
  return (
    <Sheet open={!!c} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {c && (
          <>
            <SheetHeader>
              <SheetTitle>{c.name} <span className="font-normal text-muted-foreground">({c.abbr})</span></SheetTitle>
              <SheetDescription>{c.short}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-8 text-sm">
              <section><h3 className="mb-1 font-medium">1. What it is</h3><p className="text-muted-foreground">{c.explanation}</p></section>
              <section><h3 className="mb-1 font-medium">2. How to spot it</h3>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">{c.spot.map((s) => <li key={s}>{s}</li>)}</ol></section>
              <section><h3 className="mb-2 font-medium">3. Examples</h3>
                <div className="grid grid-cols-2 gap-3">
                  <CandleExample pattern={c.pattern} label={`Bullish: ${c.bullish}`} />
                  <CandleExample pattern={c.pattern} bearish label={`Bearish: ${c.bearish}`} />
                </div></section>
              <section><h3 className="mb-1 font-medium">4. Common mistakes</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{c.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></section>
              <section><h3 className="mb-1 font-medium">5. Related concepts</h3>
                <div className="flex flex-wrap gap-2">{[...c.related, ...c.strategies].filter((r, i, a) => a.indexOf(r) === i).map((r) => {
                  const rc = getConcept(r); if (!rc) return null;
                  return <button key={r} onClick={() => onOpen(r)} className="rounded-sm border px-2 py-1 text-xs hover:bg-accent">{rc.name}</button>;
                })}</div></section>
              <Link to="/chart" search={{ symbol: c.symbol, interval: undefined }} onClick={onClose} className="inline-block text-sm text-primary underline underline-offset-4">
                Open on chart ({c.symbol})
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
