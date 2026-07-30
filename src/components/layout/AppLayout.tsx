import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { GlobalSearchProvider } from "@/components/search/GlobalSearch";
import { NotificationCenterProvider } from "@/components/notifications/NotificationCenter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <GlobalSearchProvider>
      <NotificationCenterProvider>
        <div className="dashboard-aurora flex min-h-screen bg-background">
          <MobileNav />
          <AppSidebar />
          <main className="flex-1 overflow-auto pt-16 lg:pt-0">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </NotificationCenterProvider>
    </GlobalSearchProvider>
  );
}
