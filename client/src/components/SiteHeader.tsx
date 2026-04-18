import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, Menu, X, Shield, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: categories } = trpc.categories.list.useQuery();

  const mainCategories = categories?.slice(0, 7) ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">
            Entenda o mundo pelos bastidores dos combates
          </span>
          {/* <Link href="/admin" className="text-xs text-primary hover:text-primary/80 transition-colors">
            Painel Admin
          </Link> */}
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Theme toggle */}
          {toggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={
                theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* <div className="w-9 h-9 rounded bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div> */}
            <div className="">
              <div className="font-bold text-lg leading-tight text-foreground">
                Cenas de Combate
              </div>
              <div className="text-xs text-muted-foreground leading-tight hidden sm:block">
                {/* hidden sm:block - SERVE PARA OCULTAR NA VERSÃO MOBILE */}
                História Militar
              </div>
            </div>
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-sm hidden md:flex"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos..."
                className="pl-9 bg-secondary border-border text-sm"
              />
            </div>
          </form>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium hover:text-primary shrink-0"
            >
              Início
            </Button>
          </Link>
          {mainCategories.map(cat => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm hover:text-primary shrink-0"
              >
                {cat.name}
              </Button>
            </Link>
          ))}
          <Link href="/busca">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm hover:text-primary shrink-0"
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              Buscar
            </Button>
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="container py-3 space-y-1">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos..."
                  className="pl-9 bg-secondary"
                />
              </div>
            </form>
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                Início
              </Button>
            </Link>
            {categories?.map(cat => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  {cat.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
