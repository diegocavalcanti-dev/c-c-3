import { Link } from "wouter";
import { Shield } from "lucide-react";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-14 h-14 md:w-24 md:h-24 ">
                <img
                  src="https://www.cenasdecombate.com/og-default.jpg"
                  alt="Logo Cenas de Combate"
                  className="w-full object-contain filter drop-shadow-[0_0px_1px_rgba(0,0,0,0.8)]"
                />
              </div>
              <span className="font-bold text-foreground">
                Cenas de Combate
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Entenda o mundo pelos bastidores dos combates. História militar,
              geopolítica e conflitos contados com profundidade.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              Categorias
            </h4>
            <ul className="space-y-1.5">
              {[
                { label: "Matérias", slug: "materias" },
                { label: "2ª Guerra Mundial", slug: "2-guerra-mundial" },
                { label: "Aviões", slug: "avioes" },
                { label: "Tecnologia Militar", slug: "tecnologia-militar" },
                { label: "Notícias", slug: "noticias" },
              ].map(item => (
                <li key={item.slug}>
                  <Link
                    href={`/categoria/${item.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              Site
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/busca"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Buscar Artigos
                </Link>
              </li>
              {/* <li>
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Painel Admin
                </Link>
              </li> */}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {year} Cenas de Combate. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
