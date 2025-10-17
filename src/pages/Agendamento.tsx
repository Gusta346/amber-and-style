import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { format, addDays, addMonths, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase as sb } from '@/integrations/supabase/client';

const Agendamento = () => {
  const { toast } = useToast();
  const [reviewPrompt, setReviewPrompt] = useState<{ name: string; phone: string } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [formData, setFormData] = useState({
    serviceId: "",
    barberId: "",
    time: "",
    notes: "",
  });
  const [authedUser, setAuthedUser] = useState<{ id: string; email: string; name: string; phone: string } | null>(null);

  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  // On mount: fetch auth user + show review prompt if there's a pending review flag in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pending_review_prompt');
      if (raw) {
        const v = JSON.parse(raw);
        if (v?.name && v?.phone) {
          setReviewPrompt({ name: v.name, phone: v.phone });
        }
      }
    } catch {}
    (async () => {
      const { data } = await sb.auth.getUser();
      const user = data.user;
      if (user) {
        setAuthedUser({ id: user.id, email: user.email || '', name: (user.user_metadata as any)?.name || '', phone: (user.user_metadata as any)?.phone || '' });
      }
    })();
  }, []);

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: combos } = useQuery({
    queryKey: ["service_combos"],
    queryFn: async () => {
      // service_combos may not be typed in the generated supabase client
      const { data, error } = await (supabase as any).from("service_combos").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: barbers } = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Subscriber and plan info (self)
  const { data: subscriber } = useQuery({
    queryKey: ["subscriber-self", authedUser?.email],
    enabled: !!authedUser?.email,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscribers')
        .select('id, email, status, plan_id, start_date')
        .eq('email', authedUser!.email)
        .maybeSingle();
      if (error) {
        // If RLS prevents access for non-matching emails, simply return null
        if ((error as any)?.code === 'PGRST116' || (error as any)?.status === 404) return null;
        throw error;
      }
      return data as { id: string; email: string; status: string; plan_id: string | null; start_date: string | null } | null;
    },
  });

  const { data: plan } = useQuery({
    queryKey: ["subscription-plan", subscriber?.plan_id],
    enabled: !!subscriber?.plan_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('id,name,price,billing_period,max_services')
        .eq('id', subscriber!.plan_id)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string; price: number; billing_period: string; max_services: number | null } | null;
    },
  });

  // Only consider benefits if subscriber is active
  const hasActivePlan = !!(subscriber && String(subscriber.status || '').toLowerCase() === 'active' && subscriber.plan_id && plan);

  // Compute current billing period (monthly)
  const periodStart = useMemo(() => startOfMonth(new Date()), []);
  const periodEnd = useMemo(() => endOfMonth(new Date()), []);

  // Fetch my bookings in current period to compute usage (client-side classify eligible services)
  const { data: myPeriodBookings } = useQuery({
    queryKey: [
      'my-bookings-period',
      authedUser?.email,
      format(periodStart, 'yyyy-MM-dd'),
      format(periodEnd, 'yyyy-MM-dd')
    ],
  enabled: !!authedUser?.email,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select('id, client_email, booking_date, status, service_id, service_name')
        .eq('client_email', authedUser!.email)
        .gte('booking_date', format(periodStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(periodEnd, 'yyyy-MM-dd'))
        .order('booking_date', { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; client_email: string; booking_date: string; status: string; service_id: string; service_name: string }>;
    },
  });

  // Heuristic: classify if a service is included in plan
  const isEligibleForPlan = (planName?: string, serviceName?: string) => {
  if (!planName || !serviceName) return false;
    const pn = planName.toLowerCase();
    const sn = serviceName.toLowerCase();
    // "corte e barba" plan: requires both terms
    if (pn.includes('corte') && pn.includes('barba')) {
      return sn.includes('corte') && sn.includes('barba');
    }
    // "corte" plan: include corte, exclude explicit barba combos
    if (pn.includes('corte')) {
      return sn.includes('corte') && !sn.includes('barba');
    }
    // Fallback: not eligible
    return false;
  };

  // Count completed eligible uses in current period
  const usedEligibleCount = useMemo(() => {
    if (!hasActivePlan || !plan || !myPeriodBookings) return 0;
    return myPeriodBookings.filter((b) => {
      const st = String(b.status || '').toLowerCase();
      const cancelled = st.startsWith('cancel');
      // Count all non-cancelled eligible bookings in the period as consuming a credit
      return !cancelled && isEligibleForPlan(plan.name, b.service_name);
    }).length;
  }, [hasActivePlan, plan, myPeriodBookings]);

  const maxServices = hasActivePlan ? (plan?.max_services ?? null) : null;
  const remainingEligible = maxServices != null ? Math.max(0, maxServices - usedEligibleCount) : null;

  // Fetch day blocks for next 60 days to enforce per-barber day-off
  // dayBlocks query is declared after computing today/rangeEnd

  // hardcoded barber options shown in the UI (kept for legacy slugs), reuse below
  const defaultBarbers = [
    { slug: 'anderson', name: 'Anderson' },
    { slug: 'pedro', name: 'Pedro' },
    { slug: 'andre', name: 'Andre' },
  ];

  // Calendar window: only current month and next month
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const nextMonthStart = useMemo(() => addMonths(startOfMonth(new Date()), 1), []);
  const allowedStartDate = monthStart;
  const allowedEndDate = useMemo(() => endOfMonth(nextMonthStart), [nextMonthStart]);

  // Fetch bookings up to end of next month to mark unavailable dates/times
  const today = new Date();
  const rangeEnd = allowedEndDate;
  const bookingsQueryKey = ["bookings-range", format(today, "yyyy-MM-dd"), format(rangeEnd, "yyyy-MM-dd")];
  // Fetch day blocks for next 60 days to enforce per-barber day-off
  const { data: dayBlocks } = useQuery({
    queryKey: ["barber-day-blocks-range", format(today, "yyyy-MM-dd"), format(rangeEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('barber_day_blocks')
        .select('id, barber_id, block_date')
        .gte('block_date', format(today, 'yyyy-MM-dd'))
        .lte('block_date', format(rangeEnd, 'yyyy-MM-dd'));
      if (error) {
        const msg = String(error?.message || '');
        if ((error as any)?.code === 'PGRST116' || (error as any)?.status === 404 || /not\s*found|404/i.test(msg)) {
          return [] as Array<{ id: string; barber_id: string; block_date: string }>;
        }
        throw error;
      }
      return data as Array<{ id: string; barber_id: string; block_date: string }>;
    },
  });
  const { data: bookings } = useQuery({
    queryKey: bookingsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date,booking_time,barber_id,service_id,status")
        .gte("booking_date", format(today, "yyyy-MM-dd"))
        .lte("booking_date", format(rangeEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data;
    },
  });

  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set()); // fully-booked times (all barbers)
  const [bookedTimesByBarber, setBookedTimesByBarber] = useState<Record<string, Set<string>>>({});
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  const bookedDates = useMemo(() => {
    // compute dates that are fully booked (every time slot is booked by all barbers)
    const dateMap: Record<string, Record<string, Set<string>>> = {};
    (bookings || []).forEach((b: any) => {
      if (!b || String(b.status).toLowerCase().startsWith('cancel')) return;
      const d = b.booking_date;
      const t = b.booking_time;
      const bid = String(b.barber_id ?? '');
      if (!d || !t) return;
      dateMap[d] = dateMap[d] || {};
      dateMap[d][t] = dateMap[d][t] || new Set();
      dateMap[d][t].add(bid);
    });

    const full = new Set<string>();
    const barberCount = defaultBarbers.length;
    Object.entries(dateMap).forEach(([d, timesObj]) => {
      // count how many times are fully booked (i.e., booked by all barbers)
      const fullyBookedTimes = Object.keys(timesObj).filter((t) => (timesObj[t]?.size || 0) >= barberCount);
      if (fullyBookedTimes.length >= timeSlots.length) full.add(d);
    });
    return full;
  }, [bookings]);

  // Build map of date -> set of blocked barber ids
  const blockedBarbersByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    (dayBlocks || []).forEach((b: any) => {
      // normalize date string to safe yyyy-MM-dd
      let d = String(b.block_date);
      if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
        d = d.slice(0, 10);
      } else {
        try {
          const t = new Date(b.block_date);
          if (!isNaN(t.getTime())) d = format(new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0), 'yyyy-MM-dd');
        } catch {}
      }
      const bid = String(b.barber_id);
      if (!d || !bid) return;
      if (!map[d]) map[d] = new Set<string>();
      map[d].add(bid);
    });
    return map;
  }, [dayBlocks]);

  // If selected date becomes blocked for the chosen barber, clear barber selection
  useEffect(() => {
    if (!date || !formData.barberId) return;
    const dStr = format(date, 'yyyy-MM-dd');
    const selectedBarberId = (() => {
      const found = (barbers as any)?.find((bb: any) => bb.id === formData.barberId || bb.slug === formData.barberId || String(bb.name || '').toLowerCase() === String(formData.barberId).toLowerCase());
      return String(found?.id ?? formData.barberId);
    })();
    if (blockedBarbersByDate[dStr]?.has(selectedBarberId)) {
      setFormData((p) => ({ ...p, barberId: '' }));
    }
  }, [date, blockedBarbersByDate]);

  useEffect(() => {
    // If selected date falls out of the allowed window (current + next month), clear it
    if (!date) return;
    const d0 = startOfDay(date).getTime();
    const min0 = startOfDay(allowedStartDate).getTime();
    const max0 = startOfDay(allowedEndDate).getTime();
    if (d0 < min0 || d0 > max0) {
      setDate(undefined);
    }
  }, [date, allowedStartDate, allowedEndDate]);

  useEffect(() => {
    // if serviceId passed in query, preselect it
    const serviceId = query.get("serviceId");
    if (serviceId) {
      setFormData((prev) => ({ ...prev, serviceId }));
    }
  }, [query]);

  // update booked times and barbers whenever date changes
  useEffect(() => {
    if (!date) {
      setBookedTimes(new Set());
      setBookedTimesByBarber({});
      return;
    }
    const dStr = format(date, "yyyy-MM-dd");
    // consider only non-canceled bookings for availability
    const todays = (bookings || []).filter((b: any) => b.booking_date === dStr && !(String(b.status).toLowerCase().startsWith('cancel')));
    const timesByBarber: Record<string, Set<string>> = {};
    const timeToBarbers: Record<string, Set<string>> = {};

    const getDurationForBooking = (bk: any) => {
      // try to find the service/combo duration from known lists; default to 60 minutes
      const sid = bk.service_id;
      let duration = 60;
      if (sid) {
        const svc = services?.find((s: any) => s.id === sid);
        if (svc && svc.duration) duration = Number(svc.duration);
        else {
          const combo = combos?.find((c: any) => c.id === sid);
          if (combo && combo.duration) duration = Number(combo.duration);
        }
      }
      return duration || 60;
    };

    const getOccupiedSlots = (startTime: string, durationMinutes: number) => {
      const startIndex = timeSlots.indexOf(startTime);
      // if not found, try to parse and find nearest slot
      const idx = startIndex >= 0 ? startIndex : timeSlots.findIndex(t => t === startTime);
      const slotsNeeded = Math.max(1, Math.ceil(durationMinutes / 30));
      const res: string[] = [];
      for (let i = 0; i < slotsNeeded; i++) {
        const s = timeSlots[idx + i];
        if (!s) break;
        res.push(s);
      }
      return res;
    };

    todays.forEach((bk: any) => {
      const bid = String(bk.barber_id ?? '');
      const t = bk.booking_time;
      if (!t) return;
      const duration = getDurationForBooking(bk);
      const occupied = getOccupiedSlots(t, duration);
      timesByBarber[bid] = timesByBarber[bid] || new Set();
      occupied.forEach((slot) => {
        timesByBarber[bid].add(slot);
        timeToBarbers[slot] = timeToBarbers[slot] || new Set();
        timeToBarbers[slot].add(bid);
      });
    });

    // mark time as fully-booked only when all barbers are booked at that time
    const barberCount = (barbers && barbers.length) || defaultBarbers.length;
    const fullyBookedTimes = Object.keys(timeToBarbers).filter(t => (timeToBarbers[t].size || 0) >= barberCount);
    setBookedTimes(new Set(fullyBookedTimes));
    setBookedTimesByBarber(timesByBarber);
  }, [date, bookings]);

  const queryClient = useQueryClient();

  // helper: get duration (minutes) for a service/combo id, fallback 60
  const getDurationForServiceId = (sid: any) => {
    if (!sid) return 60;
    const svc = services?.find((s: any) => s.id === sid);
    if (svc && svc.duration) return Number(svc.duration);
    const combo = combos?.find((c: any) => c.id === sid);
    if (combo && combo.duration) return Number(combo.duration);
    return 60;
  };

  const parseTimeToMinutes = (timeStr: string) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    return hh * 60 + mm;
  };

  const timesOverlap = (startA: string, durA: number, startB: string, durB: number) => {
    const a0 = parseTimeToMinutes(startA);
    const a1 = a0 + durA;
    const b0 = parseTimeToMinutes(startB);
    const b1 = b0 + durB;
    return Math.max(a0, b0) < Math.min(a1, b1);
  };

  const handleNext = () => {
    // validation per step
    if (currentStep === 1 && !formData.serviceId) {
      toast({ title: "Escolha um serviço", description: "Selecione um serviço antes de continuar.", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && !date) {
      toast({ title: "Escolha uma data", description: "Selecione a data desejada.", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && (!formData.barberId || !formData.time)) {
      toast({ title: "Barbeiro e horário", description: "Selecione barbeiro e horário.", variant: "destructive" });
      return;
    }
    // Avança até o último passo (4 no total)
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!date || !formData.serviceId || !formData.barberId || !formData.time) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (!authedUser || !authedUser.name || !authedUser.phone) {
      toast({ title: 'Complete seu perfil', description: 'Atualize seu nome e telefone em Perfil antes de agendar.', variant: 'destructive' });
      navigate('/perfil');
      return;
    }

    try {
      // Map barber slug (e.g. 'anderson') to real DB id if possible
      let barberDbId = formData.barberId;
      if (barbers && barbers.length) {
        const found = barbers.find((b: any) => b.slug === formData.barberId || b.id === formData.barberId || b.name?.toLowerCase() === String(formData.barberId).toLowerCase());
        if (found) barberDbId = found.id;
      }

      // Snapshot details for the chosen service or combo
      const selectedService = services?.find((s: any) => s.id === formData.serviceId) || (combos as any)?.find((c: any) => c.id === formData.serviceId);
      const snapshotName = selectedService?.name || null;
      let snapshotPrice = (typeof selectedService?.price === 'number') ? Number(selectedService.price) : (selectedService?.price ? Number(selectedService.price) : null);
      const barberSnapshotName = (barbers as any)?.find((bb: any) => bb.id === barberDbId)?.name || null;

      // Apply subscriber benefit if eligible and remaining > 0
  const eligibleIncluded = !!(hasActivePlan && plan && remainingEligible != null && remainingEligible > 0 && isEligibleForPlan(plan.name, snapshotName || ''));
      if (eligibleIncluded) {
        snapshotPrice = 0;
      }

      const { error } = await supabase.from("bookings").insert({
        user_id: authedUser.id,
        client_name: authedUser.name,
        client_email: authedUser.email,
        client_phone: authedUser.phone,
        service_id: formData.serviceId,
        barber_id: barberDbId,
        booking_date: format(date, "yyyy-MM-dd"),
        booking_time: formData.time,
        notes: eligibleIncluded ? `${formData.notes ? formData.notes + '\n' : ''}[Assinante] Este serviço está incluso no plano (${plan?.name}).` : formData.notes,
        service_name: snapshotName,
        service_price: snapshotPrice,
        barber_name: barberSnapshotName,
      });

      if (error) throw error;

      // refresh bookings cache so UI (and admin) sees the new booking
      try { 
        await queryClient.invalidateQueries({ queryKey: bookingsQueryKey }); 
      } catch (err) { /* ignore */ }
      try {
        await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      } catch (err) { /* ignore */ }

      toast({ title: "Agendamento realizado!", description: "Seu horário foi agendado com sucesso. Entraremos em contato para confirmação." });

      // Depois de agendar, verificar se o cliente tem um atendimento anterior concluído
      try {
  const name = authedUser.name.trim();
  const phone = authedUser.phone.trim();
        if (name && phone) {
          const { data: prev, error: prevErr } = await supabase
            .from('bookings')
            .select('id, status, booking_date, booking_time, service_id, barber_id')
            .eq('client_name', name)
            .eq('client_phone', phone)
            .order('booking_date', { ascending: false })
            .limit(5);
          if (!prevErr) {
            // Existe algum agendamento anterior marcado como completed/concluído?
            const hadCompleted = (prev || []).some((b: any) => String(b.status || '').toLowerCase().startsWith('comp') || String(b.status || '').toLowerCase().startsWith('concl'));
            if (hadCompleted) {
              // Guardar uma flag local para mostrar um prompt de avaliação na próxima visita
              try {
                localStorage.setItem('pending_review_prompt', JSON.stringify({ name, phone, ts: Date.now() }));
              } catch {}
            }
          }
        }
      } catch {}

      // Reset form and go to step 1
      setFormData({ serviceId: "", barberId: "", time: "", notes: "" });
      setDate(undefined);
      setCurrentStep(1);
      // optionally navigate back to home or a success page
      navigate("/");
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível realizar o agendamento. Tente novamente.", variant: "destructive" });
    }
  };

  return (
  <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {reviewPrompt && (
            <Card className="bg-card border-primary/30 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="text-sm">
                    Você já foi atendido anteriormente. Gostaria de avaliar sua última consulta?
                  </div>
                  {!reviewOpen ? (
                    <div className="flex gap-2">
                      <Button className="btn-cta" onClick={() => setReviewOpen(true)}>Avaliar agora</Button>
                      <Button variant="ghost" onClick={() => { try { localStorage.removeItem('pending_review_prompt'); } catch {}; setReviewPrompt(null); }}>Depois</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-1 block">Nota</Label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(n => (
                            <button type="button" key={n} onClick={() => setReviewRating(n)} className={`px-2 py-1 rounded border ${reviewRating >= n ? 'bg-primary text-white' : 'bg-background border-border text-foreground'}`}>{n}★</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1 block">Comentário</Label>
                        <Textarea value={reviewComment} onChange={(e)=> setReviewComment(e.target.value)} placeholder="Conte como foi sua experiência" className="bg-background border-border" rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            if (!reviewPrompt) return;
                            if (!reviewRating) { toast({ title: 'Informe uma nota', variant: 'destructive' }); return; }
                            try {
                              const { error } = await supabase.from('reviews').insert({
                                client_name: reviewPrompt.name,
                                client_phone: reviewPrompt.phone,
                                rating: reviewRating,
                                comment: reviewComment || 'Sem comentário',
                                verified: false,
                              });
                              if (error) throw error;
                              try { localStorage.removeItem('pending_review_prompt'); } catch {}
                              setReviewPrompt(null);
                              setReviewOpen(false);
                              setReviewComment('');
                              setReviewRating(5);
                              toast({ title: 'Obrigado pela sua avaliação!' });
                              try {
                                await queryClient.invalidateQueries({ queryKey: ['reviews-all'] });
                                await queryClient.invalidateQueries({ queryKey: ['reviews-featured'] });
                              } catch {}
                            } catch (err: any) {
                              toast({ title: 'Erro ao enviar avaliação', description: String(err?.message || err), variant: 'destructive' });
                            }
                          }}
                          className="btn-cta"
                        >Enviar</Button>
                        <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="text-gradient">Agendar Horário</span>
            </h1>
            <p className="text-muted-foreground">Siga os passos para concluir seu agendamento</p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Agendamento - Passo {currentStep} de 4</CardTitle>
              <CardDescription>Selecione as opções e confirme seu horário</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step content */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {hasActivePlan && plan && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="font-semibold">Assinante ativo</span>: {plan.name}
                        </div>
                        {maxServices != null && (
                          <div>
                            Restantes neste mês: <span className="font-semibold">{remainingEligible}</span> de {maxServices}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <Label>Escolha o serviço ou combo *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services?.map((service) => (
                      <button
                        key={`s-${service.id}`}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, serviceId: service.id, barberId: prev.barberId }))}
                        className={`p-4 rounded-md border cursor-pointer text-left ${formData.serviceId === service.id ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{service.name}</div>
                            <div className="text-sm text-muted-foreground">R$ {service.price.toFixed(2)}</div>
                            {hasActivePlan && plan && isEligibleForPlan(plan.name, service.name) && (
                              <div className="text-xs mt-1">
                                {remainingEligible && remainingEligible > 0 ? (
                                  <span className="text-green-600">Preço assinante: R$ 0,00 (incluso) • Restam {remainingEligible}</span>
                                ) : (
                                  <span className="text-muted-foreground">Limite do plano atingido neste mês</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{service.duration ?? '—'} min</div>
                        </div>
                      </button>
                    ))}

                    {combos?.map((combo) => (
                      <button
                        key={`c-${combo.id}`}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, serviceId: combo.id, barberId: prev.barberId }))}
                        className={`p-4 rounded-md border cursor-pointer text-left ${formData.serviceId === combo.id ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{combo.name}</div>
                            <div className="text-sm text-muted-foreground">R$ {combo.price.toFixed(2)}</div>
                            {hasActivePlan && plan && isEligibleForPlan(plan.name, combo.name) && (
                              <div className="text-xs mt-1">
                                {remainingEligible && remainingEligible > 0 ? (
                                  <span className="text-green-600">Preço assinante: R$ 0,00 (incluso) • Restam {remainingEligible}</span>
                                ) : (
                                  <span className="text-muted-foreground">Limite do plano atingido neste mês</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{combo.duration ?? '—'} min</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      Escolha a data *
                    </Label>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => setDate(d ?? undefined)}
                      disabled={(d) => {
                        // disable past dates (compare date-only using startOfDay to avoid timezone issues)
                        const dayStr = format(startOfDay(d), "yyyy-MM-dd");
                        const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
                        // allow selecting today (so only dates strictly before today blocked)
                        const isBeforeToday = dayStr < todayStr;
                        // window guard: only current and next month
                        const minStr = format(startOfDay(allowedStartDate), 'yyyy-MM-dd');
                        const maxStr = format(startOfDay(allowedEndDate), 'yyyy-MM-dd');
                        const outOfWindow = dayStr < minStr || dayStr > maxStr;
                        const totalBarbers = (barbers && barbers.length) || defaultBarbers.length;
                        const allBlocked = (blockedBarbersByDate[dayStr]?.size || 0) >= totalBarbers;
                        return isBeforeToday || outOfWindow || bookedDates.has(dayStr) || allBlocked;
                      }}
                      locale={ptBR}
                      fromMonth={allowedStartDate}
                      toMonth={nextMonthStart}
                      fromDate={allowedStartDate}
                      toDate={allowedEndDate}
                      className="rounded-md border border-border bg-background"
                    />
                  </div>

                  <div>
                    <Label className="mb-2">Horários disponíveis</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
                      {timeSlots.map((time) => {
                        // determine if time is booked or already passed
                        let disabled = bookedTimes.has(time);
                        if (date) {
                          // if selected date is today, disable past times
                          const todayStr = format(new Date(), "yyyy-MM-dd");
                          const selStr = format(date, "yyyy-MM-dd");
                          if (selStr === todayStr) {
                            const [hh, mm] = time.split(":");
                            const slot = new Date(startOfDay(date));
                            slot.setHours(Number(hh), Number(mm), 0, 0);
                            if (slot < new Date()) disabled = true;
                          }
                        }

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => !disabled && setFormData((p) => ({ ...p, time }))}
                            disabled={disabled}
                            aria-disabled={disabled}
                            className={`relative py-2 px-3 rounded-md text-center text-sm flex items-center justify-center ${formData.time === time ? 'bg-primary text-white' : disabled ? 'bg-background/40 text-muted-foreground pointer-events-none opacity-60' : 'bg-background border border-border'}`}>
                            <span>{time}</span>
                            {disabled && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute right-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.828 0 1.5.672 1.5 1.5V14h-3v-1.5C10.5 11.672 11.172 11 12 11zm6 3v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3" />
                                <rect x="6" y="9" width="12" height="6" rx="2" ry="2" stroke="none" fill="currentColor" opacity="0.15" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Clique em um horário para selecioná-lo. Horários ocupados não estão filtrados aqui.</div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <Label>Escolha barbeiro *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { slug: 'anderson', name: 'Anderson' },
                      { slug: 'pedro', name: 'Pedro' },
                      { slug: 'andre', name: 'Andre' },
                    ].map((b) => {
                      const barberRecord = barbers?.find((bb: any) => bb.slug === b.slug || bb.name?.toLowerCase() === b.name.toLowerCase());
                      const barberIdForCheck = String(barberRecord?.id ?? b.slug);
                      // a barber is unavailable if the selected time overlaps any existing booking for that barber
                      let disabled = false;
                      if (formData.time) {
                        const selStart = formData.time;
                        const selDur = getDurationForServiceId(formData.serviceId);
                        const dStr = date ? format(date, "yyyy-MM-dd") : null;
                        if (dStr) {
                          const todays = (bookings || []).filter((bk: any) => bk.booking_date === dStr && !(String(bk.status).toLowerCase().startsWith('cancel')) && String(bk.barber_id) === barberIdForCheck);
                          disabled = todays.some((bk: any) => {
                            const existStart = bk.booking_time;
                            const existDur = getDurationForServiceId(bk.service_id);
                            return timesOverlap(selStart, selDur, existStart, existDur);
                          });
                        }
                      }
                      // Blocked by admin for the selected date
                      if (date) {
                        const dStr = format(date, 'yyyy-MM-dd');
                        if (blockedBarbersByDate[dStr]?.has(barberIdForCheck)) disabled = true;
                      }

                      return (
                        <div
                          key={b.slug}
                          onClick={() => !disabled && setFormData((p) => ({ ...p, barberId: barberRecord?.id ?? b.slug }))}
                          role="button"
                          tabIndex={0}
                          aria-disabled={disabled}
                          className={`p-3 rounded-md border flex items-center gap-3 ${formData.barberId === (barberRecord?.id ?? b.slug) ? 'border-primary bg-primary/5' : disabled ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'border-border bg-background'}`}>
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            <span className="text-sm text-muted-foreground">Foto</span>
                          </div>
                          <div>
                            <div className="font-semibold">{b.name}</div>
                            <div className="text-sm text-muted-foreground">{disabled ? 'Indisponível' : 'Barbeiro'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 4 && (() => {
                const selectedService = services?.find(s => s.id === formData.serviceId) || combos?.find((c: any) => c.id === formData.serviceId);
                const selectedBarber = (barbers && barbers.find(b => b.id === formData.barberId)) || (formData.barberId && { name: String(formData.barberId) });
                const formattedDate = date ? format(date, "dd 'de' MMMM yyyy", { locale: ptBR }) : '—';
                const subscriberIncluded = !!(hasActivePlan && plan && isEligibleForPlan(plan.name, selectedService?.name) && remainingEligible != null && remainingEligible > 0);

                return (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resumo do agendamento</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="col-span-1">
                        <div className="rounded-lg overflow-hidden bg-gradient-to-br from-muted/20 to-transparent p-4 flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            {/* service image or placeholder */}
                            <img src={selectedService?.image_url ?? '/Barba.webp'} alt={selectedService?.name ?? 'Serviço'} className="object-cover w-full h-full" />
                          </div>
                          <div>
                            <div className="text-lg font-bold">{selectedService?.name ?? '—'}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedService && (
                                subscriberIncluded
                                  ? 'Preço assinante: R$ 0,00 (incluso no plano)'
                                  : 'Preço: R$ ' + (selectedService.price?.toFixed ? selectedService.price.toFixed(2) : String(selectedService.price || '—'))
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{selectedService?.duration ? `${selectedService.duration} min` : ''}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Data</div>
                              <div className="font-medium">{formattedDate}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Horário</div>
                              <div className="font-medium">{formData.time || '—'}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Barbeiro</div>
                              <div className="font-medium">{selectedBarber?.name ?? '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Cliente</div>
                              <div className="font-medium">{authedUser?.name || '—'}</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground">Telefone</div>
                            <div className="font-medium">{authedUser?.phone || '—'}</div>
                          </div>

                          <div>
                            <Label htmlFor="notes" className="text-xs text-muted-foreground">Observações</Label>
                            <Textarea
                              id="notes"
                              ref={(el) => (messageRef.current = el)}
                              value={formData.notes}
                              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                              placeholder="Alguma preferência ou observação?"
                              className="bg-background border-border mt-1"
                              rows={3}
                            />
                            {hasActivePlan && plan && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {subscriberIncluded
                                  ? `Este agendamento será incluído no seu plano (${plan.name}). Restantes neste mês: ${remainingEligible}`
                                  : 'Este serviço não está incluso no seu plano ou o limite mensal foi atingido.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                {currentStep > 1 && (
                  <Button variant="ghost" onClick={handleBack}>Voltar</Button>
                )}

                {currentStep < 4 && (
                  <Button className="btn-cta" onClick={handleNext}>Próximo</Button>
                )}

                {currentStep === 4 && (
                  <Button size="lg" className="w-48 btn-cta-filled" onClick={() => handleSubmit()}>
                    Confirmar Agendamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Agendamento;
