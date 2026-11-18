import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui";
import { ConceptLink } from "@/components/concepts/ConceptLink";
import { ICT_CONCEPTS } from "@/data/ictConcepts";

export const Route = createFileRoute("/_authenticated/glossary")({
  head: () => ({ meta: [{ title: "ICT Glossary – TradeKit" }, { name: "description", content: "Definitions of ICT concepts with chart examples." }] }),
  component: () => (<><PageHeader title="ICT Glossary" subtitle="Click a concept for the full explanation. Educational, not financial advice." />
    <table className="w-full text-sm"><tbody className="divide-y border-y">{ICT_CONCEPTS.map((c) => (
      <tr key={c.id}><td className="w-56 py-3 pr-4 align-top"><ConceptLink id={c.id} className="font-medium" /></td>
        <td className="w-24 py-3 align-top font-mono text-xs text-muted-foreground">{c.abbr}</td>
        <td className="py-3 text-muted-foreground">{c.short}</td></tr>))}</tbody></table></>),
});
