import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, CheckCircle, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Avaliacoes = () => {
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

  // Calculate statistics
  const totalReviews = reviews?.length || 0;
  const averageRating = reviews?.reduce((acc, r) => acc + r.rating, 0) / totalReviews || 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    stars: rating,
    count: reviews?.filter(r => r.rating === rating).length || 0,
    percentage: totalReviews > 0 ? ((reviews?.filter(r => r.rating === rating).length || 0) / totalReviews) * 100 : 0
  }));

  return (
    <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-gradient">Avaliações</span> dos Clientes
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Veja o que nossos clientes dizem sobre nossos serviços
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Star className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-4xl font-bold text-gradient mb-1">
                  {averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-4xl font-bold text-gradient mb-1">
                  {totalReviews}
                </p>
                <p className="text-sm text-muted-foreground">Total de Avaliações</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-4xl font-bold text-gradient mb-1">
                  {reviews?.filter(r => r.verified).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Avaliações Verificadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution */}
          <div className="mb-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Distribuição das Notas</h2>
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
                        <div
                          className="h-full bg-gradient-primary transition-all"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {dist.count} ({dist.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">
              Depoimentos de <span className="text-gradient">Clientes</span>
            </h2>

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
                {reviews.map((review) => (
                  <Card
                    key={review.id}
                    className="bg-card border-border hover:border-primary transition-all hover:shadow-glow"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {review.verified && (
                          <div className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Verificado
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed">
                        "{review.comment}"
                      </p>

                      <div className="pt-3 border-t border-border">
                        <p className="font-semibold text-sm">{review.client_name}</p>
                        {review.service_type && (
                          <p className="text-xs text-muted-foreground">
                            {review.service_type}
                          </p>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Avaliacoes;
