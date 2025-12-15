import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalSessionProvider } from "@/contexts/GlobalSessionContext";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalSessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/promotion" element={<Index moduleId="promotion" />} />
            <Route path="/pricing" element={<Index moduleId="pricing" />} />
            <Route path="/assortment" element={<Index moduleId="assortment" />} />
            <Route path="/demand" element={<Index moduleId="demand" />} />
            <Route path="/supply-chain" element={<Index moduleId="supply-chain" />} />
            <Route path="/space" element={<Index moduleId="space" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalSessionProvider>
  </QueryClientProvider>
);

export default App;
