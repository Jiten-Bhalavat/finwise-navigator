import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PortfolioProvider } from "@/context/PortfolioContext";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import DashboardHome from "@/pages/DashboardHome";
import LearnPage from "@/pages/Learn";
import AdvisorPage from "@/pages/Advisor";
import NewsPage from "@/pages/News";
import TradePage from "@/pages/Trade";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PortfolioProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page — no sidebar */}
            <Route path="/" element={<HomePage />} />
            {/* App — with sidebar layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/advisor" element={<AdvisorPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/trade" element={<TradePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PortfolioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
