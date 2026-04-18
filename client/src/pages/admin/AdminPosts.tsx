import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT = 20;

export default function AdminPosts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.cms.listPosts.useQuery({ page, limit: LIMIT, search });

  const deleteMutation = trpc.cms.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Artigo excluído com sucesso.");
      utils.cms.listPosts.invalidate();
      utils.cms.stats.invalidate();
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir artigo."),
  });

  const updateMutation = trpc.cms.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado.");
      utils.cms.listPosts.invalidate();
      utils.cms.stats.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar artigo."),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    updateMutation.mutate({ id, status: newStatus as any });
  };

  const statusBadge = (status: string) => {
    if (status === 'published') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Publicado</Badge>;
    if (status === 'draft') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Rascunho</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  return (
    <AdminLayout title="Artigos">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {data?.total ?? 0} artigos no total
            </p>
          </div>
          <Link href="/admin/posts/novo">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Novo Artigo
            </Button>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar artigos..."
            className="max-w-sm bg-secondary border-border text-sm"
          />
          <Button type="submit" variant="outline" size="sm" className="border-border">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : data?.posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhum artigo encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium">Título</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Status</th>
                    <th className="text-left p-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Data</th>
                    <th className="text-right p-3 text-xs text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.posts.map((post) => (
                    <tr key={post.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-foreground line-clamp-1 max-w-xs lg:max-w-md">
                          {post.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 md:hidden">
                          {statusBadge(post.status)}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {statusBadge(post.status)}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("pt-BR")
                          : new Date(post.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-primary"
                            title={post.status === 'published' ? 'Despublicar' : 'Publicar'}
                            onClick={() => toggleStatus(post.id, post.status)}
                          >
                            {post.status === 'published'
                              ? <EyeOff className="w-3.5 h-3.5" />
                              : <Eye className="w-3.5 h-3.5" />
                            }
                          </Button>
                          <Link href={`/admin/posts/${post.id}/editar`}>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. O artigo será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
