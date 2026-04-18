import { useMemo } from "react";
import AdminLayoutPro from "@/components/admin/AdminLayoutPro";
import MetricCard from "@/components/admin/MetricCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Archive,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  FolderOpen,
  Lightbulb,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Activity,
  Layers3,
  Gauge,
  PenSquare,
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboardPro() {
  const { data: stats } = trpc.cms.stats.useQuery();

  const { data: recentPostsData } = trpc.cms.listPosts.useQuery({
    limit: 10,
    offset: 0,
  });

  const { data: allPostsData } = trpc.cms.listPosts.useQuery({
    limit: 10000,
    offset: 0,
  });

  const recentPosts = Array.isArray(recentPostsData)
    ? recentPostsData
    : (recentPostsData?.posts || []);

  const allPosts = Array.isArray(allPostsData)
    ? allPostsData
    : (allPostsData?.posts || []);

  const totalPosts = stats?.total || allPosts.length || 0;
  const publishedPosts = stats?.published || allPosts.filter((p) => p.status === "published").length;
  const draftPosts = stats?.draft || allPosts.filter((p) => p.status === "draft").length;
  const archivedPosts = allPosts.filter((p) => p.status === "archived").length;

  const totalViews = useMemo(() => {
    return allPosts.reduce((acc, post) => acc + (Number(post.viewCount) || 0), 0);
  }, [allPosts]);

  const averageViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

  const publishedPercent = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;
  const draftPercent = totalPosts > 0 ? Math.round((draftPosts / totalPosts) * 100) : 0;
  const archivedPercent = totalPosts > 0 ? Math.round((archivedPosts / totalPosts) * 100) : 0;

  const topPosts = useMemo(() => {
    return [...allPosts]
      .sort((a, b) => (Number(b.viewCount) || 0) - (Number(a.viewCount) || 0))
      .slice(0, 5);
  }, [allPosts]);

  const latestPosts = useMemo(() => {
    return [...recentPosts]
      .sort((a, b) => getSortableDate(b.createdAt) - getSortableDate(a.createdAt))
      .slice(0, 6);
  }, [recentPosts]);

  const noViewsPosts = useMemo(() => {
    return allPosts
      .filter((post) => (Number(post.viewCount) || 0) === 0)
      .slice(0, 5);
  }, [allPosts]);

  const attentionPosts = useMemo(() => {
    return allPosts
      .filter((post) => post.status === "draft" || (Number(post.viewCount) || 0) === 0)
      .slice(0, 6);
  }, [allPosts]);

  const recentActivity = useMemo(() => {
    return [...allPosts]
      .sort((a, b) => getSortableDate(b.createdAt) - getSortableDate(a.createdAt))
      .slice(0, 6);
  }, [allPosts]);

  const bestPost = topPosts[0];
  const lastPublished = [...allPosts]
    .filter((post) => post.status === "published")
    .sort((a, b) => getSortableDate(b.createdAt) - getSortableDate(a.createdAt))[0];

  const insights = useMemo(() => {
    const items: string[] = [];

    if (draftPosts > publishedPosts) {
      items.push("Você tem mais rascunhos do que artigos publicados. Vale acelerar a revisão editorial.");
    }

    if (averageViews < 20 && totalPosts > 0) {
      items.push("A média de visualizações por artigo ainda está baixa. Considere revisar títulos e distribuição.");
    }

    if (noViewsPosts.length >= 3) {
      items.push("Há vários artigos sem visualizações. Talvez falte destaque na home ou interlinkagem.");
    }

    if (publishedPercent >= 70) {
      items.push("Seu acervo está bem publicado. O próximo passo é otimizar performance dos artigos mais fortes.");
    }

    if (items.length === 0) {
      items.push("Seu painel está saudável. Continue monitorando produção, publicação e alcance.");
    }

    return items.slice(0, 3);
  }, [draftPosts, publishedPosts, averageViews, totalPosts, noViewsPosts.length, publishedPercent]);

  return (
    <AdminLayoutPro title="Dashboard">
      <div className="space-y-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                Dashboard inteligente do CMS
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4">
                Controle editorial, performance e produção em tempo real
              </h1>

              <p className="text-muted-foreground mt-3 max-w-2xl">
                Acompanhe o crescimento do conteúdo, identifique gargalos e foque no que realmente precisa de atenção.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/admin/posts/novo">
                  <a>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Criar novo artigo
                    </Button>
                  </a>
                </Link>

                <Link href="/admin/posts">
                  <a>
                    <Button variant="outline" className="gap-2">
                      <Layers3 className="w-4 h-4" />
                      Abrir gerenciador
                    </Button>
                  </a>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">
              <HeroStat
                label="Total de views"
                value={totalViews.toLocaleString("pt-BR")}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <HeroStat
                label="Média por artigo"
                value={averageViews.toLocaleString("pt-BR")}
                icon={<Gauge className="w-5 h-5" />}
              />
              <HeroStat
                label="Publicados"
                value={`${publishedPercent}%`}
                icon={<CheckCircle2 className="w-5 h-5" />}
              />
              <HeroStat
                label="Rascunhos"
                value={draftPosts.toLocaleString("pt-BR")}
                icon={<PenSquare className="w-5 h-5" />}
              />
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Artigos"
            value={totalPosts}
            icon={<FileText className="w-8 h-8" />}
            color="blue"
            description="Conteúdo total no CMS"
          />

          <MetricCard
            title="Publicados"
            value={publishedPosts}
            icon={<CheckCircle2 className="w-8 h-8" />}
            color="green"
            trend={{ value: publishedPercent, direction: "up" }}
            description="Prontos e visíveis no site"
          />

          <MetricCard
            title="Rascunhos"
            value={draftPosts}
            icon={<MessageSquare className="w-8 h-8" />}
            color="orange"
            trend={{ value: draftPercent, direction: draftPercent > 0 ? "up" : "up" }}
            description="Aguardando edição ou revisão"
          />

          <MetricCard
            title="Visualizações"
            value={totalViews}
            icon={<Eye className="w-8 h-8" />}
            color="purple"
            description="Volume acumulado do conteúdo"
          />
        </section>

        {/* GRID PRINCIPAL */}
        <section className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
          {/* PERFORMANCE */}
          <div className="2xl:col-span-5 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Performance do conteúdo</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Indicadores de produção e alcance editorial
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-5">
              <ProgressRow
                label="Publicados"
                value={publishedPosts}
                percent={publishedPercent}
                colorClass="bg-green-500"
              />
              <ProgressRow
                label="Rascunhos"
                value={draftPosts}
                percent={draftPercent}
                colorClass="bg-orange-500"
              />
              <ProgressRow
                label="Arquivados"
                value={archivedPosts}
                percent={archivedPercent}
                colorClass="bg-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <MiniPanel
                title="Artigo líder"
                value={bestPost?.title || "Sem dados"}
                subtitle={`${(Number(bestPost?.viewCount) || 0).toLocaleString("pt-BR")} visualizações`}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MiniPanel
                title="Último publicado"
                value={lastPublished?.title || "Sem dados"}
                subtitle={lastPublished ? formatDate(lastPublished.createdAt) : "—"}
                icon={<Clock3 className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* INSIGHTS */}
          <div className="2xl:col-span-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Insights automáticos</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Leituras rápidas do seu painel
                </p>
              </div>
              <Lightbulb className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {insights.map((item, index) => (
                <InsightItem key={index} text={item} />
              ))}
            </div>

            <div className="mt-6 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Saúde geral do conteúdo</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-bold">
                  {publishedPercent >= 70 ? "Alta" : publishedPercent >= 40 ? "Média" : "Baixa"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {publishedPercent}% publicado
                </span>
              </div>
            </div>
          </div>

          {/* AÇÕES */}
          <div className="2xl:col-span-3 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Ações rápidas</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Atalhos operacionais
                </p>
              </div>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <QuickAction
                href="/admin/posts/novo"
                icon={<Pencil className="w-4 h-4" />}
                title="Novo artigo"
                subtitle="Criar conteúdo"
                tone="primary"
              />
              <QuickAction
                href="/admin/posts"
                icon={<FileText className="w-4 h-4" />}
                title="Gerenciar artigos"
                subtitle="Editar e revisar"
                tone="blue"
              />
              <QuickAction
                href="/admin/categorias"
                icon={<FolderOpen className="w-4 h-4" />}
                title="Categorias"
                subtitle="Organizar o conteúdo"
                tone="amber"
              />
              <QuickAction
                href="/admin/media"
                icon={<Eye className="w-4 h-4" />}
                title="Mídia"
                subtitle="Arquivos e uploads"
                tone="green"
              />
            </div>
          </div>
        </section>

        {/* SEGUNDA LINHA */}
        <section className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
          {/* TOP POSTS */}
          <div className="2xl:col-span-5 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Top artigos por visualização</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Os conteúdos com melhor desempenho
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {topPosts.length > 0 ? (
                topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4 hover:bg-muted/30 transition"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-2">{post.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <StatusBadge status={post.status} />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {(Number(post.viewCount) || 0).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBlock text="Nenhum artigo encontrado." />
              )}
            </div>
          </div>

          {/* RECENTES */}
          <div className="2xl:col-span-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Produção recente</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Últimos artigos cadastrados no sistema
                </p>
              </div>
              <Clock3 className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border p-4 hover:bg-muted/30 transition">
                    <p className="font-medium line-clamp-2">{post.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatusBadge status={post.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(Number(post.viewCount) || 0).toLocaleString("pt-BR")} views
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Link href={`/admin/posts/${post.id}/editar`}>
                        <a className="text-xs text-primary hover:underline">Editar</a>
                      </Link>

                      {post.slug ? (
                        <Link href={`/${post.slug}`}>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Visualizar
                          </a>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBlock text="Nenhum conteúdo recente." />
              )}
            </div>
          </div>

          {/* ATENÇÃO */}
          <div className="2xl:col-span-3 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Precisa de atenção</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Itens que podem exigir ação
                </p>
              </div>
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {attentionPosts.length > 0 ? (
                attentionPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border p-4">
                    <p className="font-medium line-clamp-2">{post.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} />
                      {(Number(post.viewCount) || 0) === 0 ? (
                        <span className="text-xs rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1">
                          Sem views
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBlock text="Nenhum item crítico no momento." />
              )}
            </div>
          </div>
        </section>

        {/* ATIVIDADE */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Linha do tempo editorial</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Últimas movimentações do conteúdo no painel
              </p>
            </div>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((post) => (
                <div key={post.id} className="rounded-xl border p-4 hover:bg-muted/20 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium line-clamp-2">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getActivityLabel(post.status)} • {formatDate(post.createdAt)}
                      </p>
                    </div>
                    <StatusDot status={post.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock text="Ainda não há atividade recente." />
            )}
          </div>
        </section>
      </div>
    </AdminLayoutPro>
  );
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percent,
  colorClass,
}: {
  label: string;
  value: number;
  percent: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value.toLocaleString("pt-BR")} • {percent}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
        />
      </div>
    </div>
  );
}

function MiniPanel({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <p className="text-sm">{title}</p>
        {icon}
      </div>
      <p className="font-semibold mt-3 line-clamp-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex gap-3">
        <div className="mt-0.5">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm leading-6">{text}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "primary" | "blue" | "amber" | "green";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 hover:bg-primary/15 text-primary"
      : tone === "blue"
        ? "bg-blue-500/10 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400"
        : tone === "amber"
          ? "bg-orange-500/10 hover:bg-orange-500/15 text-orange-600 dark:text-orange-400"
          : "bg-green-500/10 hover:bg-green-500/15 text-green-600 dark:text-green-400";

  return (
    <Link href={href}>
      <a className={`block rounded-xl p-4 transition ${toneClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className="mt-0.5">{icon}</div>
            <div className="min-w-0">
              <p className="font-medium">{title}</p>
              <p className="text-xs opacity-80 mt-1">{subtitle}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </div>
      </a>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    published: "bg-green-500/15 text-green-700 dark:text-green-400",
    draft: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    archived: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  };

  const labelMap = {
    published: "Publicado",
    draft: "Rascunho",
    archived: "Arquivado",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${map[status as keyof typeof map] || "bg-muted text-muted-foreground"
        }`}
    >
      {labelMap[status as keyof typeof labelMap] || status}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const className =
    status === "published"
      ? "bg-green-500"
      : status === "draft"
        ? "bg-orange-500"
        : "bg-gray-400";

  return <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${className}`} />;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-6 text-center">{text}</div>;
}

function getSortableDate(value: unknown) {
  if (!value) return 0;

  if (value instanceof Date) return value.getTime();

  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  if (typeof value === "number") {
    return value < 10000000000 ? value * 1000 : value;
  }

  return 0;
}

function formatDate(value: unknown) {
  if (!value) return "—";

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    date = new Date(value);
  } else if (typeof value === "number") {
    date = new Date(value < 10000000000 ? value * 1000 : value);
  } else {
    return "—";
  }

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getActivityLabel(status: string) {
  switch (status) {
    case "published":
      return "Publicado";
    case "draft":
      return "Rascunho atualizado";
    case "archived":
      return "Arquivado";
    default:
      return "Atualizado";
  }
}