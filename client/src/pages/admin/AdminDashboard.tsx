import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FolderOpen, Eye, Plus, Upload, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.cms.stats.useQuery();

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-5xl">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">Bem-vindo ao Painel</h2>
          <p className="text-sm text-muted-foreground">Gerencie os artigos e categorias do Cenas de Combate.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Total de Artigos"
                value={stats?.total ?? 0}
                color="text-primary"
              />
              <StatCard
                icon={Eye}
                label="Publicados"
                value={stats?.published ?? 0}
                color="text-green-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Rascunhos"
                value={stats?.draft ?? 0}
                color="text-yellow-400"
              />
              <StatCard
                icon={FolderOpen}
                label="Categorias"
                value={stats?.categories ?? 0}
                color="text-blue-400"
              />
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            href="/admin/posts/novo"
            icon={Plus}
            title="Novo Artigo"
            description="Criar um novo artigo para publicação"
            primary
          />
          <ActionCard
            href="/admin/posts"
            icon={FileText}
            title="Gerenciar Artigos"
            description="Editar, publicar ou excluir artigos existentes"
          />
          <ActionCard
            href="/admin/importar"
            icon={Upload}
            title="Importar WordPress"
            description="Importar artigos do arquivo XML do WordPress"
          />
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className={`${color} mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, description, primary }: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`
        rounded-lg p-5 border cursor-pointer transition-all duration-200 h-full
        ${primary
          ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
          : "bg-card border-border hover:border-primary/30 hover:bg-secondary"
        }
      `}>
        <Icon className={`w-6 h-6 mb-3 ${primary ? "text-primary" : "text-muted-foreground"}`} />
        <h3 className={`font-semibold text-sm mb-1 ${primary ? "text-primary" : "text-foreground"}`}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
