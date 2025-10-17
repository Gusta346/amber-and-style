import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import productsPlaceholder from "@/assets/products-luxury.jpg";

const Produtos = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Static products requested (no online sales). Using placeholder image when none provided.
  const staticProducts = [
    { id: 'local-pt', name: 'Pomada teia', price: 25.00, category: 'Cuidados', brand: '—', description: 'Modelagem com efeito teia', image_url: productsPlaceholder },
    { id: 'local-pm', name: 'Pomada matte', price: 27.00, category: 'Cuidados', brand: '—', description: 'Acabamento seco e natural', image_url: productsPlaceholder },
    { id: 'local-p3', name: 'Pomada 3 em 1', price: 25.00, category: 'Cuidados', brand: '—', description: 'Versátil para diferentes estilos', image_url: productsPlaceholder },
    { id: 'local-minox', name: 'Minoxidil', price: 130.00, category: 'Cuidados', brand: '—', description: 'Auxilia no crescimento', image_url: productsPlaceholder },
    { id: 'local-kit-cuid', name: 'Kit cuidados', price: 115.00, category: 'Kits', brand: '—', description: 'Seleção para rotina diária', image_url: productsPlaceholder },
    { id: 'local-kit-macia', name: 'Kit barba macia', price: 100.00, category: 'Kits', brand: '—', description: 'Conforto e maciez para a barba', image_url: productsPlaceholder },
    { id: 'local-kit-cresc', name: 'Kit crescimento', price: 115.00, category: 'Kits', brand: '—', description: 'Foco em crescimento saudável', image_url: productsPlaceholder },
    { id: 'local-shampoo', name: 'Shampoo', price: 33.00, category: 'Cuidados', brand: '—', description: 'Limpeza diária', image_url: productsPlaceholder },
    { id: 'local-cond', name: 'Condicionador', price: 33.00, category: 'Cuidados', brand: '—', description: 'Hidratação e maciez', image_url: productsPlaceholder },
    { id: 'local-po', name: 'Pomada em pó', price: 25.00, category: 'Cuidados', brand: '—', description: 'Volume instantâneo', image_url: productsPlaceholder },
    { id: 'local-oleo', name: 'Óleo para barba', price: 27.00, category: 'Cuidados', brand: '—', description: 'Nutrição e brilho', image_url: productsPlaceholder },
    // Bebidas
    { id: 'local-heine-9', name: 'Heineken', price: 9.00, category: 'Bebidas', brand: '—', description: 'Long neck', image_url: productsPlaceholder },
    { id: 'local-corona-9', name: 'Corona', price: 9.00, category: 'Bebidas', brand: '—', description: 'Long neck', image_url: productsPlaceholder },
    { id: 'local-coca-lata', name: 'Coca (lata)', price: 4.50, category: 'Bebidas', brand: '—', description: '350 ml', image_url: productsPlaceholder },
    { id: 'local-guara-lata', name: 'Guaraná (lata)', price: 4.50, category: 'Bebidas', brand: '—', description: '350 ml', image_url: productsPlaceholder },
    { id: 'local-guaravita', name: 'Guaravita', price: 5.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-tubaina', name: 'Tubaína', price: 5.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-agua', name: 'Água', price: 2.50, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-skol', name: 'Skol', price: 4.00, category: 'Bebidas', brand: '—', description: 'Lata', image_url: productsPlaceholder },
    { id: 'local-original', name: 'Original', price: 5.00, category: 'Bebidas', brand: '—', description: 'Lata', image_url: productsPlaceholder },
    { id: 'local-heine-lata', name: 'Heineken (lata)', price: 5.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-amistel', name: 'Amistel', price: 5.00, category: 'Bebidas', brand: '—', description: 'Lata', image_url: productsPlaceholder },
    { id: 'local-garotorade', name: 'Garotorade', price: 6.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-coca-2l', name: 'Coca 2 litros', price: 13.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-guarana-2l', name: 'Guaraná 2 litros', price: 11.00, category: 'Bebidas', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-trufa', name: 'Trufa', price: 4.00, category: 'Snacks', brand: '—', description: '', image_url: productsPlaceholder },
    { id: 'local-fofura', name: 'Fofura', price: 4.00, category: 'Snacks', brand: '—', description: '', image_url: productsPlaceholder },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Merge remote + static. Remote first (if any), then static items not duplicating by name.
  const merged = (() => {
    const remote = (products || []) as any[];
    const names = new Set(remote.map((p) => String(p.name).toLowerCase()));
    const add = staticProducts.filter((s) => !names.has(String(s.name).toLowerCase()));
    return [...remote, ...add];
  })();

  const categories = ["Todos", ...Array.from(new Set(merged.map(p => p.category).filter(Boolean)))];

  const filteredProducts = selectedCategory === "Todos"
    ? merged
    : merged.filter(p => p.category === selectedCategory);

  return (
  <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-gradient">Produtos Premium</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              As melhores marcas para cuidados masculinos
            </p>
          </div>

          {/* Category Filter with explicit contrast */}
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-8 md:mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={
                  "min-w-[96px] px-3 py-1.5 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 " +
                  (selectedCategory === category
                    ? "bg-gradient-primary text-white font-semibold shadow-sm ring-1 ring-primary/30 hover:opacity-95"
                    : "bg-background text-foreground border border-border hover:border-primary hover:bg-muted/40")
                }
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Informational banner: in-person purchase only */}
          <div className="max-w-3xl mx-auto mb-6 p-3 rounded-md border border-primary/30 bg-primary/5 text-sm text-foreground/80 text-center">
            As vendas são realizadas somente na barbearia (não vendemos pelo site).
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader>
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-card border-border hover:border-primary transition-all hover:shadow-glow group"
                >
                  <CardHeader>
                    <div className="w-full bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden h-40 sm:h-48">
                      <img
                        src={
                          product.image_url || productsPlaceholder
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <CardTitle className="text-lg md:text-xl group-hover:text-gradient transition-colors">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {product.brand}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    {/* Ratings removed as requested */}

                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-gradient">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Venda apenas presencial</span>
                    </div>

                    <Button className="w-full" size="sm" variant="outline" disabled>
                      Disponível na barbearia
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum produto disponível nesta categoria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Produtos;
