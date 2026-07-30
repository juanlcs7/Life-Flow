import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteMeta } from "@/components/RouteMeta";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Financas = lazy(() => import("./pages/Financas"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Planejamento = lazy(() => import("./pages/Planejamento"));
const Saude = lazy(() => import("./pages/Saude"));
const Metas = lazy(() => import("./pages/Metas"));
const Historico = lazy(() => import("./pages/Historico"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Contatos = lazy(() => import("./pages/Contatos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? "grid min-h-screen place-items-center bg-background" : "grid min-h-[55vh] place-items-center"}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <img src="/lifeflow-logo.png" alt="" className="h-9 w-9 object-contain" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs">Abrindo página...</span>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteMeta />
            <Suspense fallback={<PageLoading fullScreen />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<PageLoading />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/financas" element={<Financas />} />
                            <Route path="/agenda" element={<Agenda />} />
                            <Route path="/planejamento" element={<Planejamento />} />
                            <Route path="/saude" element={<Saude />} />
                            <Route path="/metas" element={<Metas />} />
                            <Route path="/historico" element={<Historico />} />
                            <Route path="/documentos" element={<Documentos />} />
                            <Route path="/contatos" element={<Contatos />} />
                            <Route path="/configuracoes" element={<Configuracoes />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
