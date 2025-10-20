import React, { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, getDay, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Track 'now' to enable month rollover behaviors (e.g., calendar limits auto-update at midnight)
  const [now, setNow] = useState<Date>(() => new Date());
  React.useEffect(() => {
    // schedule update shortly after next local midnight
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 2, 0);
    const ms = Math.max(1000, next.getTime() - Date.now());
    const t = setTimeout(() => setNow(new Date()), ms);
    return () => clearTimeout(t);
  }, [now]);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // Allowed calendar window: current month through end of next month
  const allowedStartDate = React.useMemo(() => startOfMonth(now), [now]);
  const allowedEndDate = React.useMemo(() => endOfMonth(addMonths(now, 1)), [now]);

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
  const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
  // Day-blocks management state
  const [blockBarberId, setBlockBarberId] = useState<string>('');
  const [blockDate, setBlockDate] = useState<Date | undefined>(undefined);
  const [blockReason, setBlockReason] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any).auth.getUser();
        setCurrentUser(data?.user || null);
      } catch {}
    })();
  }, []);

  const { data: myAdminRows } = useQuery({
    queryKey: ['my-admin', currentUser?.id || 'none'],
    enabled: !!currentUser,
    queryFn: async () => {
      const uid = currentUser?.id;
      if (!uid) return [] as any[];
      const { data, error } = await (supabase as any)
        .from('admins')
        .select('user_id, email')
        .eq('user_id', uid)
        .limit(1);
      if (error) throw error;
      return data as any[];
    },
  });
  const isAdmin = !!(myAdminRows && myAdminRows.length > 0);

  // Safe parser for date-only strings (yyyy-MM-dd) to avoid timezone shifting one day back/forward
  const parseLocalDateFromYYYYMMDD = (val: any) => {
    try {
      const s = String(val || '');
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
        // Use noon to be extra safe against DST edges
        return new Date(y, mo - 1, d, 12, 0, 0, 0);
      }
      const t = new Date(val);
      if (isNaN(t.getTime())) return null;
      return t;
    } catch { return null; }
  };

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Subscribers management
  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subscribers")
        .select("id, email, name, phone, plan_id, status, created_at, start_date, notes")
        .order('created_at', { ascending: false });
      if (error) {
        const msg = String(error?.message || '');
        if ((error as any)?.code === 'PGRST116' || (error as any)?.status === 404 || /not\s*found|404/i.test(msg)) {
          return [] as any[];
        }
        throw error;
      }
      return data as any[];
    },
  });

  // Load available plans for create-time selection only
  const { data: plans } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('id, name, price')
        .order('price', { ascending: true });
      if (error) throw error;
      return data as any[];
    }
  });

  const [newSubscriberEmail, setNewSubscriberEmail] = useState("");
  const [newSubscriberPlan, setNewSubscriberPlan] = useState<string>("");
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  const addSubscriber = async () => {
    const email = (newSubscriberEmail || '').trim().toLowerCase();
    if (!email) { toast({ title: 'Informe um e-mail', variant: 'destructive' }); return; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) { toast({ title: 'E-mail inválido', description: 'Digite no formato nome@dominio.com', variant: 'destructive' }); return; }
    setAddingSubscriber(true);
    try {
  const payload: any = { email };
  if (newSubscriberPlan) payload.plan_id = newSubscriberPlan;
  const { data, error } = await (supabase as any).from('subscribers').insert(payload).select().single();
      if (error) throw error;
      toast({ title: 'Assinante adicionado', description: email });
      setNewSubscriberEmail("");
  setNewSubscriberPlan("");
      await queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const desc = /unique|duplicate/i.test(msg) ? 'Este e-mail já está cadastrado como assinante.' : msg;
      toast({ title: 'Não foi possível adicionar', description: desc, variant: 'destructive' });
    } finally {
      setAddingSubscriber(false);
    }
  };

  // Removed inline update controls per request

  const removeSubscriber = async (id: string) => {
    try {
      const cacheKey = ['admin-subscribers'];
      const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
      queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter((s: any) => String(s.id) !== String(id)));
      const { error } = await (supabase as any).from('subscribers').delete().eq('id', id);
      if (error) {
        queryClient.setQueryData<any[]>(cacheKey, prev);
        toast({ title: 'Erro ao remover assinante', description: error.message, variant: 'destructive' });
      } else {
        await queryClient.invalidateQueries({ queryKey: cacheKey });
        toast({ title: 'Assinante removido' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: String(err?.message || err), variant: 'destructive' });
    }
  };

  const { data: barbers } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch day blocks (optionally filtered by selected barber for management)
  const { data: blocks, isLoading: blocksLoading } = useQuery({
    queryKey: ["barber-day-blocks", blockBarberId || 'all'],
    queryFn: async () => {
      let q: any = (supabase as any)
        .from('barber_day_blocks')
        .select('id, barber_id, block_date, reason, created_at')
        .order('block_date', { ascending: true });
      if (blockBarberId) q = q.eq('barber_id', blockBarberId);
      const { data, error } = await q;
      if (error) {
        // If table doesn't exist remotely yet, treat as empty instead of throwing
        const msg = String(error?.message || '');
        if ((error as any)?.code === 'PGRST116' || (error as any)?.status === 404 || /not\s*found|404/i.test(msg)) {
          return [] as any[];
        }
        throw error;
      }
      return data as any[];
    },
  });

  // Ensure selected block date stays within the allowed window; clear if out-of-range after month rollover
  React.useEffect(() => {
    if (!blockDate) return;
    try {
      if (blockDate < allowedStartDate || blockDate > allowedEndDate) {
        setBlockDate(undefined);
      }
    } catch {}
  }, [blockDate, allowedStartDate, allowedEndDate]);

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

  // Students (Aluno) management
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_enrollments")
        .select("id, email, created_at")
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as Array<{ id: string; email: string; created_at: string }>;
    },
  });

  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const addStudent = async () => {
    const raw = (newStudentEmail || "").trim();
    if (!raw) {
      toast({ title: 'Informe um e-mail', variant: 'destructive' });
      return;
    }
    // Simple e-mail check
    const email = raw.toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      toast({ title: 'E-mail inválido', description: 'Digite um e-mail no formato nome@dominio.com', variant: 'destructive' });
      return;
    }
    setAddingStudent(true);
    try {
  const { data, error } = await (supabase as any).from('student_enrollments').insert({ email }).select().single();
      if (error) throw error;
      toast({ title: 'Aluno adicionado', description: email });
      setNewStudentEmail("");
      await queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    } catch (err: any) {
      const msg = String(err?.message || err);
      // unique violation friendly msg
      const desc = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique') ? 'Este e-mail já está cadastrado como aluno.' : msg;
      toast({ title: 'Não foi possível adicionar', description: desc, variant: 'destructive' });
    } finally {
      setAddingStudent(false);
    }
  };

  const removeStudent = async (id: string) => {
    try {
      const cacheKey = ['admin-students'];
      const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
      // optimistic remove
      queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter((s: any) => String(s.id) !== String(id)));
  const { error } = await (supabase as any).from('student_enrollments').delete().eq('id', id);
      if (error) {
        queryClient.setQueryData<any[]>(cacheKey, prev);
        toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      } else {
        await queryClient.invalidateQueries({ queryKey: cacheKey });
        toast({ title: 'Aluno removido' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: String(err?.message || err), variant: 'destructive' });
    }
  };

  // modal state for mobile-friendly confirmations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'cancel' | 'delete-message' | 'delete-review' | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
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
    // Count only bookings within the current month window
    const monthCount = scheduled.filter((b: any) => (String(b.booking_date) >= monthStart && String(b.booking_date) <= monthEnd)).length;
    // Monthly revenue: sum only within current month
    const revenue = scheduled.filter((b: any) => (String(b.booking_date) >= monthStart && String(b.booking_date) <= monthEnd)).reduce((sum: number, b: any) => {
      const price = Number(b.service_price ?? services?.find((s: any) => s.id === b.service_id)?.price ?? 0);
      return sum + price;
    }, 0);

    // Today's revenue from cuts only (status confirmed or completed)
    const revenueTodayCuts = (all as any[])
      .filter((b) => String(b.booking_date) === today)
      .filter((b) => String(b.status || '').toLowerCase() === 'completed')
      .filter((b) => {
        const sname = String(
          b.service_name ?? (services || []).find((s: any) => s.id === b.service_id)?.name ?? ''
        ).toLowerCase();
        return sname.includes('corte');
      })
      .reduce((sum, b) => {
        const price = Number(b.service_price ?? services?.find((s: any) => s.id === b.service_id)?.price ?? 0);
        return sum + price;
      }, 0);

    const totalSubscribers = (subscribers || []).length;

    const perBarber: Record<string, number> = {};
    (barbers || []).forEach((bar: any) => { perBarber[bar.name] = 0; });
    scheduled.forEach((b: any) => {
      const name = b.barber_name ?? ((barbers || []).find((x: any) => x.id === b.barber_id)?.name) ?? String(b.barber_id);
      perBarber[name] = (perBarber[name] || 0) + 1;
    });

    return { todayCount, monthCount, revenue, perBarber, revenueTodayCuts, totalSubscribers };
  }, [bookings, services, barbers, today, monthStart, subscribers]);

  // unified recent history: last 5 of cancelled or completed
  const recentHistory = useMemo(() => {
    const list = (bookings || []).filter((b: any) => {
      const s = String(b.status || '').toLowerCase();
      return s.startsWith('cancel') || s.startsWith('comp') || s.startsWith('concl');
    });
    const byDate = (row: any) => {
      const s = String(row.canceled_at || row.updated_at || row.created_at || '')
      const t = Date.parse(s);
      return isNaN(t) ? 0 : t;
    };
    const ordered = list.sort((a, b) => byDate(b) - byDate(a));
    return ordered.slice(0, 5);
  }, [bookings]);

  // Permanently delete a history booking from DB
  const deleteHistoryBooking = async (id: string) => {
    const cacheKey = ['admin-bookings'];
    const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
    // optimistic remove
    queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter((b: any) => String(b.id) !== String(id)));
    const { error } = await (supabase as any).from('bookings').delete().eq('id', id);
    if (error) {
      queryClient.setQueryData<any[]>(cacheKey, prev);
      toast({ title: 'Erro ao remover histórico', description: error.message, variant: 'destructive' });
    } else {
      await queryClient.invalidateQueries({ queryKey: cacheKey });
      toast({ title: 'Item removido', description: 'Agendamento removido do histórico.' });
    }
  };

  // Cleanup: keep only the latest 5 history items in DB
  React.useEffect(() => {
    const runCleanup = async () => {
      try {
        const list = (bookings || []).filter((b: any) => {
          const s = String(b.status || '').toLowerCase();
          return s.startsWith('cancel') || s.startsWith('comp') || s.startsWith('concl');
        });
        if (list.length <= 5) return;
        const byDate = (row: any) => {
          const s = String(row.canceled_at || row.updated_at || row.created_at || '')
          const t = Date.parse(s);
          return isNaN(t) ? 0 : t;
        };
        const ordered = [...list].sort((a, b) => byDate(b) - byDate(a));
        const toDelete = ordered.slice(5).map((b: any) => b.id);
        if (toDelete.length === 0) return;
        // optimistic remove from cache
        const cacheKey = ['admin-bookings'];
        const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
        queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter((b: any) => !toDelete.includes(b.id)));
        const { error } = await (supabase as any).from('bookings').delete().in('id', toDelete);
        if (error) {
          queryClient.setQueryData<any[]>(cacheKey, prev);
          toast({ title: 'Erro ao limpar histórico', description: error.message, variant: 'destructive' });
        } else {
          await queryClient.invalidateQueries({ queryKey: cacheKey });
          toast({ title: 'Histórico limpo', description: `${toDelete.length} itens antigos removidos.` });
        }
      } catch (e: any) {
        // silent
      }
    };
    if (viewMode === 'history' && bookings) {
      runCleanup();
    }
  }, [viewMode, bookings, queryClient]);

  // removed separate recentCancelled/recentCompleted (use recentHistory instead)

  const revertBooking = async (row: any) => {
    const cacheKey = ['admin-bookings'];
    const prev = queryClient.getQueryData<any[]>(cacheKey) || [];
    // optimistic
    queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).map((b: any) => (
      String(b.id) === String(row.id) ? { ...b, status: 'confirmed', canceled_at: null } : b
    )));
    const { error } = await (supabase as any).from('bookings').update({ status: 'confirmed', canceled_at: null } as any).eq('id', row.id);
    if (error) {
      queryClient.setQueryData<any[]>(cacheKey, prev);
      toast({ title: 'Erro ao reverter', description: error.message, variant: 'destructive' });
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cacheKey }),
        queryClient.invalidateQueries({ queryKey: ['bookings-range'] }),
      ]);
      toast({ title: 'Agendamento revertido', description: 'Status voltou para confirmado.' });
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    localStorage.removeItem("admin_token");
    navigate("/login", { replace: true });
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
    setSelectedMessage(null);
    setSelectedReview(null);
  };

  // Openers for delete actions
  const deleteMessage = (id: string) => {
    const row = (messages || []).find((m: any) => String(m.id) === String(id));
    setSelectedMessage(row ?? null);
    setModalAction('delete-message');
    setModalReason('');
    setModalOpen(true);
  };

  const deleteReview = (id: string) => {
    const row = (adminReviews || []).find((r: any) => String(r.id) === String(id));
    setSelectedReview(row ?? null);
    setModalAction('delete-review');
    setModalReason('');
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

  <main className="pt-36 md:pt-40 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <div className="flex items-center gap-3">
              
              <Button className="btn-cta" onClick={logout}>Sair</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Clientes hoje</div>
              <div className="text-2xl font-bold">{stats.todayCount}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Clientes este mês</div>
              <div className="text-2xl font-bold">{stats.monthCount}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Faturamento mensal estimado</div>
              <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Faturamento hoje (apenas cortes concluídos)</div>
              <div className="text-2xl font-bold">R$ {stats.revenueTodayCuts.toFixed(2)}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total de assinantes</div>
              <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
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

              {/* Monthly breakdown for the current month */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Cortes no mês</h4>
                <MonthlyWeeklyBreakdown bookings={bookings || []} />
              </div>
            </Card>

            <Card className="p-4 relative z-10 isolate">
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
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setViewMode((m) => (m === 'upcoming' ? 'history' : 'upcoming'))}
                  >
                    {viewMode === 'history' ? 'Voltar aos próximos' : `Ver histórico (${recentHistory.length})`}
                  </Button>
                </div>
              </div>
              <div className={`space-y-3 overflow-auto ${viewMode === 'history' ? 'max-h-[70vh] sm:max-h-[75vh]' : 'max-h-[60vh] sm:max-h-80'} relative z-10` }>
                {viewMode === 'upcoming' ? (
                  (bookings || [])
                    .filter((b: any) => (barberFilter ? (b.barber_id === barberFilter || b.barber_name === barberFilter) : true))
                    .filter((b: any) => (onlyToday ? b.booking_date === today : true))
                    // hide cancelled bookings from the list so they don't reappear after optimistic updates
                    .filter((b: any) => {
                      const s = String(b.status || '').toLowerCase();
                      // exclude cancelled and completed/concluído
                      return !(s.startsWith('cancel')) && !s.startsWith('comp') && !s.startsWith('concl');
                    })
                    .map((b: any) => (
                    <div key={b.id} className={`w-full bg-card border p-3 rounded-md hover:shadow-sm transition ${b.status && b.status.toLowerCase().startsWith('cancel') ? 'border-red-200' : b.status && (b.status.toLowerCase().startsWith('comp') || b.status.toLowerCase().startsWith('concl')) ? 'border-green-200' : 'border-blue-50'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm text-muted-foreground">{(b.client_name || '').split(' ').map((s:any)=>s[0]).slice(0,2).join('')}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium truncate">{b.client_name} — {(() => { try { const dt = getBookingDateTime(b); return dt ? format(dt, 'd/M/yyyy', { locale: ptBR }) : b.booking_date } catch { return b.booking_date } })()} {b.booking_time}</div>
                              <div className="text-xs px-2 py-0.5 rounded-full bg-muted/10 text-muted-foreground">{b.status ?? 'scheduled'}</div>
                            </div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-2 flex-wrap">
                              <span>{b.service_name ?? (services || []).find((s: any) => s.id === b.service_id)?.name ?? 'Serviço'} — {b.barber_name ?? (barbers || []).find((x: any) => x.id === b.barber_id)?.name ?? 'Barbeiro'}</span>
                              {(() => { const price0 = Number(b.service_price ?? NaN) === 0; const tag = String(b.notes || '').toLowerCase().includes('[assinante]'); return price0 || tag; })() && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">Assinante</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                          <div className="text-sm font-semibold text-right sm:text-right">R$ {(b.service_price ?? (services || []).find((s:any)=> s.id===b.service_id)?.price ?? 0).toFixed(2)}</div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            {/* Actions only when not cancelled or completed */}
                            {(() => { const s = String(b.status || '').toLowerCase(); return !s.startsWith('cancel') && !s.startsWith('comp') && !s.startsWith('concl'); })() && (
                              <>
                                <Button variant="secondary" size="sm" onClick={() => completeBooking(b.id)} className="w-full sm:w-auto">Concluir</Button>
                                <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)} className="w-full sm:w-auto">Cancelar</Button>
                              </>
                            )}
                            {String(b.status || '').toLowerCase().startsWith('cancel') && <div className="text-xs text-red-600 text-center sm:text-right">Cancelado</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {recentHistory.length === 0 && (
                      <div className="text-sm text-muted-foreground">Sem histórico recente.</div>
                    )}
                    {recentHistory.map((b: any) => {
                      const s = String(b.status || '').toLowerCase();
                      const badge = s.startsWith('cancel') ? 'bg-red-100 text-red-700' : (s.startsWith('comp') || s.startsWith('concl')) ? 'bg-green-100 text-green-700' : 'bg-muted/10 text-muted-foreground';
                      return (
                        <div key={b.id} className="relative border rounded p-2 bg-card flex items-start justify-between gap-2">
                          <button
                            aria-label="Remover do histórico"
                            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground text-xs"
                            onClick={() => deleteHistoryBooking(String(b.id))}
                          >
                            ×
                          </button>
                          <div className="min-w-0 pr-6">
                            <div className="text-sm font-medium truncate">{b.client_name || 'Cliente'} — {(() => { try { const dt = getBookingDateTime(b); return dt ? format(dt, 'd/M', { locale: ptBR }) : b.booking_date } catch { return b.booking_date } })()} {b.booking_time}</div>
                            <div className="text-xs text-muted-foreground truncate">{b.service_name || (services || []).find((s:any)=> s.id===b.service_id)?.name || 'Serviço'} • {b.barber_name || (barbers || []).find((x:any)=> x.id===b.barber_id)?.name || 'Barbeiro'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-[11px] px-2 py-0.5 rounded ${badge}`}>{b.status || ''}</div>
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => revertBooking(b)}>Reverter</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Barber day blocks management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Bloquear dia do barbeiro</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Barbeiro</label>
                  <select value={blockBarberId} onChange={(e)=> setBlockBarberId(e.target.value)} className="w-full rounded border border-border p-2 bg-background">
                    <option value="">Selecione um barbeiro</option>
                    {(barbers || []).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Escolha a data</label>
                  <Calendar
                    mode="single"
                    selected={blockDate}
                    onSelect={(d: any) => setBlockDate(d ?? undefined)}
                    locale={ptBR}
                    fromMonth={allowedStartDate}
                    toMonth={allowedEndDate}
                    fromDate={allowedStartDate}
                    toDate={allowedEndDate}
                    disabled={(date: Date) => date < allowedStartDate || date > allowedEndDate}
                    className="rounded-md border border-border"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    placeholder="Motivo (opcional)"
                    value={blockReason}
                    onChange={(e)=> setBlockReason(e.target.value)}
                    className="w-full rounded border border-border p-2 bg-background text-sm"
                  />
                  <Button
                    disabled={!blockBarberId || !blockDate || !currentUser || !isAdmin}
                    onClick={async () => {
                      if (!blockBarberId || !blockDate) return;
                      try {
                        // Normalize to YYYY-MM-DD in local time to avoid off-by-one
                        const loc = blockDate as Date;
                        const dNorm = new Date(loc.getFullYear(), loc.getMonth(), loc.getDate(), 12, 0, 0, 0);
                        const dStr = format(dNorm, 'yyyy-MM-dd');
                        // optimistic update via invalidation only (simple path)
                        const { error } = await (supabase as any).from('barber_day_blocks').insert({ barber_id: blockBarberId, block_date: dStr, reason: blockReason || null }).select();
                        if (error) throw error;
                        setBlockReason('');
                        toast({ title: 'Dia bloqueado', description: 'O barbeiro não poderá receber agendamentos nesse dia.' });
                        await queryClient.invalidateQueries({ queryKey: ['barber-day-blocks'] });
                        await queryClient.invalidateQueries({ queryKey: ['barber-day-blocks-range'] });
                      } catch (err: any) {
                        const msg = String(err?.message || '').toLowerCase();
                        const isRls = msg.includes('row-level security') || msg.includes('rls') || (err?.code === '42501');
                        const desc = isRls
                          ? 'Permissão negada. Faça login como admin (Perfil) e confirme que seu usuário está na tabela admins.'
                          : (err?.message || 'Tente novamente.');
                        toast({ title: 'Erro ao bloquear dia', description: desc, variant: 'destructive' });
                      }
                    }}
                  >
                    Bloquear dia
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Dias bloqueados</h3>
              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {(blocksLoading) && <div className="text-sm text-muted-foreground">Carregando…</div>}
                {!blocksLoading && (blocks || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum dia bloqueado.</div>
                )}
                {(blocks || []).map((bk: any) => (
                  <div key={bk.id} className="border rounded p-2 bg-card flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {(() => { try { const dt = parseLocalDateFromYYYYMMDD(bk.block_date); return dt ? format(dt, "d 'de' MMMM yyyy", { locale: ptBR }) : String(bk.block_date); } catch { return String(bk.block_date) } })()} — {(barbers || []).find((b: any) => b.id === bk.barber_id)?.name || 'Barbeiro'}
                      </div>
                      {bk.reason && <div className="text-xs text-muted-foreground truncate">{bk.reason}</div>}
                    </div>
                    <Button variant="outline" size="sm" className="h-7 px-2" disabled={!isAdmin} onClick={async () => {
                      try {
                        const { error } = await (supabase as any).from('barber_day_blocks').delete().eq('id', bk.id);
                        if (error) throw error;
                        await queryClient.invalidateQueries({ queryKey: ['barber-day-blocks'] });
                        await queryClient.invalidateQueries({ queryKey: ['barber-day-blocks-range'] });
                      } catch (err: any) {
                        const msg = String(err?.message || '').toLowerCase();
                        const isRls = msg.includes('row-level security') || msg.includes('rls') || (err?.code === '42501');
                        const desc = isRls
                          ? 'Permissão negada. Faça login como admin (Perfil) e confirme que seu usuário está na tabela admins.'
                          : (err?.message || 'Tente novamente.');
                        toast({ title: 'Erro ao remover bloqueio', description: desc, variant: 'destructive' });
                      }
                    }}>Remover</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Students (Aluno) management */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Alunos (Área do Curso)</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="E-mail do aluno"
                  className="w-full rounded border border-border p-2 bg-background text-sm"
                />
                <Button onClick={addStudent} disabled={addingStudent} className="w-full sm:w-auto">
                  {addingStudent ? 'Adicionando…' : 'Adicionar' }
                </Button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {studentsLoading && <div className="text-sm text-muted-foreground">Carregando alunos…</div>}
                {!studentsLoading && (!students || students.length === 0) && (
                  <div className="text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</div>
                )}
                {(students || []).map((s: any) => (
                  <div key={s.id} className="border rounded p-3 bg-card flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.email}</div>
                      <div className="text-xs text-muted-foreground truncate">desde {(() => { try { return format(new Date(s.created_at), 'd/M/yyyy HH:mm', { locale: ptBR }) } catch { return '' } })()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => removeStudent(s.id)}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          

          {/* Subscribers (Assinantes) management */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Assinantes</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="email"
                  value={newSubscriberEmail}
                  onChange={(e) => setNewSubscriberEmail(e.target.value)}
                  placeholder="E-mail do assinante"
                  className="w-full rounded border border-border p-2 bg-background text-sm"
                />
                <select
                  value={newSubscriberPlan}
                  onChange={(e) => setNewSubscriberPlan(e.target.value)}
                  className="w-full sm:w-64 rounded border border-border p-2 bg-background text-sm"
                >
                  <option value="">Tipo de plano (opcional)</option>
                  {(plans || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price || 0).toFixed(2)}</option>
                  ))}
                </select>
                <Button onClick={addSubscriber} disabled={addingSubscriber || !isAdmin} className="w-full sm:w-auto">
                  {addingSubscriber ? 'Adicionando…' : 'Adicionar'}
                </Button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {subscribersLoading && <div className="text-sm text-muted-foreground">Carregando assinantes…</div>}
                {!subscribersLoading && (!subscribers || subscribers.length === 0) && (
                  <div className="text-sm text-muted-foreground">Nenhum assinante cadastrado ainda.</div>
                )}
                {(subscribers || []).map((s: any) => (
                  <div key={s.id} className="border rounded p-3 bg-card flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.email}</div>
                      <div className="text-xs text-muted-foreground truncate">Plano: {(() => { const p = (plans || []).find((x:any)=> x.id === s.plan_id); return p ? `${p.name} (R$ ${Number(p.price||0).toFixed(2)})` : '—'; })()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => removeSubscriber(s.id)} disabled={!isAdmin}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Removed redundant Recent cancelled/completed sections (now covered by inline history toggle) */}

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
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => deleteMessage(m.id)}>Excluir</Button>
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
                          {/* Desktop timestamp (hidden on mobile) */}
                          <div className="hidden sm:block text-xs text-muted-foreground">{(() => { try { return format(new Date(r.created_at), 'd/M HH:mm', { locale: ptBR }) } catch { return '' } })()}</div>
                        </div>
                        <div className="text-sm font-medium truncate">{r.client_name || 'Cliente'}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.client_phone || ''} {r.service_type ? `• ${r.service_type}` : ''}</div>
                      </div>
                      {/* Actions: stack on mobile, row on desktop */}
                      <div className="flex gap-2 items-end sm:items-center flex-col sm:flex-row text-right">
                        <div className="flex gap-2">
                          <Button variant={r.featured ? 'secondary' : 'outline'} size="sm" className="h-7 px-2" onClick={() => toggleFeatured(r.id, !!r.featured)}>
                            {r.featured ? 'Remover do Home' : 'Destaque no Home'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => deleteReview(r.id)}>Excluir</Button>
                        </div>
                        {/* Mobile timestamp positioned under the Destaque button, aligned to bottom-right */}
                        <div className="block sm:hidden text-[11px] text-muted-foreground mt-1 self-end">{(() => { try { return format(new Date(r.created_at), 'd/M HH:mm', { locale: ptBR }) } catch { return '' } })()}</div>
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
        // center modal on screen
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4`}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeModal} />

          <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-xl p-0 sm:shadow-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center text-red-500">!</div>
                <h3 className="text-base sm:text-lg font-semibold">
                    {modalAction === 'cancel' && 'Confirmar cancelamento'}
                    {modalAction === 'delete-message' && 'Excluir mensagem'}
                    {modalAction === 'delete-review' && 'Excluir avaliação'}
                </h3>
              </div>

              <div className="space-y-4 px-5 py-4">
                {modalAction === 'cancel' && (
                  <div className="text-sm">
                    <div className="mb-1">Cliente: <span className="font-medium">{selectedBooking?.client_name ?? '—'}</span></div>
                    <div>Telefone: <span className="font-medium">{selectedBooking?.client_phone ?? 'não informado'}</span></div>
                    {selectedBooking?.client_phone && (
                      <button className="mt-2 text-xs text-primary underline" onClick={() => { navigator.clipboard?.writeText(selectedBooking.client_phone); /* fallback */ toast({ title: 'Telefone copiado', description: selectedBooking.client_phone }); }}>Copiar telefone</button>
                    )}
                  </div>
                )}

                {modalAction === 'cancel' && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Observação (opcional)</label>
                    <textarea value={modalReason} onChange={(e)=> setModalReason(e.target.value)} className="w-full rounded-md border border-border p-2 bg-background h-24" placeholder="Adicione um motivo ou observação..." />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 px-5 py-4 border-t border-border/60 bg-muted/10">
                  <button
                    className={`w-full sm:w-auto px-4 py-2 rounded-md btn-danger text-sm ${confirming ? 'opacity-60 cursor-wait' : 'hover:opacity-95'}`}
                    disabled={confirming}
                    onClick={async () => {
                      setConfirming(true);
                      try {
                        if (modalAction === 'cancel') {
                          if (!selectedBooking) { setConfirming(false); return; }
                          const cacheKey = ['admin-bookings'];
                          const previous = queryClient.getQueryData<any[]>(cacheKey);
                          // optimistic remove from UI
                          queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter(b => String(b.id) !== String(selectedBooking.id)));
                          // Always mark as canceled with observation; no DELETE to keep history
                          const upRes = await supabase.from('bookings').update({ status: 'cancelled', canceled_at: new Date().toISOString(), notes: ((selectedBooking.notes ?? '') + (modalReason ? ('\nObservação: ' + modalReason) : '')).trim() }).eq('id', selectedBooking.id).select();
                          if (upRes.error) {
                            queryClient.setQueryData(cacheKey, previous as any);
                            toast({ title: 'Erro ao cancelar', description: upRes.error.message, variant: 'destructive' });
                            setConfirming(false);
                            return;
                          }
                          await Promise.all([
                            queryClient.invalidateQueries({ queryKey: cacheKey }),
                            queryClient.invalidateQueries({ queryKey: ['bookings-range'] }),
                          ]);
                          await queryClient.refetchQueries({ queryKey: ['admin-bookings'] });
                          toast({ title: 'Agendamento cancelado', description: 'Status atualizado para cancelado.' });
                          closeModal();
                        } else if (modalAction === 'delete-message') {
                          if (!selectedMessage) { setConfirming(false); return; }
                          const cacheKey = ['admin-contact-messages'];
                          const previous = queryClient.getQueryData<any[]>(cacheKey);
                          // optimistic remove
                          queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter(m => String(m.id) !== String(selectedMessage.id)));
                          const { error } = await supabase.from('contact_messages').delete().eq('id', selectedMessage.id);
                          if (error) {
                            queryClient.setQueryData<any[]>(cacheKey, previous as any);
                            toast({ title: 'Erro ao excluir mensagem', description: error.message, variant: 'destructive' });
                            setConfirming(false);
                            return;
                          }
                          await queryClient.invalidateQueries({ queryKey: cacheKey });
                          await queryClient.refetchQueries({ queryKey: cacheKey });
                          const fresh = queryClient.getQueryData<any[]>(cacheKey) || [];
                          const still = (fresh || []).find(m => String(m.id) === String(selectedMessage.id));
                          if (still) {
                            toast({ title: 'Exclusão não persistiu', description: 'DELETE pode estar bloqueado por políticas (RLS) no Supabase.', variant: 'destructive' });
                          } else {
                            toast({ title: 'Mensagem excluída' });
                          }
                          closeModal();
                        } else if (modalAction === 'delete-review') {
                          if (!selectedReview) { setConfirming(false); return; }
                          const cacheKey = ['admin-reviews'];
                          const previous = queryClient.getQueryData<any[]>(cacheKey);
                          // optimistic remove
                          queryClient.setQueryData<any[]>(cacheKey, (old = []) => (old || []).filter(r => String(r.id) !== String(selectedReview.id)));
                          const { error } = await supabase.from('reviews').delete().eq('id', selectedReview.id);
                          if (error) {
                            queryClient.setQueryData<any[]>(cacheKey, previous as any);
                            toast({ title: 'Erro ao excluir avaliação', description: error.message, variant: 'destructive' });
                            setConfirming(false);
                            return;
                          }
                          await queryClient.invalidateQueries({ queryKey: cacheKey });
                          await queryClient.refetchQueries({ queryKey: cacheKey });
                          const fresh = queryClient.getQueryData<any[]>(cacheKey) || [];
                          const still = (fresh || []).find(r => String(r.id) === String(selectedReview.id));
                          if (still) {
                            toast({ title: 'Exclusão não persistiu', description: 'DELETE pode estar bloqueado por políticas (RLS) no Supabase.', variant: 'destructive' });
                          } else {
                            toast({ title: 'Avaliação excluída' });
                          }
                          closeModal();
                        }
                      } catch (err: any) {
                        toast({ title: 'Erro', description: String(err?.message || err), variant: 'destructive' });
                      } finally {
                        setConfirming(false);
                      }
                    }}
                  >
                    {confirming
                      ? (modalAction === 'cancel' ? 'Cancelando...' : 'Excluindo...')
                      : (modalAction === 'cancel' ? 'Confirmar cancelamento' : 'Confirmar exclusão')}
                  </button>
                  <button className="w-full sm:w-auto px-4 py-2 rounded-md border border-border text-sm hover:bg-muted/50" onClick={closeModal}>Fechar</button>
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

  // Track 'now' so component can auto-update at midnight and switch month automatically
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

  // Compute counts per weekday for the entire current month
  const counts = new Array(7).fill(0);
  bookings.forEach((b) => {
    try {
      const d = (() => {
        const raw = b.booking_date as any;
        if (!raw) return null;
        const s = String(raw);
        let y = 0, m = 0, dv = 0;
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          const [yy, mm, dd] = s.slice(0, 10).split('-').map((n) => parseInt(n, 10));
          y = yy; m = mm; dv = dd;
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
          const [dd, mm, yy] = s.slice(0, 10).split('/').map((n) => parseInt(n, 10));
          y = yy; m = mm; dv = dd;
        } else {
          const t = new Date(s);
          if (isNaN(t.getTime())) return null;
          return t;
        }
        return new Date(y, m - 1, dv, 0, 0, 0, 0);
      })();
      if (!d) return;
      if (d >= monthStart && d <= monthEnd) {
        const idx = getDay(d);
        counts[idx] = counts[idx] + 1;
      }
    } catch {}
  });

  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="p-2 border border-border rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Este mês <span className="text-xs text-muted-foreground">({format(monthStart, 'd/MM')} - {format(monthEnd, 'd/MM')})</span></div>
          <div className="text-sm text-muted-foreground">Total: {total}</div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {daysShort.map((dShort, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="text-muted-foreground text-[10px]">{dShort}</div>
              <div className="font-semibold">{counts[idx]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
