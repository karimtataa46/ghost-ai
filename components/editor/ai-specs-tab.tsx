import { FilePlus2 } from "lucide-react";

import { AiSpecCard } from "@/components/editor/ai-spec-card";
import { Button } from "@/components/ui/button";

// The Specs tab: a Generate Spec button above the list of specs. Static for now: the button
// does nothing and the list is one demo card.
export function AiSpecsTab() {
  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" className="w-full bg-ai text-white hover:bg-ai/90">
        <FilePlus2 className="h-4 w-4" />
        Generate Spec
      </Button>
      <AiSpecCard
        title="E-commerce Backend Spec"
        snippet="Overview of the storefront, order, and payment services, the data stores behind them, and how requests flow between them."
      />
    </div>
  );
}
