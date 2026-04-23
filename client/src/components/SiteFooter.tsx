import { Link } from "wouter";
import {
  Facebook,
  Instagram,
  Youtube,
  Info,
  MessageSquare,
  Shield,
  FileText,
} from "lucide-react";

const categories = [
  { label: "Matérias", slug: "materias" },
  { label: "1ª Guerra Mundial", slug: "1a-guerra-mundial" },
  { label: "2ª Guerra Mundial", slug: "2a-guerra-mundial" },
  { label: "Aviões", slug: "avioes" },
  { label: "Tecnologia Militar", slug: "tecnologia-militar" },
  { label: "Notícias", slug: "noticias" },
];

const institutionalLinks = [
  { label: "Sobre", href: "/sobre", icon: Info },
  { label: "Contato", href: "/contato", icon: MessageSquare },
  { label: "Buscar artigos", href: "/busca", icon: MessageSquare },
];

const legalLinks = [
  {
    label: "Política de Privacidade",
    href: "/politica-de-privacidade",
    icon: Shield,
  },
  {
    label: "Termos de Uso",
    href: "/termos-de-uso",
    icon: FileText,
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-[#0b0b0c] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_90%)]" />
      <div className="absolute top-0 right-0 h-full w-1/3 translate-x-20 -skew-x-12 bg-primary/2" />

      <div className="relative z-10 h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

      <div className="container relative z-10 py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/2 p-2 ring-1 ring-white/2 md:h-20 md:w-20">
                <img
                  src="https://www.cenasdecombate.com/og-default.jpg"
                  alt="Logo Cenas de Combate"
                  className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
                />
              </div>

              <div>
                <div className="text-2xl font-extrabold tracking-tight text-white">
                  Cenas de Combate
                </div>
                <div className="mt-1 text-xs text-orange-400">
                  História militar, geopolítica e conflitos
                </div>
              </div>
            </Link>

            <p className="mt-6 max-w-xl text-sm leading-7 align-bottom text-zinc-300">
              Entenda o mundo pelos bastidores dos combates. História militar, geopolítica e conflitos contados com profundidade.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://facebook.com/cenas.decombate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors hover:bg-primary hover:text-white"
                aria-label="Facebook do Cenas de Combate"
              >
                <Facebook className="h-6 w-6" />
              </a>

              <a
                href="https://instagram.com/cenas.decombate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors hover:bg-primary hover:text-white"
                aria-label="Instagram do Cenas de Combate"
              >
                <Instagram className="h-6 w-6" />
              </a>

              <a
                href="https://youtube.com/@cenasdeCombate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors hover:bg-primary hover:text-white"
                aria-label="YouTube do Cenas de Combate"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
              Categorias
            </h4>

            <ul className="space-y-3">
              {categories.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/categoria/${item.slug}`}
                    className="text-sm text-zinc-300 transition-colors hover:text-orange-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
              Institucional
            </h4>

            <ul className="space-y-3">
              {institutionalLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-orange-400"
                    >
                      <Icon className="h-4 w-4 opacity-80" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
              Legal
            </h4>

            <ul className="space-y-3">
              {legalLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-orange-400"
                    >
                      <Icon className="h-4 w-4 opacity-80" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>


          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-zinc-500">
              © {year} Cenas de Combate. Todos os direitos reservados.
            </p>

            <p className="text-sm text-zinc-600">cenasdecombate.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
}