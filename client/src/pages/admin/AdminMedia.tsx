import AdminLayoutPro from "@/components/admin/AdminLayoutPro";
import MediaGallery from "@/components/MediaGallery";

export default function AdminMedia() {
  return (
    <AdminLayoutPro title="Gerenciador de Mídia">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Biblioteca de Mídia</h2>
          <p className="text-sm text-muted-foreground">
            Faça upload, organize e gerencie suas imagens
          </p>
        </div>

        <MediaGallery />
      </div>
    </AdminLayoutPro>
  );
}
