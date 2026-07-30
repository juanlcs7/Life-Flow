import { useEffect, useState } from "react";
import { Check, Download, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  canInstallLifeFlow,
  installLifeFlow,
  isLifeFlowInstalled,
} from "@/lib/pwa";

export function InstallApp() {
  const [installed, setInstalled] = useState(isLifeFlowInstalled);
  const [available, setAvailable] = useState(canInstallLifeFlow);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setInstalled(isLifeFlowInstalled());
      setAvailable(canInstallLifeFlow());
    };
    window.addEventListener("lifeflow-install-state", updateState);
    return () => window.removeEventListener("lifeflow-install-state", updateState);
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    const result = await installLifeFlow();
    setInstalling(false);

    if (result === "accepted") toast.success("LifeFlow instalado");
    if (result === "dismissed") toast.info("Instalação cancelada");
    if (result === "unavailable") {
      toast.info("Use a opção “Instalar aplicativo” no menu do navegador");
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <MonitorSmartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Aplicativo</p>
            <h3 className="mt-1 font-display text-lg font-semibold">
              {installed ? "LifeFlow instalado" : "Instale o LifeFlow"}
            </h3>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {installed
                ? "Você está usando o LifeFlow como aplicativo."
                : "Adicione à tela inicial e abra em uma janela própria, sem precisar procurar o site."}
            </p>
          </div>
        </div>

        {installed ? (
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 text-sm font-medium text-emerald-500">
            <Check className="h-4 w-4" />
            Instalado
          </span>
        ) : (
          <Button
            variant={available ? "default" : "outline"}
            onClick={handleInstall}
            disabled={installing}
            className="shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            {available ? "Instalar agora" : "Como instalar"}
          </Button>
        )}
      </div>
    </Card>
  );
}
