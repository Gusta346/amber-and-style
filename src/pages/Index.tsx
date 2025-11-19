import { Link } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { ArrowRight, Star, Users, Award, Sparkles, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Inline Reviews block (extracted from Avaliacoes.tsx)
const ReviewsBlock = () => {
  // One query for all reviews (stats) and one for featured (homepage list)
  const { data: allReviews, isLoading: isLoadingAll } = useQuery({
    queryKey: ["reviews-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: reviews, isLoading } = useQuery<any[]>({
    queryKey: ["reviews-featured"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq('featured', true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const totalReviews = allReviews?.length || 0;
  const averageRating = allReviews?.reduce((acc: any, r: any) => acc + r.rating, 0) / totalReviews || 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    stars: rating,
    count: allReviews?.filter((r: any) => r.rating === rating).length || 0,
    percentage: totalReviews > 0 ? ((allReviews?.filter((r: any) => r.rating === rating).length || 0) / totalReviews) * 100 : 0,
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <Star className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-4xl font-bold text-gradient mb-1">{averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Avaliação Média</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-4xl font-bold text-gradient mb-1">{totalReviews}</p>
            <p className="text-sm text-muted-foreground">Total de Avaliações</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-4xl font-bold text-gradient mb-1">{(reviews?.length) || 0}</p>
            <p className="text-sm text-muted-foreground">Avaliações Verificadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-16 max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Distribuição das Notas</h3>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-3">
              {ratingDistribution.map((dist) => (
                <div key={dist.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{dist.stars}</span>
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary transition-all" style={{ width: `${dist.percentage}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">{dist.count} ({dist.percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto px-2 md:px-0">
        <h3 className="text-3xl font-bold mb-8 text-center">Depoimentos de <span className="text-gradient">Clientes</span></h3>

  {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
            {reviews.map((review: any) => (
              <Card key={review.id} className="bg-card border-border hover:border-primary transition-all hover:shadow-glow h-full">
                <CardContent className="p-5 sm:p-6 space-y-4 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    {review.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        Verificado
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">"{review.comment}"</p>

                  <div className="pt-3 border-t border-border">
                    <p className="font-semibold text-sm">{review.client_name}</p>
                    {review.service_type && (
                      <p className="text-xs text-muted-foreground">{review.service_type}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma avaliação disponível ainda.</p>
          </div>
        )}
      </div>
    </>
  );
};

// Simple public review submission form for the Home page
const ReviewFormBlock: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Load barbers for selection
  const { data: barbers } = useQuery<any[]>({
    queryKey: ['public-barbers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('id, name').order('name');
      if (error) throw error;
      return (data as any[]) || [];
    }
  });

  // Load services and combos for selection
  const { data: services } = useQuery<any[]>({
    queryKey: ['public-services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('id, name').order('name');
      if (error) throw error;
      return (data as any[]) || [];
    }
  });
  const { data: combos } = useQuery<any[]>({
    queryKey: ['public-combos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('service_combos').select('id, name').order('name');
      if (error) throw error;
      return (data as any[]) || [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: 'Informe seu nome', variant: 'destructive' }); return; }
    if (rating < 1 || rating > 5) { toast({ title: 'Selecione uma nota de 1 a 5', variant: 'destructive' }); return; }
    if (!comment.trim() || comment.trim().length < 5) { toast({ title: 'Escreva um comentário (mín. 5 caracteres)', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      const chosenBarber = (barbers || []).find(b => String(b.id) === String(barberId));
      const payload: any = {
        client_name: name.trim(),
        client_phone: phone.trim() || null,
        rating,
        comment: comment.trim(),
        service_type: (() => {
          if (serviceId) {
            const svc = (services || []).find(s => String(s.id) === String(serviceId)) || (combos || []).find((c: any) => String(c.id) === String(serviceId));
            return svc?.name || null;
          }
          return serviceType.trim() || null;
        })(),
        barber_name: chosenBarber?.name || null,
        featured: false,
      };
      let { error } = await (supabase as any).from('reviews').insert(payload).select();
      if (error) {
        // If DB hasn't applied barber_name column yet, retry without it
        if (String(error.message || '').toLowerCase().includes("barber_name")) {
          const { error: retryErr } = await (supabase as any).from('reviews').insert({
            client_name: payload.client_name,
            client_phone: payload.client_phone,
            rating: payload.rating,
            comment: payload.comment,
            service_type: payload.service_type,
            featured: false,
          }).select();
          if (retryErr) throw retryErr;
          // soft notify about pending migration
          toast({ title: 'Avaliação enviada (sem barbeiro)', description: 'A coluna do barbeiro ainda não está no banco. Assim que a migration rodar, o campo será salvo.', variant: 'default' });
        } else {
          throw error;
        }
      }

  setName(''); setPhone(''); setServiceType(''); setServiceId(''); setBarberId(''); setComment(''); setRating(0);
      // Update stats block
      await queryClient.invalidateQueries({ queryKey: ['reviews-all'] });
      toast({ title: 'Obrigado pela sua avaliação!', description: 'Ela passará por moderação e poderá aparecer na página inicial.' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar avaliação', description: err?.message || 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-4 text-center">Deixe sua avaliação</h3>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e)=> setName(e.target.value)} placeholder="Seu nome" required />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input id="phone" value={phone} onChange={(e)=> setPhone(e.target.value)} placeholder="(xx) xxxxx-xxxx" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="service">Serviço (opcional)</Label>
                <select id="service" value={serviceId} onChange={(e)=> setServiceId(e.target.value)} className="w-full rounded border border-border p-2 bg-background">
                  <option value="">Selecione um serviço</option>
                  {(services && services.length > 0) && (
                    <optgroup label="Serviços">
                      {services.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {(combos && combos.length > 0) && (
                    <optgroup label="Combos">
                      {combos.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="barber">Barbeiro (opcional)</Label>
                <select id="barber" value={barberId} onChange={(e)=> setBarberId(e.target.value)} className="w-full rounded border border-border p-2 bg-background">
                  <option value="">Selecione um barbeiro</option>
                  {(barbers || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nota</Label>
                <div className="flex items-center gap-2 pt-2">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="p-1"
                      onClick={()=> setRating(n)}
                      aria-label={`Dar nota ${n}`}
                    >
                      <Star className={`h-6 w-6 ${n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Comentário</Label>
              <Textarea id="comment" value={comment} onChange={(e)=> setComment(e.target.value)} placeholder="Conte como foi sua experiência" rows={4} required />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="btn-cta" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar avaliação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-barbershop.jpg";
import productsImage from "@/assets/products-luxury.jpg";
import barberProImage from "@/assets/barber-professional.jpg";
import kids1 from "@/assets/ai/kids-1.svg";
import kids2 from "@/assets/ai/kids-2.svg";
import kids3 from "@/assets/ai/kids-3.svg";
import prodPomade from "@/assets/ai/products-pomade.svg";
import prodShampoo from "@/assets/ai/products-shampoo.svg";
import prodKit from "@/assets/ai/products-kit.svg";
import prodBeardOil from "@/assets/ai/products-beard-oil.svg";
import coursePro from "@/assets/ai/course-pro.svg";
import courseWorkshop from "@/assets/ai/course-workshop.svg";
import courseMentorship from "@/assets/ai/course-mentorship.svg";

const Index = () => {
  // Carousel detail sources
  const kidsDetails = [
    {
      title: 'Corte Kids com atendimento especial',
      desc: 'Conforto, paciência e acabamento perfeito para os pequenos',
      image: kids1,
    },
    {
      title: 'Combo Corte + Penteado',
      desc: 'Saia com estilo para a festa! Penteados divertidos inclusos',
      image: kids2,
    },
    {
      title: 'Espaço Kids preparado',
      desc: 'Ambiente amigável para a primeira experiência no salão',
      image: kids3,
    },
  ];

  const productsDetails = [
    {
      title: 'Pomadas e finalizadores premium',
      desc: 'Textura, brilho e fixação sob medida para seu estilo',
      image: prodPomade,
    },
    {
      title: 'Shampoos e cuidados diários',
      desc: 'Limpeza e tratamento para manter os fios saudáveis',
      image: prodShampoo,
    },
    {
      title: 'Kits presente',
      desc: 'Seleções especiais para surpreender com bom gosto',
      image: prodKit,
    },
    {
      title: 'Óleos para barba',
      desc: 'Hidratação e maciez com fragrâncias exclusivas',
      image: prodBeardOil,
    },
  ];

  const coursesDetails = [
    {
      title: 'Curso Profissional Completo',
      desc: 'Da base ao avançado com acompanhamento dos especialistas',
      image: coursePro,
    },
    {
      title: 'Workshop de Tendências',
      desc: 'Atualize seu portfólio com técnicas do momento',
      image: courseWorkshop,
    },
    {
      title: 'Mentoria Individual',
      desc: 'Acelere sua carreira com feedback 1:1',
      image: courseMentorship,
    },
  ];

  // Carousel selection state to show detail panels
  const [kidsApi, setKidsApi] = useState<any>(null);
  const [kidsIndex, setKidsIndex] = useState(0);
  const [productsApi, setProductsApi] = useState<any>(null);
  const [productsIndex, setProductsIndex] = useState(0);
  const [coursesApi, setCoursesApi] = useState<any>(null);
  const [coursesIndex, setCoursesIndex] = useState(0);

  useEffect(() => {
    if (!kidsApi) return;
    const onSelect = () => setKidsIndex(kidsApi.selectedScrollSnap());
    onSelect();
    kidsApi.on('select', onSelect);
    return () => kidsApi.off('select', onSelect);
  }, [kidsApi]);

  useEffect(() => {
    if (!productsApi) return;
    const onSelect = () => setProductsIndex(productsApi.selectedScrollSnap());
    onSelect();
    productsApi.on('select', onSelect);
    return () => productsApi.off('select', onSelect);
  }, [productsApi]);

  useEffect(() => {
    if (!coursesApi) return;
    const onSelect = () => setCoursesIndex(coursesApi.selectedScrollSnap());
    onSelect();
    coursesApi.on('select', onSelect);
    return () => coursesApi.off('select', onSelect);
  }, [coursesApi]);
  const stats = [
    { icon: Users, value: "10,000+", label: "Clientes Satisfeitos" },
    { icon: Star, value: "4.9/5", label: "Avaliação Média" },
    { icon: Award, value: "15+", label: "Anos de Experiência" },
  ];

  const highlights = [
    {
      title: "Serviços Premium",
      description: "Cortes modernos e tradicionais executados com perfeição",
      link: "/servicos",
    },
    {
      title: "Produtos Exclusivos",
      description: "As melhores marcas do mercado para cuidados masculinos",
      link: "/produtos",
    },
    {
      title: "Curso Profissional",
      description: "Torne-se um barbeiro profissional com nossos especialistas",
      link: "/cursos",
    },
    {
      title: "Planos VIP",
      description: "Assinaturas com benefícios exclusivos e prioridade",
      link: "/assinatura",
    },
  ];

  // Services list (static for now; can be fetched from the database)
  const servicesList = [
    { key: "corte", name: "Corte", description: "Corte masculino com máquina e tesoura", price: 40.0, duration: 45 },
    { key: "barba", name: "Barba", description: "Design e aparo de barba", price: 40.0, duration: 30 },
    { key: "sobrancelha", name: "Sobrancelha", description: "Design de sobrancelha e acabamento", price: 5.0, duration: 20 },
    { key: "limpeza", name: "Limpeza de Pele", description: "Limpeza facial rápida para manter a pele saudável", price: 50.0, duration: 40 },
  ];

  const combos = [
    { key: "corte-barba", name: "Corte + Barba", description: "Combo com corte e barba com desconto especial", price: 70.0, originalPrice: 80.0, duration: 75 },
  ];

  return (
  <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />

      {/* Hero Section */}
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 md:pt-32">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Anderson Cortes Barbershop"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              
              <span className="text-sm font-medium text-foreground"></span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-snug">
              <span className="text-gradient glow-text">Anderson Cortes</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              O seu novo visual começa no nosso espelho
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/agendamento" onClick={() => window.dispatchEvent(new Event('show-whatsapp-hint'))}>
                <Button
                  size="lg"
                  className="btn-cta font-bold text-lg px-8 py-6 hover-glow"
                >
                  Agendar Horário
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/servicos">
                <Button
                  size="lg"
                  variant="outline"
                  className="btn-cta text-lg px-8 py-6"
                >
                  Ver Serviços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Carrosséis por seção */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          {/* Dia das Crianças */}
          <div className="mb-14">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-3xl md:text-4xl font-bold">Dia das <span className="text-gradient">Crianças</span> 👶✂️</h2>
              <Link to="/agendamento" onClick={() => window.dispatchEvent(new Event('show-whatsapp-hint'))}>
                <Button variant="outline" className="hidden sm:inline-flex">Agendar agora</Button>
              </Link>
            </div>
            <Carousel opts={{ align: "start", loop: true }} setApi={setKidsApi} className="relative overflow-hidden">
              <CarouselContent>
                {kidsDetails.map((item, i) => (
                  <CarouselItem key={i} className="basis-[88%] sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/3">
                    <Card className="group overflow-hidden border-border hover:border-primary hover:shadow-glow transition-all h-full relative">
                      <div className="h-56 md:h-64 bg-muted/40 relative overflow-hidden">
                        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <CardContent className="p-6 pb-24 flex flex-col gap-5">
                        <h3 className="text-lg font-bold leading-snug group-hover:text-gradient transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        <div className="absolute left-6 bottom-6">
                          <Link to="/contato">
                            <Button size="sm" variant="outline">Contato</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex left-2" />
              <CarouselNext className="hidden sm:flex right-2" />
            </Carousel>
            <div className="mt-4">
              <div key={kidsIndex} className="p-4 rounded-md border border-border bg-muted/30 animate-fade-in">
                <p className="text-sm text-muted-foreground"><span className="font-medium">{kidsDetails[kidsIndex]?.title}</span> — {kidsDetails[kidsIndex]?.desc}</p>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="mb-14">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-3xl md:text-4xl font-bold">Linha de <span className="text-gradient">Produtos</span></h2>
              <Link to="/produtos">
                <Button variant="outline" className="hidden sm:inline-flex">Ver todos</Button>
              </Link>
            </div>
            <Carousel opts={{ align: "start", loop: true }} setApi={setProductsApi} className="relative overflow-hidden">
              <CarouselContent>
                {productsDetails.map((item, i) => (
                  <CarouselItem key={i} className="basis-[88%] sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/3">
                    <Card className="group overflow-hidden border-border hover:border-primary hover:shadow-glow transition-all h-full relative">
                      <div className="h-56 md:h-64 bg-muted/40 relative overflow-hidden">
                        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                      </div>
                      <CardContent className="p-6 pb-24 flex flex-col gap-5">
                        <h3 className="text-lg font-bold leading-snug group-hover:text-gradient transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        <div className="absolute left-6 bottom-6">
                          <Link to="/produtos">
                            <Button size="sm" variant="outline">Explorar</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex left-2" />
              <CarouselNext className="hidden sm:flex right-2" />
            </Carousel>
            <div className="mt-4">
              <div key={productsIndex} className="p-4 rounded-md border border-border bg-muted/30 animate-fade-in">
                <p className="text-sm text-muted-foreground"><span className="font-medium">{productsDetails[productsIndex]?.title}</span> — {productsDetails[productsIndex]?.desc}</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/produtos">
                <Button className="btn-cta">Ver todos os produtos</Button>
              </Link>
            </div>
          </div>

          {/* Curso */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-3xl md:text-4xl font-bold">Formação <span className="text-gradient">Profissional</span></h2>
              <Link to="/cursos">
                <Button variant="outline" className="hidden sm:inline-flex">Ver cursos</Button>
              </Link>
            </div>
            <Carousel opts={{ align: "start", loop: true }} setApi={setCoursesApi} className="relative overflow-hidden">
              <CarouselContent>
                {coursesDetails.map((item, i) => (
                  <CarouselItem key={i} className="basis-[88%] sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/3 2xl:basis-1/3">
                    <Card className="group overflow-hidden border-border hover:border-primary hover:shadow-glow transition-all h-full relative">
                      <div className="h-56 md:h-64 bg-muted/40 relative overflow-hidden">
                        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                      </div>
                      <CardContent className="p-6 pb-24 flex flex-col gap-5">
                        <h3 className="text-lg font-bold leading-snug group-hover:text-gradient transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        <div className="absolute left-6 bottom-6">
                          <Link to="/cursos">
                            <Button size="sm" variant="outline">Inscrever-se</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex left-2" />
              <CarouselNext className="hidden sm:flex right-2" />
            </Carousel>
            <div className="mt-4">
              <div key={coursesIndex} className="p-4 rounded-md border border-border bg-muted/30 animate-fade-in">
                <p className="text-sm text-muted-foreground"><span className="font-medium">{coursesDetails[coursesIndex]?.title}</span> — {coursesDetails[coursesIndex]?.desc}</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/cursos">
                <Button className="btn-cta">Saiba mais</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços e Combos foram movidos para a página /servicos */}

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-amber-glow opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <Card className="bg-card border-primary/50 shadow-glow">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para a Melhor Experiência?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Agende seu horário com um de nossos profissionais e transforme seu visual hoje mesmo!
              </p>
              <Link to="/agendamento" onClick={() => window.dispatchEvent(new Event('show-whatsapp-hint'))}>
                <Button
                  size="lg"
                  className="btn-cta font-bold text-lg px-8 py-6"
                >
                  Agendar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avaliações Section (moved from /avaliacoes) */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Avaliações de <span className="text-gradient">Clientes</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Veja o que nossos clientes dizem sobre nossos serviços</p>
          </div>

          {/* Reviews & stats */}
          <ReviewsBlock />

          {/* Public review submission */}
          <ReviewFormBlock />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
