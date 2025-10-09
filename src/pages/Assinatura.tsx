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
    <div className="min-h-screen bg-background">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const Icon = getIcon(plan.name);
                const isPopular = plan.is_popular;
                
                return (
                  <Card
                    key={plan.id}
                    className={`bg-card border-border hover:border-primary transition-all hover:shadow-glow relative ${
                      isPopular ? "border-primary shadow-glow scale-105" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-primary text-black px-4 py-1 rounded-full text-sm font-bold">
                          Mais Popular
                        </span>
                      </div>
                    )}

                    <CardHeader className="text-center pb-6 pt-6">
                      <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                        <Icon className={`h-8 w-8 ${isPopular ? "text-primary" : "text-foreground"}`} />
                      </div>
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                      
                      <div className="space-y-1">
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

                    <CardContent className="space-y-6 pt-2 pb-6">
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

                      <Button
                        className={`w-full ${
                          isPopular
                            ? "bg-gradient-primary hover:opacity-90 text-black font-bold"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        size="lg"
                      >
                        Assinar Agora
                      </Button>
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
                <h3 className="text-xl font-bold">Economia garantida</h3>
                <p className="text-muted-foreground">
                  Economize até 30% nos serviços com nossos planos
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Prioridade no agendamento</h3>
                <p className="text-muted-foreground">
                  Acesso prioritário aos melhores horários
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Benefícios exclusivos</h3>
                <p className="text-muted-foreground">
                  Descontos em produtos e serviços especiais
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
