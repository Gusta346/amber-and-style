import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Servicos from "./pages/Servicos";
import Produtos from "./pages/Produtos";
import Cursos from "./pages/Cursos";
import Assinatura from "./pages/Assinatura";
import Avaliacoes from "./pages/Avaliacoes";
import Contato from "./pages/Contato";
import Agendamento from "./pages/Agendamento";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { supabase } from "@/integrations/supabase/client";
import React from "react";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRoute from "./pages/admin/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const RequireAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const location = useLocation();
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { setOk(false); setReady(true); return; }
      setOk(true); setReady(true);
    })();
  }, []);
  if (!ready) return null;
  if (!ok) return (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    />
  );
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/assinatura" element={<Assinatura />} />
          <Route path="/avaliacoes" element={<Avaliacoes />} />
          <Route path="/contato" element={<Contato />} />
          
          <Route path="/admin-portal-9f3b7/login" element={<AdminLogin />} />
          <Route path="/admin-portal-9f3b7" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/agendamento" element={<RequireAuthed><Agendamento /></RequireAuthed>} />
          <Route path="/perfil" element={<RequireAuthed><Perfil /></RequireAuthed>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
