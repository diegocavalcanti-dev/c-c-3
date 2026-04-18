import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminPostsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  const { data: adminData, isLoading, refetch } = trpc.posts.adminList.useQuery({ page: 1, limit: 1000 });
  const utils = trpc.useUtils();
  const posts = adminData?.posts || [];
  const { data: categories } = trpc.categories.list.useQuery();

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Artigo criado com sucesso!");
      setIsCreateOpen(false);
      setFormData({ title: "", slug: "", content: "", excerpt: "", status: "draft" });
      utils.posts.adminList.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("Artigo atualizado com sucesso!");
      setIsEditOpen(false);
      setEditingPost(null);
      utils.posts.adminList.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Artigo deletado com sucesso!");
      utils.posts.adminList.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    await createMutation.mutateAsync(formData);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      status: post.status,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    await updateMutation.mutateAsync({
      id: editingPost.id,
      ...formData,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este artigo?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      published: "default",
      draft: "secondary",
      archived: "destructive",
    };
    return variants[status] || "secondary";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Artigos</h1>
            <p className="text-muted-foreground mt-1">Crie, edite e publique artigos</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Artigo
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Carregando artigos...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Artigos ({adminData?.total || posts.length})</CardTitle>
              <CardDescription>Lista de todos os artigos no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post: any) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">{post.slug}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={getStatusBadge(post.status)}>
                            {post.status === "published" ? (
                              <Eye className="h-3 w-3 mr-1" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1" />
                            )}
                            {post.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {post.viewCount} visualizações
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum artigo encontrado. Crie um novo!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Artigo</DialogTitle>
            <DialogDescription>Preencha os detalhes do novo artigo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input
                placeholder="Título do artigo"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input
                placeholder="titulo-do-artigo"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Excerpt</label>
              <Textarea
                placeholder="Resumo do artigo"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <Textarea
                placeholder="Conteúdo do artigo (suporta Markdown)"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
            <DialogDescription>Atualize os detalhes do artigo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input
                placeholder="Título do artigo"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input
                placeholder="titulo-do-artigo"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Excerpt</label>
              <Textarea
                placeholder="Resumo do artigo"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <Textarea
                placeholder="Conteúdo do artigo (suporta Markdown)"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
