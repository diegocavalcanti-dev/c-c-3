import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayoutPro from "@/components/admin/AdminLayoutPro";

export default function AdminAuthors() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", bio: "", avatar: "" });

  const authorsQuery = trpc.authors.list.useQuery();
  const createMutation = trpc.authors.create.useMutation();
  const updateMutation = trpc.authors.update.useMutation();
  const deleteMutation = trpc.authors.delete.useMutation();
  const utils = trpc.useUtils();

  const handleOpenDialog = (author?: any) => {
    if (author) {
      setEditingId(author.id);
      setFormData({ name: author.name, slug: author.slug, bio: author.bio || "", avatar: author.avatar || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", slug: "", bio: "", avatar: "" });
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Autor atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Autor criado com sucesso");
      }
      setIsOpen(false);
      utils.authors.list.invalidate();
    } catch (error) {
      toast.error("Erro ao salvar autor");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este autor?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Autor deletado com sucesso");
      utils.authors.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar autor");
    }
  };

  return (
    <AdminLayoutPro title="Autores">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gerenciar Autores</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus size={18} />
                Novo Autor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Autor" : "Novo Autor"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do autor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="slug-do-autor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Biografia do autor"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Avatar URL</label>
                  <Input
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {authorsQuery.isLoading ? (
          <div className="text-center py-8">Carregando autores...</div>
        ) : authorsQuery.data?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum autor cadastrado</div>
        ) : (
          <div className="grid gap-4">
            {authorsQuery.data?.map((author) => (
              <div key={author.id} className="border rounded-lg p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{author.name}</h3>
                  <p className="text-sm text-muted-foreground">/{author.slug}</p>
                  {author.bio && <p className="text-sm mt-2">{author.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(author)}
                    className="gap-2"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(author.id)}
                    className="gap-2"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayoutPro>
  );
}
