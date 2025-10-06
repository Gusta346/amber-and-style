import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Award, Sparkles, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Inline Reviews block (extracted from Avaliacoes.tsx)
const ReviewsBlock = () => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalReviews = reviews?.length || 0;
  const averageRating = reviews?.reduce((acc: any, r: any) => acc + r.rating, 0) / totalReviews || 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    stars: rating,
    count: reviews?.filter((r: any) => r.rating === rating).length || 0,
    percentage: totalReviews > 0 ? ((reviews?.filter((r: any) => r.rating === rating).length || 0) / totalReviews) * 100 : 0,
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
            <p className="text-4xl font-bold text-gradient mb-1">{reviews?.filter((r: any) => r.verified).length || 0}</p>
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

      <div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review: any) => (
              <Card key={review.id} className="bg-card border-border hover:border-primary transition-all hover:shadow-glow">
                <CardContent className="p-6 space-y-4">
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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-barbershop.jpg";

const Index = () => {
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
    { key: "corte", name: "Corte", description: "Corte masculino com máquina e tesoura", price: 60.0, duration: 45 },
    { key: "barba", name: "Barba", description: "Design e aparo de barba", price: 40.0, duration: 30 },
    { key: "sobrancelha", name: "Sobrancelha", description: "Design de sobrancelha e acabamento", price: 30.0, duration: 20 },
    { key: "limpeza", name: "Limpeza de Pele", description: "Limpeza facial rápida para manter a pele saudável", price: 50.0, duration: 40 },
  ];

  const combos = [
    { key: "corte-barba", name: "Corte + Barba", description: "Combo com corte e barba com desconto especial", price: 85.0, originalPrice: 100.0, duration: 75 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-gradient glow-text">Anderson Cortes</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              O seu novo visual começa no nosso espelho
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/agendamento">
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

      {/* Services Highlight */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Nossos <span className="text-gradient">Serviços</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Do corte clássico aos tratamentos exclusivos, oferecemos tudo para o homem moderno
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, index) => (
              <Link key={index} to={highlight.link}>
                <Card className="bg-card border-border hover:border-primary transition-all hover:shadow-glow group h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-gradient transition-colors">
                      {highlight.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{highlight.description}</p>
                    <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                      <span className="text-sm font-medium">Saiba mais</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
                Agende seu horário agora e descubra por que somos a barbearia premium mais procurada
              </p>
              <Link to="/agendamento">
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
