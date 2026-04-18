import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Download, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  size: number;
  createdAt: Date;
}

export default function MediaGallery() {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: media, isLoading, refetch } = trpc.cms.listMedia.useQuery();
  const deleteMutation = trpc.cms.deleteMedia.useMutation();
  const uploadMutation = trpc.cms.uploadImage.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/trpc/cms.uploadImage", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast.success(`${file.name} enviado com sucesso`);
          refetch();
        } else {
          toast.error(`Erro ao enviar ${file.name}`);
        }
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta imagem?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Imagem deletada com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao deletar imagem");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para clipboard");
  };

  const filteredMedia = media?.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="media-upload"
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <div className="space-y-2">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Clique para enviar imagens</p>
                <p className="text-xs text-muted-foreground">
                  ou arraste e solte aqui
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar imagens..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Gallery */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredMedia && filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative bg-muted rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyUrl(item.url)}
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs truncate">
                {item.filename}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma imagem encontrada
        </div>
      )}
    </div>
  );
}
