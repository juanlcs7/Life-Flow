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
import Dashboard from "./pages/Dashboard";
import Financas from "./pages/Financas";
import Agenda from "./pages/Agenda";
import Saude from "./pages/Saude";
import Metas from "./pages/Metas";
import Historico from "./pages/Historico";
import Documentos from "./pages/Documentos";
import Contatos from "./pages/Contatos";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteMeta />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/financas" element={<Financas />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/saude" element={<Saude />} />
                        <Route path="/metas" element={<Metas />} />
                        <Route path="/historico" element={<Historico />} />
                        <Route path="/documentos" element={<Documentos />} />
                        <Route path="/contatos" element={<Contatos />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
