import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/monitoring";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LifeFlow encontrou um erro inesperado:", error, errorInfo);
    reportError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
          <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
            <img
              src="/lifeflow-logo.png"
              alt="LifeFlow"
              className="mx-auto mb-4 h-12 w-12 object-contain"
            />
            <h1 className="text-xl font-semibold">Não foi possível abrir esta página</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pode ter ocorrido uma atualização enquanto o LifeFlow estava aberto.
              Recarregue a página para continuar.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Recarregar
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Ir para o início
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
