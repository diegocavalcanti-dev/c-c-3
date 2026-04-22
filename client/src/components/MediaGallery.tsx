import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Trash2,
  Copy,
  Loader2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  size: number;
  createdAt: string | Date;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const result = ev.target?.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaGallery() {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: media, isLoading, refetch } = trpc.cms.listMedia.useQuery();

  const uploadMutation = trpc.cms.uploadImage.useMutation({
    onSuccess: () => {
      utils.cms.listMedia.invalidate();
    },
  });

  const deleteMutation = trpc.cms.deleteMedia.useMutation({
    onSuccess: () => {
      utils.cms.listMedia.invalidate();
    },
  });

  const filteredMedia = useMemo(() => {
    const items = media ?? [];
    const term = search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      item.filename.toLowerCase().includes(term)
    );
  }, [media, search]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: imagem muito grande (máx. 5MB).`);
          continue;
        }

        try {
          const base64 = await fileToBase64(file);

          await uploadMutation.mutateAsync({
            filename: file.name,
            contentType: file.type,
            dataBase64: base64,
          });

          toast.success(`${file.name} enviado com sucesso.`);
        } catch (error) {
          toast.error(`Erro ao enviar ${file.name}.`);
        }
      }

      await refetch();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar esta imagem?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Imagem deletada com sucesso.");
      await refetch();
    } catch {
      toast.error("Erro ao deletar imagem.");
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada.");
    } catch {
      toast.error("Não foi possível copiar a URL.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">
          Biblioteca de Mídia
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Faça upload, organize e gerencie suas imagens
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-background px-6 py-10 text-center transition hover:border-primary/50 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? (
              <>
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                <span className="text-base font-medium">Enviando imagens...</span>
              </>
            ) : (
              <>
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <span className="text-base font-medium">
                  Clique para enviar imagens
                </span>
                <span className="mt-1 text-sm text-muted-foreground">
                  ou arraste e solte aqui
                </span>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="mt-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar imagens..."
            className="rounded-2xl border-border/70 bg-background"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-border/60 bg-card p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                />

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => handleCopyUrl(item.url)}
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => handleDelete(item.id)}
                    title="Deletar"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 p-3">
                <div
                  className="truncate text-sm font-medium text-foreground"
                  title={item.filename}
                >
                  {item.filename}
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-8 text-center">
          <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            Nenhuma imagem encontrada
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça upload de uma nova imagem para começar.
          </p>
        </div>
      )}
    </div>
  );
}
