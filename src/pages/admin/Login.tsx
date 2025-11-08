import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Legacy test credentials fallback (keeps the previous quick-login behavior)
    if (username === 'and456' && password === 'sp123') {
      try {
        localStorage.setItem('admin_token', 'true');
      } catch (err) {
        console.error('Unable to write admin token to localStorage', err);
      }
      toast({ title: 'Login efetuado', description: 'Entrando como admin (modo de teste).' });
  setTimeout(() => navigate('/admin-portal-9f3b7', { replace: true }), 50);
      return;
    }

    // Use Supabase magic link for secure admin login
    (async () => {
      setLoading(true);
      const email = username;
      try {
        const { error } = await supabase.auth.signInWithOtp({ email });
        setLoading(false);
        if (error) {
          toast({ title: 'Erro ao enviar link mágico', description: error.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Link enviado', description: 'Verifique seu e-mail para o link mágico de login.' });
      } catch (err: any) {
        setLoading(false);
        toast({ title: 'Erro inesperado', description: String(err), variant: 'destructive' });
      }
    })();
  };

  // Quick dev login (email/password) using env vars
  // Fixed emails for rapid access (requested)
  const quickAdminEmail = 'gustavoribeiro4523@gmail.com';
  const quickUserEmail = 'gustavosteam4523@gmail.com';
  // Fixed password for both (DEV only)
  const QUICK_PASSWORD = '123456';

  const quickLogin = async (kind: 'admin' | 'user') => {
  const qe = kind === 'admin' ? quickAdminEmail : quickUserEmail;
  if (!qe) { toast({ title: 'E-mail não definido', description: 'E-mail rápido ausente', variant: 'destructive' }); return; }
  const pwd = QUICK_PASSWORD;
    setLoading(true);
    try {
  const { error } = await supabase.auth.signInWithPassword({ email: qe, password: pwd });
      if (error) throw error;
      toast({ title: 'Login rápido', description: kind === 'admin' ? 'Admin autenticado' : 'Usuário autenticado' });
      if (kind === 'admin') {
        navigate('/admin-portal-9f3b7', { replace: true });
      } else {
        navigate('/perfil', { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Erro no login rápido', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-24 px-4 sm:py-16">
        <div className="w-full max-w-md mx-2 sm:mx-0">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Acesso restrito — apenas para administradores</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="admin-username">Usuário</Label>
                <Input id="admin-username" placeholder="Digite seu usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full" />
              </div>

              <div>
                <Label htmlFor="admin-password">Senha</Label>
                <Input id="admin-password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
              </div>

              <Button type="submit" className="w-full btn-cta" disabled={loading}>Entrar</Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  disabled={loading}
                  onClick={() => quickLogin('user')}
                  className="w-full justify-center gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 shadow-sm hover:shadow ring-1 ring-transparent hover:ring-primary/20 transition"
                >
                  <User className="h-4 w-4" />
                  Login Rápido Usuário
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={loading}
                  onClick={() => quickLogin('admin')}
                  className="w-full justify-center gap-2 btn-cta shadow-md hover:shadow-lg transition"
                >
                  <Shield className="h-4 w-4" />
                  Login Rápido Admin
                </Button>
              </div>

              {/* helper text removed as requested */}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLogin;
