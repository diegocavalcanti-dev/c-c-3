import { useMemo, useState } from "react";
import AdminLayoutPro from "@/components/admin/AdminLayoutPro";
import AdminTable from "@/components/admin/AdminTable";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  FileText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type SortKey = "title" | "author" | "status" | "createdAt" | "viewCount";
type SortDirection = "asc" | "desc";

export default function AdminPostsListPro() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const pageSize = 30;

  const { data: postsData, isLoading } = trpc.cms.listPosts.useQuery({
    limit: 10000,
    offset: 0,
  });

  const deleteMutation = trpc.cms.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Artigo deletado com sucesso!");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const posts = Array.isArray(postsData) ? postsData : (postsData?.posts || []);

  const counts = useMemo(() => {
    return {
      all: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      draft: posts.filter((p) => p.status === "draft").length,
      archived: posts.filter((p) => p.status === "archived").length,
    };
  }, [posts]);

  const filteredAndSorted = useMemo(() => {
    const filtered = posts.filter((post) => {
      const title = post.title?.toLowerCase?.() || "";
      const author = post.author?.toLowerCase?.() || "";
      const slug = post.slug?.toLowerCase?.() || "";
      const term = search.toLowerCase();

      const matchSearch =
        title.includes(term) || author.includes(term) || slug.includes(term);

      const matchStatus =
        status === "all" || !status ? true : post.status === status;

      return matchSearch && matchStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortKey === "createdAt") {
        aValue = normalizeDate(a.createdAt);
        bValue = normalizeDate(b.createdAt);
      } else if (sortKey === "viewCount") {
        aValue = Number(a.viewCount || 0);
        bValue = Number(b.viewCount || 0);
      } else {
        aValue = String(a[sortKey] || "").toLowerCase();
        bValue = String(b[sortKey] || "").toLowerCase();
      }

      if (aValue === bValue) return 0;

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }

      return aValue < bValue ? 1 : -1;
    });

    return sorted;
  }, [posts, search, status, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page]);

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortKey(key as SortKey);
    setSortDirection(direction);
  };

  const handleStatusTab = (nextStatus: string) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este artigo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSortKey("createdAt");
    setSortDirection("desc");
    setPage(1);
  };

  return (
    <AdminLayoutPro title="Artigos">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gerenciar Artigos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Organize, filtre e edite seu conteúdo com mais rapidez
            </p>
          </div>

          <Link href="/admin/posts/novo">
            <a>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Artigo
              </Button>
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Todos os artigos" value={counts.all} />
          <StatCard label="Publicados" value={counts.published} tone="green" />
          <StatCard label="Rascunhos" value={counts.draft} tone="orange" />
          <StatCard label="Arquivados" value={counts.archived} tone="gray" />
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusTab
                active={status === "all"}
                onClick={() => handleStatusTab("all")}
                label={`Todos (${counts.all})`}
              />
              <StatusTab
                active={status === "published"}
                onClick={() => handleStatusTab("published")}
                label={`Publicados (${counts.published})`}
              />
              <StatusTab
                active={status === "draft"}
                onClick={() => handleStatusTab("draft")}
                label={`Rascunhos (${counts.draft})`}
              />
              <StatusTab
                active={status === "archived"}
                onClick={() => handleStatusTab("archived")}
                label={`Arquivados (${counts.archived})`}
              />
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_220px_220px_auto] gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, autor ou slug..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortKey}:${sortDirection}`}
                onValueChange={(value) => {
                  const [key, direction] = value.split(":") as [SortKey, SortDirection];
                  setSortKey(key);
                  setSortDirection(direction);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:desc">Mais recentes</SelectItem>
                  <SelectItem value="createdAt:asc">Mais antigos</SelectItem>
                  <SelectItem value="title:asc">Título A–Z</SelectItem>
                  <SelectItem value="title:desc">Título Z–A</SelectItem>
                  <SelectItem value="viewCount:desc">Mais visualizados</SelectItem>
                  <SelectItem value="viewCount:asc">Menos visualizados</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                Mostrando <strong>{paginatedPosts.length}</strong> de{" "}
                <strong>{filteredAndSorted.length}</strong> artigos
              </span>

              <span>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>
            </div>
          </div>

          <div className="px-4 pb-4">
            <AdminTable
              columns={[
                {
                  key: "title" as const,
                  label: "Título",
                  width: "42%",
                  sortable: true,
                  render: (value) => (
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium leading-5 text-foreground line-clamp-2">
                            {value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "author" as const,
                  label: "Autor",
                  width: "15%",
                  sortable: true,
                  render: (value) => (
                    <span className="text-sm font-medium">{value || "—"}</span>
                  ),
                },
                {
                  key: "status" as const,
                  label: "Status",
                  width: "12%",
                  sortable: true,
                  render: (value) => <StatusBadge status={value} />,
                },
                {
                  key: "createdAt" as const,
                  label: "Data",
                  width: "16%",
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(value)}</span>
                    </div>
                  ),
                },
                {
                  key: "viewCount" as const,
                  label: "Visualizações",
                  width: "10%",
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      {(Number(value) || 0).toLocaleString("pt-BR")}
                    </div>
                  ),
                },
              ]}
              data={paginatedPosts}
              onSort={handleSort}
              sortKey={sortKey}
              sortDirection={sortDirection}
              loading={isLoading}
              rowActions={(row) => (
                <div className="flex items-center gap-1">
                  <Link href={`/${row.slug}`}>
                    <a target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </a>
                  </Link>

                  <Link href={`/admin/posts/${row.id}/editar`}>
                    <a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-500/10"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </a>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDelete(row.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              emptyState={
                <div className="text-center py-14">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Nenhum artigo encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Tente ajustar sua busca ou criar um novo artigo.
                  </p>
                  <Link href="/admin/posts/novo">
                    <a>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeiro artigo
                      </Button>
                    </a>
                  </Link>
                </div>
              }
            />
          </div>

          <div className="flex items-center justify-between border-t px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Exibindo {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredAndSorted.length)} de{" "}
              {filteredAndSorted.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutPro>
  );
}

function normalizeDate(value: unknown) {
  try {
    let timestamp: number;

    if (typeof value === "number") {
      timestamp = value;
    } else if (typeof value === "string") {
      const parsed = Number(value);
      timestamp = Number.isNaN(parsed) ? new Date(value).getTime() : parsed;
    } else {
      return 0;
    }

    if (timestamp < 10000000000) {
      timestamp = timestamp * 1000;
    }

    return timestamp;
  } catch {
    return 0;
  }
}

function formatDate(value: unknown) {
  try {
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
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
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

function StatusTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition ${active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "green" | "orange" | "gray";
}) {
  const toneClass =
    tone === "green"
      ? "border-green-500/20 bg-green-500/5"
      : tone === "orange"
        ? "border-orange-500/20 bg-orange-500/5"
        : tone === "gray"
          ? "border-gray-500/20 bg-gray-500/5"
          : "border-border bg-card";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-2">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}