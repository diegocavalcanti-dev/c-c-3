import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayoutPro({ children, title }: AdminLayoutProProps) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const menuGroups = [
    {
      title: "Principal",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin", id: "dashboard" },
      ],
    },
    {
      title: "Conteúdo",
      items: [
        { icon: FileText, label: "Artigos", href: "/admin/posts", id: "posts" },
        { icon: FolderOpen, label: "Categorias", href: "/admin/categorias", id: "categories" },
        { icon: FolderOpen, label: "Autores", href: "/admin/autores", id: "authors" },
        { icon: Image, label: "Mídia", href: "/admin/media", id: "media" },
      ],
    },
    {
      title: "Sistema",
      items: [
        { icon: Settings, label: "Configurações", href: "/admin/settings", id: "settings" },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
        <p className="text-lg font-medium">Acesso restrito a administradores</p>
        <Button asChild>
          <a href={getLoginUrl()}>Fazer login</a>
        </Button>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  };

  const sidebarWidthClass = desktopCollapsed ? "lg:w-[88px]" : "lg:w-72";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const renderSidebarContent = () => (
    <>
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin">
            <a className="flex items-center gap-3 min-w-0 hover:opacity-90 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>

              {!desktopCollapsed && (
                <div className="min-w-0">
                  <p className="font-semibold leading-none truncate">Cenas CMS</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Painel administrativo
                  </p>
                </div>
              )}
            </a>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDesktopCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label={desktopCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
              title={desktopCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              {desktopCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              {!desktopCollapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link key={item.id} href={item.href}>
                      <a
                        title={desktopCollapsed ? item.label : undefined}
                        className={`group relative flex items-center ${desktopCollapsed ? "justify-center" : "justify-between"
                          } gap-3 rounded-xl px-3 py-3 transition-all ${active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active
                              ? "bg-white/10 text-primary-foreground"
                              : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {!desktopCollapsed && (
                            <span className="text-sm font-medium truncate">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!desktopCollapsed && active && (
                          <ChevronLeft className="w-4 h-4 rotate-180 opacity-80 shrink-0" />
                        )}

                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/80" />
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-3">
        {!desktopCollapsed ? (
          <div className="rounded-2xl border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{user.name || "Admin"}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                </div>

                <p className="text-xs text-muted-foreground truncate mt-1">
                  {user.email}
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              title="Sair"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {mobileSidebarOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Fechar sidebar"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex h-full flex-col">{renderSidebarContent()}</div>
        </aside>

        <aside
          className={`hidden lg:flex lg:flex-col ${sidebarWidthClass} border-r border-border bg-card transition-all duration-300`}
        >
          <div className="flex h-full flex-col">{renderSidebarContent()}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                  {title ? (
                    <>
                      <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>
                      <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
                        Painel administrativo
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-lg md:text-xl font-semibold truncate">Editor de Artigo</h1>
                      <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
                        Painel administrativo
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  aria-label="Notificações"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 hover:bg-muted transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>

                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-none max-w-[140px] truncate">
                        {user.name || "Admin"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 max-w-[140px] truncate">
                        {user.email}
                      </p>
                    </div>

                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name || "Admin"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {user.email}
                            </p>
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                <ShieldCheck className="w-3 h-3" />
                                Administrador
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sair
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}