import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  toast({ title: 'Login realizado!' });
  const from = (location.state as any)?.from as string | undefined;
  if (from) {
    navigate(from, { replace: true });
  }
    } catch (err: any) {
      toast({ title: 'Erro no login', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Reenvio de verificação removido por solicitação: verificação apenas no cadastro

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Ainda não tem conta? Crie a sua em minutos e garanta seu próximo horário sem fila.</p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
              </form>
              <div className="text-sm text-muted-foreground mt-4">Não tem conta? <Link to="/registrar" className="underline">Criar conta</Link></div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
