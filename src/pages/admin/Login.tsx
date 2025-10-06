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
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Acesso restrito — apenas para administradores</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-username">Usuário</Label>
                <Input id="admin-username" placeholder="Digite seu usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="admin-password">Senha</Label>
                <Input id="admin-password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full btn-cta">Entrar</Button>

              <div className="mt-2 text-center text-xs text-muted-foreground">
                <p>Use seu e-mail de administrador para receber um link mágico. Depois de logar via Supabase, insira seu usuário como admin no banco (veja as instruções no painel).</p>
                <p className="mt-1">Observação: este app exige que exista uma linha correspondente em <code>public.admins</code> para permitir UPDATE/DELETE em agendamentos.</p>
                <p className="mt-2 text-xs">Ou use credenciais de teste: <strong>and456 / sp123</strong></p>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLogin;
