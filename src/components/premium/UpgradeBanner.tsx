import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PremiumModal } from "./PremiumModal";

interface Props {
  title: string;
  description?: string;
}

export function UpgradeBanner({ title, description }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PremiumModal open={open} onOpenChange={setOpen} reason={title} />
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Premium
        </Button>
      </div>
    </>
  );
}