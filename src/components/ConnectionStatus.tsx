import { useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      setIsOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);

      if (wasOffline.current) {
        toast.success("Conexão restabelecida", {
          description: "O LifeFlow voltou a sincronizar seus dados.",
        });
        wasOffline.current = false;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-lg border border-amber-500/25 bg-background px-4 py-3 shadow-lg"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <WifiOff className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium">Você está sem internet</p>
        <p className="text-xs text-muted-foreground">
          Algumas ações ficarão disponíveis quando a conexão voltar.
        </p>
      </div>
    </div>
  );
}
