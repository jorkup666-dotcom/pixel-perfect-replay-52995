import { createContext, useContext, useState, type ReactNode } from "react";
import { ConceptDrawer } from "./ConceptDrawer";

const Ctx = createContext<{ open: (id: string) => void }>({ open: () => {} });
export const useConcepts = () => useContext(Ctx);

export function ConceptProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  return (
    <Ctx.Provider value={{ open: setId }}>
      {children}
      <ConceptDrawer id={id} onClose={() => setId(null)} onOpen={setId} />
    </Ctx.Provider>
  );
}
