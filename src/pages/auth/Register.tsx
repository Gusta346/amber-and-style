import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'As senhas não conferem', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone },
          emailRedirectTo: window.location.origin + '/agendamento',
        },
      });
      if (error) throw error;
      toast({ title: 'Verifique seu e-mail', description: 'Enviamos um link de confirmação. Confirme para acessar sua conta.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Erro no cadastro', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e)=> setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={phone} onChange={(e)=> setPhone(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmar Senha</Label>
                  <Input id="confirm" type="password" value={confirm} onChange={(e)=> setConfirm(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</Button>
              </form>
              <div className="text-sm text-muted-foreground mt-4">Já tem conta? <Link to="/login" className="underline">Entrar</Link></div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
