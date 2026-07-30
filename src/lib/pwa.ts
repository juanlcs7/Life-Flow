interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let installPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;

export function isLifeFlowInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function canInstallLifeFlow() {
  return installPrompt !== null;
}

export function registerLifeFlowPwa() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("lifeflow-install-state"));
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    window.dispatchEvent(new Event("lifeflow-install-state"));
  });

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Não foi possível registrar o modo aplicativo", error);
      });
    });
  }
}

export async function installLifeFlow() {
  if (!installPrompt) return "unavailable" as const;
  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  window.dispatchEvent(new Event("lifeflow-install-state"));
  return outcome;
}
