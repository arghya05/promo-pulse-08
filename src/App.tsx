import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GlobalSessionProvider } from "@/contexts/GlobalSessionContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Simple auth check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalSessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/executive" element={<ProtectedRoute><Index moduleId="executive" /></ProtectedRoute>} />
            <Route path="/promotion" element={<ProtectedRoute><Index moduleId="promotion" /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Index moduleId="pricing" /></ProtectedRoute>} />
            <Route path="/assortment" element={<ProtectedRoute><Index moduleId="assortment" /></ProtectedRoute>} />
            <Route path="/demand" element={<ProtectedRoute><Index moduleId="demand" /></ProtectedRoute>} />
            <Route path="/supply-chain" element={<ProtectedRoute><Index moduleId="supply-chain" /></ProtectedRoute>} />
            <Route path="/space" element={<ProtectedRoute><Index moduleId="space" /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalSessionProvider>
  </QueryClientProvider>
);

export default App;
