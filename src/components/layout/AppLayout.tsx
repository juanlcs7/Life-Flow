import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { GlobalSearchProvider } from "@/components/search/GlobalSearch";
import { NotificationCenterProvider } from "@/components/notifications/NotificationCenter";
import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { AppTopbar } from "./AppTopbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <GlobalSearchProvider>
      <NotificationCenterProvider>
        <WelcomeOnboarding />
        <div className="lifeflow-v2 dashboard-aurora relative flex min-h-screen bg-background lg:h-screen lg:overflow-hidden">
          <div className="flow-grid pointer-events-none fixed inset-0 opacity-50" />
          <MobileNav />
          <AppSidebar />
          <main className="relative min-w-0 flex-1 overflow-auto pb-24 pt-20 lg:m-4 lg:ml-0 lg:rounded-[2.25rem] lg:border lg:border-border/70 lg:bg-background/88 lg:pb-0 lg:pt-0 lg:shadow-[0_28px_90px_-55px_rgba(15,23,42,.45)] lg:backdrop-blur-2xl">
            <AppTopbar />
            <div className="mx-auto max-w-[1520px] p-4 sm:p-6 lg:p-8 xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </NotificationCenterProvider>
    </GlobalSearchProvider>
  );
}
