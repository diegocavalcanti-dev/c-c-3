import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, Menu, X, Moon, Sun, Info, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";

const quickLinks = [
  { label: "Sobre", href: "/sobre", icon: Info },
  { label: "Contato", href: "/contato", icon: MessageSquare },
  { label: "Buscar", href: "/busca", icon: Search },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: categories } = trpc.categories.list.useQuery();

  const mainCategories = useMemo(() => categories?.slice(0, 7) ?? [], [categories]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    navigate(`/busca?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(`${href}/`);
  };

  const getCategoryMenuLabel = (cat: any) => {
    if (cat.slug === "tecnologia-militar") return "Tecnologia";
    return cat.name;
  };

  const navItemClass = (active: boolean) =>
    [
      "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors",
      active
        ? "bg-primary/15 text-orange-400 ring-1 ring-orange-500/20"
        : "text-zinc-300 hover:bg-white/5 hover:text-orange-400",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 overflow-hidden border-b border-white/10 bg-[#0b0b0c]/95 text-white backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_90%)]" />
      <div className="absolute top-0 right-0 h-full w-1/3 translate-x-20 -skew-x-12 bg-primary/5" />

      <div className="relative z-10 h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

      <div className="relative z-10 border-b border-white/10">
        <div className="container flex items-center justify-between py-2">
          <span className="text-[7px] md:text-[8px] uppercase tracking-[0.22em] text-zinc-300">
            Entenda o mundo pelos bastidores dos combates
          </span>

          <div className="hidden items-center gap-4 md:flex">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-orange-400"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container relative z-10">
        <div className="flex items-center gap-4 py-1 md:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-1">
            <div className="h-12 w-12 rounded-2xl p-2  md:h-14 md:w-14">
              <img
                src="https://www.cenasdecombate.com/og-default.jpg"
                alt="Logo Cenas de Combate"
                className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
              />
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold tracking-tight text-white md:text-xl">
                Cenas de Combate
              </div>
              <div className="hidden text-[10px] leading-tight text-orange-400 sm:block">
                História militar, geopolítica e conflitos
              </div>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center md:flex">
            <nav className="flex min-w-0 flex-1 items-center gap-1">
              <Link href="/" className={navItemClass(isActive("/"))}>
                Início
              </Link>

              {mainCategories.map((cat: any) => (
                <Link
                  key={cat.id ?? cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className={navItemClass(isActive(`/categoria/${cat.slug}`))}
                >
                  {getCategoryMenuLabel(cat)}
                </Link>
              ))}

              <Link href="/busca" className={navItemClass(isActive("/busca"))}>
                <Search className="mr-2 h-3.5 w-3.5" />
                Buscar
              </Link>
            </nav>

            <div className="ml-2 flex shrink-0 items-center gap-2">
              {toggleTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full text-zinc-300 hover:bg-white/5 hover:text-white"
                  title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            {toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full text-zinc-300 hover:bg-white/5 hover:text-white"
                title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="relative z-10 border-t border-white/10 bg-[#0b0b0c]/98 md:hidden">
          <div className="container space-y-4 py-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos..."
                  className="h-11 rounded-full border-white/10 bg-white/5 pl-11 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-primary/40"
                />
              </div>
            </form>

            <div className="space-y-1">
              <Link href="/" className={navItemClass(isActive("/"))}>
                Início
              </Link>

              {categories?.map((cat: any) => (
                <Link
                  key={cat.id ?? cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className={navItemClass(isActive(`/categoria/${cat.slug}`))}
                >
                  {cat.name}
                </Link>
              ))}

              <Link href="/busca" className={navItemClass(isActive("/busca"))}>
                Buscar
              </Link>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="grid grid-cols-1 gap-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-orange-400"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}