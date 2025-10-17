import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Assinatura = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const getIcon = (planName: string) => {
    if (planName.toLowerCase().includes("vip") || planName.toLowerCase().includes("black")) {
      return Crown;
    }
    if (planName.toLowerCase().includes("premium")) {
      return Star;
    }
    return Check;
  };

  return (
  <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />

      <main className="pt-32 pb-20">
  <div className="container mx-auto px-6 md:px-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Planos de <span className="text-gradient">Assinatura</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Economize com nossos planos mensais e tenha acesso a benefícios exclusivos
            </p>
            <div className="mt-6 max-w-2xl mx-auto border border-primary/30 bg-primary/5 text-foreground/80 rounded-md px-4 py-3">
              <p className="text-sm md:text-base text-center">
                As assinaturas são realizadas somente na barbearia (não pelo site).
              </p>
            </div>
          </div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-12 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const Icon = getIcon(plan.name);
                const isPopular = plan.is_popular;
                
                return (
                  <Card
                    key={plan.id}
                    className={`bg-card border-border hover:border-primary transition-all hover:shadow-glow relative ${
                      isPopular ? "border-primary shadow-glow lg:scale-105" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-xs sm:text-sm font-bold">
                          Mais Popular
                        </span>
                      </div>
                    )}

                    <CardHeader className="text-center pb-8 pt-10">
                      <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                        <Icon className={`h-8 w-8 ${isPopular ? "text-primary" : "text-foreground"}`} />
                      </div>
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-sm mb-6 leading-relaxed">{plan.description}</CardDescription>
                      
                      <div className="space-y-2">
                        <p className="text-5xl font-bold text-gradient">
                          R$ {plan.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          por {plan.billing_period === "monthly" ? "mês" : "ano"}
                        </p>
                        {plan.discount_percentage > 0 && (
                          <p className="text-sm text-green-500">
                            Economize {plan.discount_percentage}%
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-2 pb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.max_services && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-center text-sm">
                            <span className="font-bold text-primary">{plan.max_services}</span>
                            <span className="text-muted-foreground"> serviços por mês</span>
                          </p>
                        </div>
                      )}

                      <div className="pt-2">
                        <p className="text-center text-xs text-muted-foreground mb-2">Assinatura apenas presencial</p>
                        <Button className="w-full" size="lg" variant="outline" disabled>
                          Assinar na barbearia
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
            </div>
          )}

          {/* Benefits Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold mb-12">
              Por que assinar nossos <span className="text-gradient">planos?</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Mais serviços por mês</h3>
                <p className="text-muted-foreground">
                  Use seus 4 serviços mensais e ainda ganhe 2 extras no plano
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Prioridade no agendamento</h3>
                <p className="text-muted-foreground">
                  Acesso preferencial aos melhores horários na agenda
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Preço fechado e economia</h3>
                <p className="text-muted-foreground">
                  Pague um valor fixo mensal e economize no pacote
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Assinatura;
