import { GraduationCap, Users, Clock, Award, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Cursos = () => {
  const modules = [
    { title: "Fundamentos da Barbearia", duration: "40h", topics: ["História", "Higiene", "Ferramentas"] },
    { title: "Técnicas de Corte", duration: "60h", topics: ["Tesoura", "Máquina", "Navalha"] },
    { title: "Barba e Bigode", duration: "30h", topics: ["Desenho", "Finalização", "Produtos"] },
    { title: "Colorimetria", duration: "20h", topics: ["Teoria das Cores", "Aplicação", "Correção"] },
    { title: "Gestão e Empreendedorismo", duration: "30h", topics: ["Marketing", "Financeiro", "Atendimento"] },
  ];

  const benefits = [
    "Certificado reconhecido",
    "Material didático incluso",
    "Aulas práticas com modelos",
    "Kit profissional completo",
    "Acompanhamento pós-curso",
    "Networking com profissionais",
  ];

  return (
    <div className="min-h-screen bg-background leading-comfortable">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Formação Profissional</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Curso Profissional de <span className="text-gradient">Barbeiro</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Torne-se um barbeiro profissional com os melhores instrutores do mercado
            </p>
          </div>

          {/* Course Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <Card className="bg-card border-border hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">180 horas</h3>
                <p className="text-muted-foreground">Duração total do curso</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Até 8 alunos</h3>
                <p className="text-muted-foreground">Por turma para melhor aprendizado</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Certificado</h3>
                <p className="text-muted-foreground">Reconhecido internacionalmente</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-center">
              Módulos do <span className="text-gradient">Curso</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, index) => (
                <Card key={index} className="bg-card border-border hover:border-primary transition-all hover:shadow-glow group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl font-bold text-gradient">0{index + 1}</span>
                      <span className="text-sm text-primary">{module.duration}</span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-gradient transition-colors">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {module.topics.map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-center">
              O que está <span className="text-gradient">incluído</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-card border-primary/50 shadow-glow">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Invista na sua carreira
              </h2>
              <p className="text-muted-foreground text-lg mb-4">
                Investimento: <span className="text-3xl font-bold text-gradient">R$&nbsp;1.999,00</span>
              </p>
              <p className="text-muted-foreground mb-8">
                ou 12x de <span className="whitespace-nowrap">R$&nbsp;499,00</span> no cartão
              </p>
              <Link to={`/contato?message=${encodeURIComponent("Olá, gostaria de me inscrever no Curso Profissional de Barbeiro. Poderiam, por favor, me informar sobre próximas turmas, formas de pagamento e lista de materiais necessários? Obrigado!")}&subject=${encodeURIComponent("Curso - Inscrição")}#message`}>
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white font-bold text-lg px-8 py-6">
                  Inscrever-se Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cursos;
