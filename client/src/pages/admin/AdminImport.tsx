import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";

interface WPPost {
  wpId: number | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  author: string;
  publishedAt: string | null;
  categories: string[];
}

interface WPCategory {
  name: string;
  slug: string;
  description?: string;
}

interface ParsedData {
  categories: WPCategory[];
  posts: WPPost[];
}

function parseWordPressXML(xmlText: string): ParsedData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // Parse categories
  const catElements = doc.querySelectorAll("category");
  const categoriesMap = new Map<string, WPCategory>();

  catElements.forEach((el) => {
    const slug = el.querySelector("category_nicename")?.textContent || "";
    const name = el.querySelector("cat_name")?.textContent || "";
    const description = el.querySelector("category_description")?.textContent || "";
    if (slug && name) {
      categoriesMap.set(slug, { name, slug, description: description || undefined });
    }
  });

  // Parse posts
  const items = doc.querySelectorAll("item");
  const posts: WPPost[] = [];

  items.forEach((item) => {
    const postType = item.querySelector("post_type")?.textContent || "";
    const status = item.querySelector("status")?.textContent || "";

    if (postType !== "post") return;
    if (status !== "publish") return;

    const title = item.querySelector("title")?.textContent || "";
    const slug = item.querySelector("post_name")?.textContent || "";
    const content = item.querySelector("encoded")?.textContent || "";
    const excerpt = item.querySelectorAll("encoded")[1]?.textContent || "";
    const author = item.querySelector("creator")?.textContent || "Cenas de Combate";
    const pubDate = item.querySelector("pubDate")?.textContent || null;
    const wpId = parseInt(item.querySelector("post_id")?.textContent || "0") || null;

    // Get categories
    const catSlugs: string[] = [];
    item.querySelectorAll("category[domain='category']").forEach((catEl) => {
      const nicename = catEl.getAttribute("nicename");
      if (nicename) catSlugs.push(nicename);
    });

    // Get featured image from meta
    let featuredImage: string | null = null;
    item.querySelectorAll("postmeta").forEach((meta) => {
      const key = meta.querySelector("meta_key")?.textContent;
      if (key === "_thumbnail_id") {
        // We'll use a placeholder since we can't resolve attachment URLs client-side
      }
    });

    if (title && slug) {
      posts.push({
        wpId,
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        author,
        publishedAt: pubDate,
        categories: catSlugs,
      });
    }
  });

  return {
    categories: Array.from(categoriesMap.values()),
    posts,
  };
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ inserted: number; total: number } | null>(null);

  const importMutation = trpc.cms.importWordPress.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Importação concluída! ${data.inserted} de ${data.total} artigos importados.`);
    },
    onError: (err) => toast.error(`Erro na importação: ${err.message}`),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsed(null);
    setResult(null);
    setParsing(true);

    try {
      const text = await f.text();
      const data = parseWordPressXML(text);
      setParsed(data);
      toast.success(`Arquivo analisado: ${data.posts.length} artigos e ${data.categories.length} categorias encontrados.`);
    } catch (err) {
      toast.error("Erro ao analisar o arquivo XML.");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    if (!parsed) return;
    importMutation.mutate(parsed);
  };

  return (
    <AdminLayout title="Importar WordPress">
      <div className="max-w-2xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Importe artigos e categorias a partir do arquivo XML de exportação do WordPress.
            Selecione o arquivo <code className="bg-secondary px-1 rounded text-xs">.xml</code> exportado pelo WordPress.
          </p>
        </div>

        {/* Upload area */}
        <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center mb-5">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Selecione o arquivo XML do WordPress
          </p>
          <label>
            <Button variant="outline" className="border-border cursor-pointer" asChild>
              <span>
                <FileText className="w-4 h-4 mr-2" />
                Escolher Arquivo XML
              </span>
            </Button>
            <input
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <p className="text-xs text-muted-foreground mt-2">
              Arquivo: <strong className="text-foreground">{file.name}</strong>
            </p>
          )}
        </div>

        {/* Parsing state */}
        {parsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando arquivo...
          </div>
        )}

        {/* Parsed preview */}
        {parsed && !result && (
          <div className="bg-card border border-border rounded-lg p-5 mb-5">
            <h3 className="font-semibold text-foreground mb-4">Resumo da Importação</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{parsed.posts.length}</div>
                <div className="text-xs text-muted-foreground">Artigos</div>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{parsed.categories.length}</div>
                <div className="text-xs text-muted-foreground">Categorias</div>
              </div>
            </div>

            {parsed.categories.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Categorias encontradas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.categories.map((cat) => (
                    <span key={cat.slug} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Primeiros artigos:</p>
              <ul className="space-y-1">
                {parsed.posts.slice(0, 5).map((post, i) => (
                  <li key={i} className="text-xs text-foreground/80 truncate">
                    • {post.title}
                  </li>
                ))}
                {parsed.posts.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    ... e mais {parsed.posts.length - 5} artigos
                  </li>
                )}
              </ul>
            </div>

            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando... (pode levar alguns minutos)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-card border border-green-500/30 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-foreground">Importação Concluída!</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{result.inserted}</strong> de{" "}
              <strong className="text-foreground">{result.total}</strong> artigos foram importados com sucesso.
            </p>
            {result.inserted < result.total && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {result.total - result.inserted} artigos não foram importados (possíveis duplicatas ou erros).
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
