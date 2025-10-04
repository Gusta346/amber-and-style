import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Barbearia Premium em São Paulo</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-gradient glow-text">Anderson Cortes</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Mais que um corte, uma experiência premium de grooming masculino
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/agendamento">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 text-black font-bold text-lg px-8 py-6 hover-glow"
                >
                  Agendar Horário
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/servicos">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6"
                >
                  Ver Serviços
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-colors">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="text-3xl font-bold text-gradient mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
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
                  className="bg-gradient-primary hover:opacity-90 text-black font-bold text-lg px-8 py-6"
                >
                  Agendar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
