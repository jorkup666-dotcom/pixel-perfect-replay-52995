import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Panel } from "@/components/app/ui";
import { CHECKLIST_ITEMS } from "@/lib/ict";

export const Route = createFileRoute("/_authenticated/checklist")({
  head: () => ({ meta: [{ title: "ICT Checklist – TradeKit" }, { name: "description", content: "Pre-trade ICT checklist." }] }),
  component: () => {
    const [done, setDone] = useState<Record<string, boolean>>({});
    const n = Object.values(done).filter(Boolean).length;
    const groups = [...new Set(CHECKLIST_ITEMS.map((i) => i.group))];
    return (<><PageHeader title="ICT Checklist" subtitle={`${n} / ${CHECKLIST_ITEMS.length} confirmed`} actions={<Button variant="outline" onClick={() => setDone({})}>Reset</Button>} />
      <div className="grid gap-4 md:grid-cols-2">{groups.map((g) => <Panel key={g} title={g}><div className="space-y-3">
        {CHECKLIST_ITEMS.filter((i) => i.group === g).map((i) => <label key={i.key} className="flex items-center gap-3 text-sm">
          <Checkbox checked={!!done[i.key]} onCheckedChange={(c) => setDone((d) => ({ ...d, [i.key]: c === true }))} />{i.label}</label>)}
      </div></Panel>)}</div></>);
  },
});
