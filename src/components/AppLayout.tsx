import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/learn": "Learn",
  "/advisor": "AI Advisor",
  "/news": "Market News",
  "/trade": "Trade",
};

export default function AppLayout() {
  const location = useLocation();
  const title = titles[location.pathname] ?? "FinanceHub";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b px-4 bg-card shrink-0">
            <SidebarTrigger className="text-muted-foreground" />
            <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
