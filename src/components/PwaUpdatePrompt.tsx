import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  applyLifeFlowUpdate,
  hasLifeFlowUpdate,
} from "@/lib/pwa";

export function PwaUpdatePrompt() {
  const [available, setAvailable] = useState(hasLifeFlowUpdate);

  useEffect(() => {
    const handleUpdate = () => setAvailable(hasLifeFlowUpdate());
    window.addEventListener("lifeflow-update-state", handleUpdate);

    return () => {
      window.removeEventListener("lifeflow-update-state", handleUpdate);
    };
  }, []);

  if (!available) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-md flex-col gap-3 rounded-lg border bg-background p-4 shadow-lg sm:flex-row sm:items-center"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <RefreshCw className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Nova versão disponível</p>
        <p className="text-xs text-muted-foreground">
          Atualize para usar as melhorias mais recentes.
        </p>
      </div>
      <button
        type="button"
        onClick={applyLifeFlowUpdate}
        className="h-9 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Atualizar agora
      </button>
    </div>
  );
}
