import { Link } from "react-router-dom";
import { Scissors, Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold text-gradient">Anderson Cortes</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Barbearia premium com os melhores profissionais. Excelência em cada corte.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-black rounded-lg transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-muted hover:bg-primary hover:text-black rounded-lg transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/servicos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Serviços
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/cursos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Cursos
                </Link>
              </li>
              <li>
                <Link to="/assinatura" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Planos de Assinatura
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>(11) 98765-4321</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contato@andersoncortes.com.br</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Av. Paulista, 1000 - São Paulo, SP</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-foreground">Horário de Funcionamento</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Segunda - Sexta:</span>
                <span className="text-primary">9h - 20h</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado:</span>
                <span className="text-primary">9h - 18h</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo:</span>
                <span className="text-primary">10h - 16h</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Anderson Cortes. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
