import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // hardcoded credentials as requested
    if (username === "and456" && password === "sp123") {
      try {
        localStorage.setItem("admin_token", "true");
      } catch (err) {
        console.error('Unable to write admin token to localStorage', err);
      }
      toast({ title: "Login efetuado", description: "Bem-vindo, admin!" });
      // ensure navigation happens after localStorage write; replace so back button doesn't go to login
      try {
        // small timeout to let react-router update after storage
        setTimeout(() => navigate("/admin", { replace: true }), 50);
      } catch (navErr) {
        // fallback to full reload if navigate isn't available for some reason
        console.error('navigate error', navErr);
        window.location.assign('/admin');
      }
    } else {
      toast({ title: "Credenciais inválidas", variant: "destructive" });
    }
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
                <p>Credenciais de teste: <strong>and456</strong> / <strong>sp123</strong></p>
                <p className="mt-1">Este login é temporário. Para produção, substitua por autenticação segura.</p>
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
