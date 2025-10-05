import React, { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

  const queryClient = useQueryClient();

  // modal state for mobile-friendly confirmations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'cancel' | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalReason, setModalReason] = useState('');

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

    const totalBookings = scheduled.length;

    return { todayCount, monthCount, revenue, perBarber, totalBookings };
  }, [bookings, services, barbers, today, monthStart]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/");
  };

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
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Próximos agendamentos</h3>

              <div className="mb-3">
                <label className="block text-sm text-muted-foreground mb-1">Filtrar por barbeiro</label>
                <select value={barberFilter} onChange={(e)=> setBarberFilter(e.target.value)} className="w-full rounded border border-border p-2 bg-background">
                  <option value="">Todos</option>
                  {(barbers || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-80 overflow-auto">
                {(bookings || []).filter((b: any) => (barberFilter ? (b.barber_id === barberFilter || b.barber_name === barberFilter) : true)).map((b: any) => (
                  <div key={b.id} className={`w-full bg-card border p-3 rounded-md hover:shadow-sm transition ${b.status && b.status.toLowerCase().startsWith('cancel') ? 'border-red-200' : b.status && (b.status.toLowerCase().startsWith('comp') || b.status.toLowerCase().startsWith('concl')) ? 'border-green-200' : 'border-blue-50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm text-muted-foreground">{(b.client_name || '').split(' ').map((s:any)=>s[0]).slice(0,2).join('')}</div>
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">{b.client_name} — {(() => { try { return format(new Date(b.booking_date), 'd/M/yyyy', { locale: ptBR }) } catch { return b.booking_date } })()} {b.booking_time}</div>
                            <div className="text-xs px-2 py-0.5 rounded-full bg-muted/10 text-muted-foreground">{b.status ?? 'scheduled'}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{b.service_name ?? (services || []).find((s: any) => s.id === b.service_id)?.name ?? 'Serviço'} — {b.barber_name ?? (barbers || []).find((x: any) => x.id === b.barber_id)?.name ?? 'Barbeiro'}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end sm:items-end gap-2">
                        <div className="text-sm font-semibold">R$ {(b.service_price ?? (services || []).find((s:any)=> s.id===b.service_id)?.price ?? 0).toFixed(2)}</div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {!String(b.status || '').toLowerCase().startsWith('cancel') && (
                            <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)}>Cancelar</Button>
                          )}
                          {String(b.status || '').toLowerCase().startsWith('cancel') && <div className="text-xs text-red-600">Cancelado</div>}
                        </div>
                      </div>
                    </div>
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
                    <button className="mt-1 text-xs text-primary underline" onClick={() => { navigator.clipboard?.writeText(selectedBooking.client_phone); /* fallback */ alert('Telefone copiado'); }}>Copiar telefone</button>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Observação (opcional)</label>
                  <textarea value={modalReason} onChange={(e)=> setModalReason(e.target.value)} className="w-full rounded border border-border p-2 bg-background h-20" />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="w-full px-4 py-2 rounded-md border border-border text-sm" onClick={closeModal}>Fechar</button>
                  <button className="w-full px-4 py-2 rounded-md btn-danger text-sm" onClick={async () => {
                    if (!selectedBooking || modalAction !== 'cancel') return;
                    // optimistic remove: remove from cache immediately so it disappears from list
                    const cacheKey = ['admin-bookings'];
                    const previous = queryClient.getQueryData<any[]>(cacheKey);
                    queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter(b => String(b.id) !== String(selectedBooking.id)));

                    const { error } = await supabase.from('bookings').delete().eq('id', selectedBooking.id);
                    if (error) {
                      // revert
                      queryClient.setQueryData(cacheKey, previous as any);
                      alert('Erro: ' + error.message);
                      return;
                    }
                    // ensure server state synced
                    queryClient.invalidateQueries({ queryKey: cacheKey });
                    closeModal();
                  }}>Confirmar cancelamento</button>
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
