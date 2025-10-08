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

// Floating WhatsApp button with a helper phrase that shows on demand
const WhatsAppFloating: React.FC = () => {
  const [showHint, setShowHint] = React.useState(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    const handler = () => {
      setShowHint(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowHint(false), 6000);
    };
    window.addEventListener('show-whatsapp-hint', handler as EventListener);
    return () => {
      window.removeEventListener('show-whatsapp-hint', handler as EventListener);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // New, simpler auto message as requested
  const href =
    "https://wa.me/5511986122682?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20agendar%20um%20hor%C3%A1rio.%20Pode%20me%20ajudar%3F";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
      <div
        role="status"
        aria-hidden={!showHint}
        className={
          `px-3 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg text-sm font-medium ring-1 ring-primary/40 ` +
          `transition-all duration-700 ease-out transform ` +
          (showHint ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none')
        }
      >
        Agende seu horário pelo WhatsApp
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco no WhatsApp"
        title="Fale conosco no WhatsApp"
        className="group"
      >
        <img
          src="/whatsapp.png"
          alt="WhatsApp"
          className="w-14 h-14 rounded-full shadow-lg border border-green-500 transition-transform duration-200 group-hover:scale-105"
        />
        <span className="sr-only">Abrir conversa no WhatsApp</span>
      </a>
    </div>
  );
};

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

// Perfil route that becomes Admin for a specific admin user
const PerfilOrAdmin: React.FC = () => {
  const [ready, setReady] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const email = (user?.email || '').toLowerCase();
      // Whitelist email that should see the Admin Dashboard via /perfil
      const emailWhitelist = ['gustavoribeiro4523@gmail.com'];
      if (email && emailWhitelist.includes(email)) {
        setIsAdmin(true);
        setReady(true);
        return;
      }
      // Optional: also consider admins table if present
      try {
        if (user) {
          const { data: adminRows } = await (supabase as any)
            .from('admins')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          if (Array.isArray(adminRows) && adminRows.length > 0) setIsAdmin(true);
        }
      } catch {}
      setReady(true);
    })();
  }, []);
  if (!ready) return null;
  return isAdmin ? <AdminDashboard /> : <Perfil />;
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
          <Route path="/perfil" element={<RequireAuthed><PerfilOrAdmin /></RequireAuthed>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Floating WhatsApp button with auto-hiding hint */}
        <WhatsAppFloating />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
