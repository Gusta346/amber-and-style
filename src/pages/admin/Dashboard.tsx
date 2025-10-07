import React, { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, getDay, startOfMonth, endOfMonth, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      // fetch bookings ordered by date and time ascending
      const { data, error } = await supabase.from("bookings").select("*").order('booking_date', { ascending: true }).order('booking_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // barber filter state: '' means all
  const [barberFilter, setBarberFilter] = React.useState<string>('');
  // show only today's bookings
  const [onlyToday, setOnlyToday] = useState<boolean>(false);

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: barbers } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Recent contact messages
  const { data: messages } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, created_at, name, email, phone, subject, message, status")
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Reviews moderation
  const { data: adminReviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, created_at, client_name, client_phone, rating, comment, featured, verified, service_type')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const [revFeaturedFilter, setRevFeaturedFilter] = useState<'all' | 'featured' | 'unfeatured'>('all');
  const [revQuery, setRevQuery] = useState('');

  const filteredReviews = useMemo(() => {
    let list = (adminReviews || []) as any[];
    if (revFeaturedFilter !== 'all') {
      const want = revFeaturedFilter === 'featured';
      list = list.filter(r => Boolean(r.featured) === want);
    }
    if (revQuery.trim()) {
      const q = revQuery.trim().toLowerCase();
      list = list.filter(r => String(r.comment || '').toLowerCase().includes(q) || String(r.client_name || '').toLowerCase().includes(q));
    }
    return list;
  }, [adminReviews, revFeaturedFilter, revQuery]);

  const toggleFeatured = async (id: string, current: boolean) => {
    const key = ['admin-reviews'];
    const prev = queryClient.getQueryData<any[]>(key) || [];
    queryClient.setQueryData<any[]>(key, (old = []) => (old || []).map(r => r.id === id ? { ...r, featured: !current } : r));
  const { error } = await (supabase as any).from('reviews').update({ featured: !current } as any).eq('id', id);
    if (error) {
      queryClient.setQueryData<any[]>(key, prev);
      toast({ title: 'Erro ao atualizar review', description: error.message, variant: 'destructive' });
    } else {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  };

  // Filters for messages
  const [msgStatusFilter, setMsgStatusFilter] = useState<'all' | 'new' | 'lida'>('all');
  const [msgSubjectQuery, setMsgSubjectQuery] = useState('');

  const filteredMessages = useMemo(() => {
    let list = (messages || []) as any[];
    if (msgStatusFilter !== 'all') {
      list = list.filter(m => String(m.status || 'new').toLowerCase() === (msgStatusFilter === 'lida' ? 'read' : 'new'));
    }
    if (msgSubjectQuery.trim()) {
      const q = msgSubjectQuery.trim().toLowerCase();
      list = list.filter(m => String(m.subject || '').toLowerCase().includes(q));
    }
    return list;
  }, [messages, msgStatusFilter, msgSubjectQuery]);

  const markMessageRead = async (id: string) => {
    const key = ['admin-contact-messages'];
    const prev = queryClient.getQueryData<any[]>(key) || [];
    // optimistic update
    queryClient.setQueryData<any[]>(key, (old = []) => (old || []).map(m => m.id === id ? { ...m, status: 'read' } : m));
    const { error } = await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id);
    if (error) {
      // revert
      queryClient.setQueryData<any[]>(key, prev);
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      // refresh list to reflect filters
      await queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const queryClient = useQueryClient();

  // modal state for mobile-friendly confirmations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'cancel' | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();
  
  // Helper to parse a booking row's local datetime safely
  // Supports booking_date formats: 'YYYY-MM-DD', ISO strings with 'T', or 'DD/MM/YYYY'
  // Supports booking_time formats: 'HH:MM' or 'HH:MM:SS' (may include timezone suffix which will be ignored)
  const getBookingDateTime = (b: any) => {
    try {
      const rawDate = b.booking_date;
      const dateStr = typeof rawDate === 'string' ? rawDate : (rawDate?.toString?.() || '');

      let y = 0, m = 0, d = 0;
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        // e.g., 2025-10-06 or 2025-10-06T00:00:00Z
        const isoDatePart = dateStr.slice(0, 10);
        const [yy, mm, dd] = isoDatePart.split('-').map((n) => parseInt(n, 10));
        y = yy; m = mm; d = dd;
      } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        // e.g., 06/10/2025 (DD/MM/YYYY)
        const [dd, mm, yy] = dateStr.slice(0, 10).split('/').map((n) => parseInt(n, 10));
        y = yy; m = mm; d = dd;
      } else {
        // Last resort: let Date parse and extract parts
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) return null;
        y = parsed.getFullYear();
        m = parsed.getMonth() + 1;
        d = parsed.getDate();
      }

      const timeStr = String(b.booking_time || '00:00');
      // Strip any timezone suffix like +00 or Z for parsing seconds
      const timeCore = timeStr.split(/[Z+\-]/)[0];
      const tparts = timeCore.split(':').map((v: string) => parseInt(v, 10));
      const hh = tparts[0] || 0;
      const mi = tparts[1] || 0;
      const ss = tparts[2] || 0;

      // Construct local date to avoid timezone shifts
      const dt = new Date(y, (m - 1), d, hh, mi, ss, 0);
      if (isNaN(dt.getTime())) return null;
      return dt;
    } catch {
      return null;
    }
  };
  
  const completeBooking = async (id: string) => {
    const cacheKey = ['admin-bookings'];
    const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
    // optimistic
    queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).map(b => String(b.id) === String(id) ? { ...b, status: 'completed' } : b));
    const { error } = await (supabase as any).from('bookings').update({ status: 'completed' } as any).eq('id', id);
    if (error) {
      queryClient.setQueryData<any[]>(cacheKey, prev);
      toast({ title: 'Erro ao concluir', description: error.message, variant: 'destructive' });
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cacheKey }),
        queryClient.invalidateQueries({ queryKey: ['bookings-range'] }),
      ]);
      toast({ title: 'Atendimento concluído' });
    }
  };

  const stats = useMemo(() => {
    const all = bookings || [];
    const scheduled = all.filter((b: any) => !(String(b.status).toLowerCase().startsWith('cancel')));
    const todayCount = scheduled.filter((b: any) => b.booking_date === today).length;
    const monthCount = scheduled.filter((b: any) => b.booking_date >= monthStart).length;
    const revenue = scheduled.reduce((sum: number, b: any) => {
      const price = Number(b.service_price ?? services?.find((s: any) => s.id === b.service_id)?.price ?? 0);
      return sum + price;
    }, 0);

    const perBarber: Record<string, number> = {};
    (barbers || []).forEach((bar: any) => { perBarber[bar.name] = 0; });
    scheduled.forEach((b: any) => {
      const name = b.barber_name ?? ((barbers || []).find((x: any) => x.id === b.barber_id)?.name) ?? String(b.barber_id);
      perBarber[name] = (perBarber[name] || 0) + 1;
    });

    return { todayCount, monthCount, revenue, perBarber };
  }, [bookings, services, barbers, today, monthStart]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/");
  };

  // quick helper: detect presence of the local admin token (legacy) so we can show guidance
  const hasLocalAdminToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('admin_token'));

  const cancelBooking = async (id: string) => {
    // open mobile modal instead of window.confirm
    const row = (bookings || []).find((b: any) => b.id === id);
    setSelectedBooking(row ?? null);
    setModalAction('cancel');
    setModalReason('');
    setModalOpen(true);
  };

  // removed 'complete' flow and status color mappings per request

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBooking(null);
    setModalAction(null);
    setModalReason('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <div className="flex items-center gap-3">
              
              <Button className="btn-cta" onClick={logout}>Sair</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Clientes hoje</div>
              <div className="text-2xl font-bold">{stats.todayCount}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Clientes este mês</div>
              <div className="text-2xl font-bold">{stats.monthCount}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Faturamento estimado</div>
              <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Clientes por Barbeiro</h3>
              <div className="space-y-2">
                {Object.entries(stats.perBarber).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <div>{name}</div>
                    <div className="font-medium">{count}</div>
                  </div>
                ))}
              </div>

              {/* Weekly breakdown for the current month */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Cortes por semana no mês</h4>
                <MonthlyWeeklyBreakdown bookings={bookings || []} />
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Próximos agendamentos</h3>

              <div className="mb-3 space-y-2">
                <label className="block text-sm text-muted-foreground mb-1">Filtrar por barbeiro</label>
                <select value={barberFilter} onChange={(e)=> setBarberFilter(e.target.value)} className="w-full rounded border border-border p-2 bg-background">
                  <option value="">Todos</option>
                  {(barbers || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onlyToday} onChange={(e)=> setOnlyToday(e.target.checked)} />
                  Cortes de hoje
                </label>
              </div>
              <div className="space-y-3 max-h-[60vh] sm:max-h-80 overflow-auto">
                {(bookings || [])
                  .filter((b: any) => (barberFilter ? (b.barber_id === barberFilter || b.barber_name === barberFilter) : true))
                  .filter((b: any) => (onlyToday ? b.booking_date === today : true))
                  // hide canceled bookings from the list so they don't reappear after optimistic updates
                  .filter((b: any) => !String(b.status || '').toLowerCase().startsWith('cancel'))
                  .map((b: any) => (
                  <div key={b.id} className={`w-full bg-card border p-3 rounded-md hover:shadow-sm transition ${b.status && b.status.toLowerCase().startsWith('cancel') ? 'border-red-200' : b.status && (b.status.toLowerCase().startsWith('comp') || b.status.toLowerCase().startsWith('concl')) ? 'border-green-200' : 'border-blue-50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm text-muted-foreground">{(b.client_name || '').split(' ').map((s:any)=>s[0]).slice(0,2).join('')}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-medium truncate">{b.client_name} — {(() => { try { return format(new Date(b.booking_date), 'd/M/yyyy', { locale: ptBR }) } catch { return b.booking_date } })()} {b.booking_time}</div>
                            <div className="text-xs px-2 py-0.5 rounded-full bg-muted/10 text-muted-foreground">{b.status ?? 'scheduled'}</div>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{b.service_name ?? (services || []).find((s: any) => s.id === b.service_id)?.name ?? 'Serviço'} — {b.barber_name ?? (barbers || []).find((x: any) => x.id === b.barber_id)?.name ?? 'Barbeiro'}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        <div className="text-sm font-semibold text-right sm:text-right">R$ {(b.service_price ?? (services || []).find((s:any)=> s.id===b.service_id)?.price ?? 0).toFixed(2)}</div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          {!String(b.status || '').toLowerCase().startsWith('cancel') && (
                            <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)} className="w-full sm:w-auto">Cancelar</Button>
                          )}
                          {/* Concluir removido por solicitação: manter apenas Cancelar */}
                          {String(b.status || '').toLowerCase().startsWith('cancel') && <div className="text-xs text-red-600 text-center sm:text-right">Cancelado</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Contact Messages */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Mensagens de Contato</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Buscar por assunto</label>
                  <input value={msgSubjectQuery} onChange={(e)=> setMsgSubjectQuery(e.target.value)} placeholder="Digite um assunto" className="w-full rounded border border-border p-2 bg-background text-sm" />
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-xs text-muted-foreground mb-1">Status</label>
                  <select value={msgStatusFilter} onChange={(e)=> setMsgStatusFilter(e.target.value as any)} className="w-full rounded border border-border p-2 bg-background text-sm">
                    <option value="all">Todos</option>
                    <option value="new">Novos</option>
                    <option value="lida">Lidas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-auto">
                {(filteredMessages || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma mensagem recebida ainda.</div>
                )}
                {(filteredMessages || []).map((m: any) => (
                  <div key={m.id} className="border rounded p-3 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.name || 'Sem nome'} — {(() => { try { return format(new Date(m.created_at), 'd/M HH:mm', { locale: ptBR }) } catch { return '' } })()}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.email || 'sem e-mail'} {m.phone ? `• ${m.phone}` : ''}</div>
                        <div className="text-xs text-muted-foreground truncate">Assunto: {m.subject || '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] px-2 py-0.5 rounded bg-muted/10 text-muted-foreground uppercase">{m.status || 'new'}</div>
                        {String(m.status || 'new').toLowerCase() !== 'read' && (
                          <Button variant="secondary" size="sm" className="h-7 px-2" onClick={() => markMessageRead(m.id)}>Marcar como lida</Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-line break-words">{m.message}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Reviews moderation */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Avaliações de Clientes</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Buscar por texto ou nome</label>
                  <input value={revQuery} onChange={(e)=> setRevQuery(e.target.value)} placeholder="Digite para filtrar" className="w-full rounded border border-border p-2 bg-background text-sm" />
                </div>
                <div className="w-full sm:w-56">
                  <label className="block text-xs text-muted-foreground mb-1">Destaque</label>
                  <select value={revFeaturedFilter} onChange={(e)=> setRevFeaturedFilter(e.target.value as any)} className="w-full rounded border border-border p-2 bg-background text-sm">
                    <option value="all">Todos</option>
                    <option value="featured">Destacados</option>
                    <option value="unfeatured">Não destacados</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-auto">
                {(filteredReviews || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma avaliação encontrada.</div>
                )}
                {(filteredReviews || []).map((r: any) => (
                  <div key={r.id} className="border rounded p-3 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < (r.rating || 0) ? 'text-primary' : 'text-muted-foreground'}`}>★</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">{(() => { try { return format(new Date(r.created_at), 'd/M HH:mm', { locale: ptBR }) } catch { return '' } })()}</div>
                        </div>
                        <div className="text-sm font-medium truncate">{r.client_name || 'Cliente'}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.client_phone || ''} {r.service_type ? `• ${r.service_type}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant={r.featured ? 'secondary' : 'outline'} size="sm" className="h-7 px-2" onClick={() => toggleFeatured(r.id, !!r.featured)}>
                          {r.featured ? 'Remover do Home' : 'Destaque no Home'}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-line break-words">{r.comment}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
      {/* Responsive modal with backdrop: bottom-sheet on mobile, centered on desktop */}
      {modalOpen && (
        // center modal on screen so message appears higher (avoid bottom corner)
        <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <div className="relative w-full sm:max-w-lg bg-background border-t border-border rounded-t-lg p-4 sm:rounded-lg sm:border sm:shadow-lg max-h-[75vh] sm:max-h-[90vh] overflow-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{modalAction === 'cancel' ? 'Confirmar cancelamento' : 'Confirmar ação'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBooking ? selectedBooking.client_name : 'Carregando...'}</p>
                </div>
                <button className="text-sm text-muted-foreground" onClick={closeModal}>Fechar</button>
              </div>

              <div className="space-y-3">
                <div className="text-sm">
                  <div>Telefone: <span className="font-medium">{selectedBooking?.client_phone ?? 'não informado'}</span></div>
                  {selectedBooking?.client_phone && (
                    <button className="mt-1 text-xs text-primary underline" onClick={() => { navigator.clipboard?.writeText(selectedBooking.client_phone); /* fallback */ toast({ title: 'Telefone copiado', description: selectedBooking.client_phone }); }}>Copiar telefone</button>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Observação (opcional)</label>
                  <textarea value={modalReason} onChange={(e)=> setModalReason(e.target.value)} className="w-full rounded border border-border p-2 bg-background h-20" />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="w-full px-4 py-2 rounded-md border border-border text-sm" onClick={closeModal}>Fechar</button>
                  <button
                    className={`w-full px-4 py-2 rounded-md btn-danger text-sm ${confirming ? 'opacity-60 cursor-wait' : ''}`}
                    disabled={confirming}
                    onClick={async () => {
                      if (!selectedBooking || modalAction !== 'cancel' || confirming) return;
                      setConfirming(true);
                      const cacheKey = ['admin-bookings'];
                      const previous = queryClient.getQueryData<any[]>(cacheKey);

                      try {
                        // optimistic remove from UI
                        queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter(b => String(b.id) !== String(selectedBooking.id)));

                        // Try to delete; if delete not permitted, fall back to marking canceled
                        const delRes = await supabase.from('bookings').delete().eq('id', selectedBooking.id).select();
                        // supabase-js returns { data, error }
                        if (delRes.error) {
                          // attempt fallback: update status to canceled
                          const upRes = await supabase.from('bookings').update({ status: 'canceled', canceled_at: new Date().toISOString(), notes: (selectedBooking.notes ?? '') + '\nCancel reason: ' + modalReason }).eq('id', selectedBooking.id).select();
                          if (upRes.error) {
                            // revert optimistic change and notify
                            queryClient.setQueryData(cacheKey, previous as any);
                            const msg = upRes.error.message || delRes.error.message || 'Erro desconhecido';
                            toast({ title: 'Erro ao cancelar', description: msg, variant: 'destructive' });
                            setConfirming(false);
                            return;
                          }
                        }

                        // success (either deleted or marked canceled). Refresh relevant caches.
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: cacheKey }),
                          queryClient.invalidateQueries({ queryKey: ['bookings-range'] }),
                        ]);

                        // Refetch admin bookings to confirm the row is gone
                        await queryClient.refetchQueries({ queryKey: ['admin-bookings'] });
                        const fresh = queryClient.getQueryData<any[]>(['admin-bookings']) || [];
                        const still = (fresh || []).find(b => String(b.id) === String(selectedBooking.id));
                        if (still) {
                          // Booking still exists after attempts: likely DB policy prevented delete/update.
                          toast({ title: 'Cancelamento não persistiu', description: 'DELETE/UPDATE pode estar bloqueado por Row-Level Security. Verifique as policies no Supabase.', variant: 'destructive' });
                        } else {
                          toast({ title: 'Agendamento cancelado', description: 'O agendamento foi removido com sucesso.' });
                        }

                        closeModal();
                      } catch (err: any) {
                        // revert optimistic change and show message
                        queryClient.setQueryData(cacheKey, previous as any);
                        toast({ title: 'Erro ao cancelar', description: String(err?.message || err), variant: 'destructive' });
                      } finally {
                        setConfirming(false);
                      }
                    }}
                  >
                    {confirming ? 'Cancelando...' : 'Confirmar cancelamento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;

// Component: MonthlyWeeklyBreakdown
// For the current month, split days into calendar weeks and count bookings per weekday for each week.
function MonthlyWeeklyBreakdown({ bookings }: { bookings: any[] }) {
  const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Track 'now' so component can auto-update at midnight and switch month/week automatically
  const [now, setNow] = React.useState<Date>(() => new Date());
  React.useEffect(() => {
    // compute ms until next local midnight + 2 seconds buffer
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 2, 0);
    const ms = Math.max(1000, next.getTime() - Date.now());
    const t = setTimeout(() => setNow(new Date()), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Determine current month range
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Build weeks: each week starts on Sunday (startOfWeek default)
  const weeks: { start: Date; end: Date; label: string }[] = [];
  let cursor = startOfWeek(monthStart, { weekStartsOn: 0 });
  let weekIndex = 1;
  while (cursor <= monthEnd) {
    const start = new Date(cursor);
    const end = addDays(start, 6);
    weeks.push({ start, end, label: `Semana ${weekIndex}` });
    cursor = addDays(cursor, 7);
    weekIndex += 1;
  }

  // For each week compute counts per weekday
  const weeksCounts = weeks.map(w => {
    const counts = new Array(7).fill(0);
    bookings.forEach(b => {
      try {
        const d = new Date(b.booking_date);
        // only count if in the week's interval and also within the current month
        if (d >= w.start && d <= w.end && d >= monthStart && d <= monthEnd) {
          const idx = getDay(d);
          counts[idx] = counts[idx] + 1;
        }
      } catch (e) {
        // ignore parse errors
      }
    });
    return counts;
  });

  return (
    <div className="space-y-3">
      {weeks.map((w, i) => (
        <div key={i} className="p-2 border border-border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{w.label} <span className="text-xs text-muted-foreground">({format(w.start, 'd/MM')} - {format(w.end, 'd/MM')})</span></div>
            <div className="text-sm text-muted-foreground">Total: {weeksCounts[i].reduce((a,b)=>a+b,0)}</div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {daysShort.map((dShort, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="text-muted-foreground text-[10px]">{dShort}</div>
                <div className="font-semibold">{weeksCounts[i][idx]}</div>
              </div>
            ))}
          </div>

          {/* compact grid above shows counts per weekday; removed redundant inline summary */}
        </div>
      ))}
    </div>
  );
}
