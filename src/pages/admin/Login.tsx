import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

              <Button type="submit" className="w-full btn-cta">Entrar</Button>

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
