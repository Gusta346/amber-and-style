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
  if (from && from.startsWith('/agendamento')) {
    navigate(from, { replace: true });
  } else {
    navigate('/perfil', { replace: true });
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
              {/* Destacar o cadastro primeiro */}
              <div className="mb-4 p-3 rounded-md border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">Ainda não tem conta?</div>
                  <div className="text-muted-foreground">Crie a sua em minutos e garanta seu próximo horário sem fila.</div>
                </div>
                <Link to="/registrar">
                  <Button className="btn-cta whitespace-nowrap">Criar conta</Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground mb-3">Já tem uma conta? Faça login abaixo.</p>
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
              {/* Link reforçado ao cadastro também no rodapé (opcional) */}
              <div className="text-sm text-muted-foreground mt-4 text-center">
                Não tem conta?{' '}
                <Link to="/registrar" className="font-semibold text-primary underline-offset-4 hover:underline">Criar conta</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
