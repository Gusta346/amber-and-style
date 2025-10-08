import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Perfil: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        setName((user.user_metadata as any)?.name || '');
        setPhone((user.user_metadata as any)?.phone || '');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!userId) { setIsAdmin(false); return; }
      try {
        const { data, error } = await (supabase as any)
          .from('admins')
          .select('user_id')
          .eq('user_id', userId)
          .limit(1);
        if (!error && Array.isArray(data) && data.length > 0) setIsAdmin(true);
        else setIsAdmin(false);
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [userId]);

  // Check student enrollment by email
  useEffect(() => {
    (async () => {
      try {
        if (!email) { setIsStudent(false); return; }
        const { data, error } = await (supabase as any)
          .from('student_enrollments')
          .select('id')
          .eq('email', email)
          .limit(1);
        if (error) { setIsStudent(false); return; }
        setIsStudent(Array.isArray(data) && data.length > 0);
      } catch { setIsStudent(false); }
    })();
  }, [email]);

  const { data: myBookings, isLoading } = useQuery({
    queryKey: ['my-bookings', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select('id, booking_date, booking_time, service_name, service_price, barber_name, status, notes')
        .eq('user_id', userId)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data as unknown) as Array<{ id: string; booking_date: string; booking_time: string; service_name: string | null; service_price: number | null; barber_name: string | null; status: string | null; notes?: string | null }>;
    },
  });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name, phone } });
      if (error) throw error;
      toast({ title: 'Perfil atualizado' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const signOutAndGo = async (to: 'home' | 'login') => {
    try { await supabase.auth.signOut(); } catch {}
    navigate(to === 'home' ? '/' : '/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {isStudent && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Área do Aluno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-muted-foreground mb-4">
                      <p>Bem-vindo à sua área de estudos! Aqui você acompanha os módulos do seu curso e seu progresso.</p>
                    </div>
                    {/* Módulos estáticos por enquanto; futuramente podemos carregar de uma tabela 'course_modules' */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[{title:'Módulo 1: Fundamentos do Corte', desc:'Técnicas básicas, ergonomia e ferramentas'},
                        {title:'Módulo 2: Estilos Modernos', desc:'Skin fade, navalhado e acabamentos'},
                        {title:'Módulo 3: Barba & Acabamento', desc:'Design de barba, tesoura e navalha'},
                        {title:'Módulo 4: Experiência do Cliente', desc:'Atendimento, higiene e fidelização'}].map((m, idx) => (
                        <div key={idx} className="p-4 border border-border rounded-md bg-background">
                          <div className="font-semibold mb-1">{m.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">{m.desc}</div>
                          <div className="text-[11px] px-2 py-1 rounded bg-muted/10 inline-block">Status: Em breve</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Meus últimos agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando...</div>
                  ) : !myBookings || myBookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Você ainda não possui agendamentos.</div>
                  ) : (
                    <div className="space-y-3">
                      {myBookings.map((b) => {
                        const dateLabel = b.booking_date ? format(new Date(b.booking_date + 'T00:00:00'), "dd 'de' MMMM yyyy", { locale: ptBR }) : '—';
                        const s = String(b.status || 'agendado').toLowerCase();
                        const statusLabel = s.startsWith('comp') || s.startsWith('concl') ? 'Concluído' : s.startsWith('cancel') ? 'Cancelado' : (b.status || 'Agendado');
                        let obs: string | null = null;
                        if (s.startsWith('cancel') && b.notes) {
                          const idx = b.notes.toLowerCase().indexOf('observação:');
                          if (idx >= 0) {
                            obs = b.notes.substring(idx + 'observação:'.length).trim();
                          } else {
                            obs = b.notes.trim();
                          }
                          if (obs === '') obs = null;
                        }
                        return (
                          <div key={b.id} className="p-3 rounded-md border border-border bg-background flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{b.service_name || 'Serviço'}</div>
                                <div className="text-xs text-muted-foreground">{dateLabel} às {b.booking_time || '—'} • {b.barber_name || 'Barbeiro'}</div>
                              </div>
                              <div className="text-right">
                                {typeof b.service_price === 'number' && (
                                  <div className="text-sm">R$ {b.service_price.toFixed(2)}</div>
                                )}
                                <div className={`text-[11px] inline-block px-2 py-0.5 rounded ${s.startsWith('comp') || s.startsWith('concl') ? 'bg-green-100 text-green-700' : s.startsWith('cancel') ? 'bg-red-100 text-red-700' : 'bg-muted/10 text-muted-foreground'}`}>{statusLabel}</div>
                              </div>
                            </div>
                            {obs && (
                              <div className="text-xs text-muted-foreground">Obs: {obs}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Meu Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSave} className="space-y-4">
                    <div>
                      <Label>E-mail</Label>
                      <Input value={email} disabled />
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input value={name} onChange={(e)=> setName(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input value={phone} onChange={(e)=> setPhone(e.target.value)} required />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={() => signOutAndGo('login')}>Trocar conta…</Button>
                    <Button variant="ghost" onClick={() => signOutAndGo('home')}>Sair</Button>
                    {isAdmin && (
                      <Button onClick={() => navigate('/admin-portal-9f3b7')}>Ir para Admin</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
