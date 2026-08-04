import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GlobalSessionProvider } from "@/contexts/GlobalSessionContext";
import AppShell from "./components/shell/AppShell";
import Home from "./pages/Home";
import Index from "./pages/Index";
import AskMaya from "./pages/AskMaya";
import OntologyGraph from "./pages/OntologyGraph";
import DataQuality from "./pages/DataQuality";
import NotFound from "./pages/NotFound";
import ValidationDashboard from "./pages/ValidationDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalSessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/ask" element={<AskMaya />} />
              <Route path="/graph" element={<OntologyGraph />} />
              <Route path="/data-quality" element={<DataQuality />} />
              <Route path="/executive" element={<Index moduleId="executive" />} />
              <Route path="/promotion" element={<Index moduleId="promotion" />} />
              <Route path="/pricing" element={<Index moduleId="pricing" />} />
              <Route path="/assortment" element={<Index moduleId="assortment" />} />
              <Route path="/demand" element={<Index moduleId="demand" />} />
              <Route path="/supply-chain" element={<Index moduleId="supply-chain" />} />
              <Route path="/space" element={<Index moduleId="space" />} />
              <Route path="/validation" element={<ValidationDashboard />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalSessionProvider>
  </QueryClientProvider>
);

export default App;
