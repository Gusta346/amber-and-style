import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Servicos = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const groupedServices = services?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  const { data: combos } = useQuery({
    queryKey: ["service_combos"],
    queryFn: async () => {
      // cast to any because supabase client types may not include custom tables
      const { data, error } = await (supabase as any).from("service_combos").select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
  <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Nossos <span className="text-gradient">Serviços</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Serviços premium executados por profissionais especializados
            </p>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupedServices ? (
            <div className="space-y-12">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {categoryServices.map((service) => (
                      <Card
                        key={service.id}
                        className="bg-card border-border hover:border-primary transition-all hover:shadow-glow group overflow-hidden"
                      >
                        <div className="md:flex md:items-stretch">
                          <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                            <img src="/Barba.webp" alt={service.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-6 md:w-2/3 flex flex-col justify-between">
                            <div>
                              <h3 className="text-xl font-bold mb-1 group-hover:text-gradient transition-colors">{service.name}</h3>
                              <p className="text-muted-foreground mb-4">{service.description}</p>

                              <div className="flex items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="text-muted-foreground">{service.duration} minutos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-primary" />
                                  <span className="text-2xl font-bold text-gradient">R$ {service.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                              <div className="mt-4 md:mt-0">
                                <Link to={`/agendamento?serviceId=${service.id}`} onClick={() => window.dispatchEvent(new Event('show-whatsapp-hint'))}>
                                  <Button className="btn-cta">Agendar</Button>
                                </Link>
                              </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
            </div>
          )}

          {/* Combos Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Combos Especiais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {combos?.length ? combos.map((combo: any) => (
                <div key={combo.id} className="bg-card border-border p-0 rounded-md overflow-hidden">
                  <div className="md:flex md:items-stretch">
                    <div className="md:w-1/3 h-44 md:h-auto overflow-hidden">
                      <img src="/Barba.webp" alt={combo.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 md:w-2/3 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{combo.name}</h3>
                        <p className="text-muted-foreground">{combo.description}</p>
                      </div>
                      <div className="text-right">
                        {combo.original_price && <div className="text-sm text-muted-foreground line-through">R$ {Number(combo.original_price).toFixed(2)}</div>}
                        <div className="text-2xl font-bold">R$ {Number(combo.price).toFixed(2)}</div>
                        <div className="mt-2">
                          <Link to={`/agendamento?serviceId=${combo.id}`} onClick={() => window.dispatchEvent(new Event('show-whatsapp-hint'))}>
                            <Button className="btn-cta">Agendar Combo</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-muted-foreground">Nenhum combo disponível no momento.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Servicos;
