import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FolderOpen, Edit2 } from "lucide-react";
import AdminLayoutPro from "@/components/admin/AdminLayoutPro";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function AdminCategories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.list.useQuery();

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada!");
      utils.categories.list.invalidate();
      closeDialog();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Categoria atualizada!");
      utils.categories.list.invalidate();
      closeDialog();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Categoria excluída!");
      utils.categories.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const openCreate = () => {
    setEditingId(null);
    setName(""); setSlug(""); setDescription(""); setSlugManual(false);
    setDialogOpen(true);
  };

  const openEdit = (cat: { id: number; name: string; slug: string; description?: string | null }) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setSlugManual(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setName(""); setSlug(""); setDescription(""); setSlugManual(false);
  };

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) { toast.error("Nome e slug são obrigatórios."); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, name, slug, description: description || undefined });
    } else {
      createMutation.mutate({ name, slug, description: description || undefined });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayoutPro title="Categorias">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Categorias</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e organize categorias de artigos
          </p>
        </div>
      </div>


      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5 mt-5">
          <p className="text-sm text-muted-foreground">
            {categories?.length ?? 0} categorias
          </p>
          <Button
            onClick={openCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Nova Categoria
          </Button>
        </div>

        {/* List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : categories?.length === 0 ? (
            <div className="p-8 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Slug</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat) => (
                  <tr key={cat.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</div>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Nome *</Label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nome da categoria"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="slug-da-categoria"
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="border-border">Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. Os artigos desta categoria não serão excluídos, mas perderão a associação.
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
    </AdminLayoutPro>
  );
}
