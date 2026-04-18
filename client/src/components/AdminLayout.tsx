import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, FileText, Folder } from "lucide-react";
import { useEffect } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-screen p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Cenas de Combate</p>
          </div>

          <nav className="space-y-2 mb-8">
            <Button
              variant={isActive("/admin/posts") ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/admin/posts")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Artigos
            </Button>
            <Button
              variant={isActive("/admin/categories") ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/admin/categories")}
            >
              <Folder className="mr-2 h-4 w-4" />
              Categorias
            </Button>
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <Card className="p-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-1">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </Card>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
