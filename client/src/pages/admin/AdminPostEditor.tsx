import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import AdminLayoutPro from "@/components/admin/AdminLayoutPro";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TipTapEditor from "@/components/TipTapEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Save,
  Eye,
  Upload,
  X,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Clock3,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PenSquare,
} from "lucide-react";

type PostStatus = "draft" | "published" | "archived";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 490);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function generateExcerptFromContent(content: string, maxLength = 180): string {
  const text = stripHtml(content);
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function getReadTimeMinutes(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getCompletionScore(params: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryIds: number[];
}) {
  let score = 0;

  if (params.title.trim().length >= 8) score += 20;
  if (params.slug.trim().length >= 3) score += 15;
  if (stripHtml(params.content).length >= 300) score += 30;
  if (params.excerpt.trim().length >= 60) score += 15;
  if (params.featuredImage.trim()) score += 10;
  if (params.categoryIds.length > 0) score += 10;

  return Math.min(score, 100);
}

function getStatusMeta(status: PostStatus) {
  switch (status) {
    case "published":
      return {
        label: "Publicado",
        className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
      };
    case "archived":
      return {
        label: "Arquivado",
        className: "bg-slate-500/15 text-slate-600 border-slate-500/20",
      };
    default:
      return {
        label: "Rascunho",
        className: "bg-amber-500/15 text-amber-600 border-amber-500/20",
      };
  }
}

export default function AdminPostEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const isEditing = !!id;
  const postId = id ? parseInt(id) : undefined;
  const localDraftKey = `cms-post-editor:${postId ?? "new"}`;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [author, setAuthor] = useState("Cenas de Combate");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState<Date | null>(null);
  const [hasRestoredLocalDraft, setHasRestoredLocalDraft] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const initialSnapshotRef = useRef("");

  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();

  const { data: existingPost, isLoading: loadingPost } = trpc.cms.getPost.useQuery(
    { id: postId! },
    { enabled: isEditing && !!postId }
  );

  const plainTextContent = useMemo(() => stripHtml(content), [content]);
  const wordCount = useMemo(
    () => plainTextContent.split(/\s+/).filter(Boolean).length,
    [plainTextContent]
  );
  const charCount = useMemo(() => plainTextContent.length, [plainTextContent]);
  const readTime = useMemo(() => getReadTimeMinutes(content), [content]);
  const completionScore = useMemo(
    () =>
      getCompletionScore({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        categoryIds: selectedCategoryIds,
      }),
    [title, slug, content, excerpt, featuredImage, selectedCategoryIds]
  );

  const publishChecks = useMemo(
    () => [
      { ok: title.trim().length >= 8, label: "Título com pelo menos 8 caracteres" },
      { ok: slug.trim().length >= 3, label: "Slug configurado" },
      { ok: plainTextContent.length >= 300, label: "Conteúdo com pelo menos 300 caracteres" },
      { ok: excerpt.trim().length >= 60, label: "Resumo preenchido" },
      { ok: selectedCategoryIds.length > 0, label: "Ao menos 1 categoria selecionada" },
    ],
    [title, slug, plainTextContent, excerpt, selectedCategoryIds]
  );

  const publishReady = publishChecks.every((item) => item.ok);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        author,
        selectedCategoryIds: [...selectedCategoryIds].sort((a, b) => a - b),
      }),
    [title, slug, content, excerpt, featuredImage, status, author, selectedCategoryIds]
  );

  const hasUnsavedChanges = currentSnapshot !== initialSnapshotRef.current;
  const statusMeta = getStatusMeta(status);

  useEffect(() => {
    if (existingPost) {
      const nextTitle = existingPost.title || "";
      const nextSlug = existingPost.slug || "";
      const nextContent = existingPost.content || "";
      const nextExcerpt = existingPost.excerpt || "";
      const nextFeaturedImage = existingPost.featuredImage || "";
      const nextStatus = (existingPost.status as PostStatus) || "draft";
      const nextAuthor = existingPost.author || "Cenas de Combate";
      const nextCategoryIds = existingPost.categories?.map((c) => c.id) || [];

      setTitle(nextTitle);
      setSlug(nextSlug);
      setContent(nextContent);
      setExcerpt(nextExcerpt);
      setFeaturedImage(nextFeaturedImage);
      setStatus(nextStatus);
      setAuthor(nextAuthor);
      setSelectedCategoryIds(nextCategoryIds);
      setSlugManuallyEdited(true);

      initialSnapshotRef.current = JSON.stringify({
        title: nextTitle,
        slug: nextSlug,
        content: nextContent,
        excerpt: nextExcerpt,
        featuredImage: nextFeaturedImage,
        status: nextStatus,
        author: nextAuthor,
        selectedCategoryIds: [...nextCategoryIds].sort((a, b) => a - b),
      });
    }
  }, [existingPost]);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  useEffect(() => {
    if (loadingPost) return;
    if (existingPost) return;
    if (hasRestoredLocalDraft) return;

    const saved = localStorage.getItem(localDraftKey);
    if (!saved) {
      setHasRestoredLocalDraft(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setTitle(parsed.title || "");
      setSlug(parsed.slug || "");
      setContent(parsed.content || "");
      setExcerpt(parsed.excerpt || "");
      setFeaturedImage(parsed.featuredImage || "");
      setStatus(parsed.status || "draft");
      setAuthor(parsed.author || "Cenas de Combate");
      setSelectedCategoryIds(parsed.selectedCategoryIds || []);
      setSlugManuallyEdited(Boolean(parsed.slugManuallyEdited));

      initialSnapshotRef.current = JSON.stringify({
        title: parsed.title || "",
        slug: parsed.slug || "",
        content: parsed.content || "",
        excerpt: parsed.excerpt || "",
        featuredImage: parsed.featuredImage || "",
        status: parsed.status || "draft",
        author: parsed.author || "Cenas de Combate",
        selectedCategoryIds: [...(parsed.selectedCategoryIds || [])].sort((a: number, b: number) => a - b),
      });

      toast.success("Rascunho local restaurado.");
    } catch {
      localStorage.removeItem(localDraftKey);
    } finally {
      setHasRestoredLocalDraft(true);
    }
  }, [existingPost, hasRestoredLocalDraft, loadingPost, localDraftKey]);

  useEffect(() => {
    if (!hasRestoredLocalDraft && !existingPost) return;
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      const payload = {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        author,
        selectedCategoryIds,
        slugManuallyEdited,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(localDraftKey, JSON.stringify(payload));
      setLastLocalSaveAt(new Date());
    }, 900);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    status,
    author,
    selectedCategoryIds,
    slugManuallyEdited,
    localDraftKey,
    existingPost,
    hasRestoredLocalDraft,
  ]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  const createMutation = trpc.cms.createPost.useMutation({
    onSuccess: (data) => {
      toast.success("Artigo criado com sucesso!");
      utils.cms.listPosts.invalidate();
      utils.cms.stats.invalidate();
      localStorage.removeItem(localDraftKey);

      initialSnapshotRef.current = JSON.stringify({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        author,
        selectedCategoryIds: [...selectedCategoryIds].sort((a, b) => a - b),
      });

      navigate(`/admin/posts/${data.id}/editar`);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.cms.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Artigo salvo com sucesso!");
      utils.cms.listPosts.invalidate();
      if (postId) utils.cms.getPost.invalidate({ id: postId });
      localStorage.removeItem(localDraftKey);

      initialSnapshotRef.current = JSON.stringify({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        author,
        selectedCategoryIds: [...selectedCategoryIds].sort((a, b) => a - b),
      });
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const uploadMutation = trpc.cms.uploadImage.useMutation({
    onSuccess: (data) => {
      setFeaturedImage(data.url);
      toast.success("Imagem enviada com sucesso!");
    },
    onError: () => toast.error("Erro ao enviar imagem."),
  });

  const validateBeforeSave = (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Informe um título para o artigo.");
      return false;
    }

    if (!slug.trim()) {
      toast.error("Informe um slug válido.");
      return false;
    }

    if (!plainTextContent.trim()) {
      toast.error("O conteúdo do artigo está vazio.");
      return false;
    }

    if (targetStatus === "published" && !publishReady) {
      toast.error("Preencha os itens mínimos antes de publicar.");
      return false;
    }

    return true;
  };

  const handleSave = (saveStatus?: "draft" | "published") => {
    const finalStatus = saveStatus || status;

    if (!validateBeforeSave(finalStatus)) return;

    const data = {
      title: title.trim(),
      slug: slugify(slug.trim()),
      content,
      excerpt: excerpt.trim(),
      status: finalStatus,
      author: author.trim(),
      categoryIds: selectedCategoryIds,
    };

    if (isEditing && postId) {
      updateMutation.mutate({
        id: postId,
        ...data,
        featuredImage: featuredImage.trim() || null,
      });
    } else {
      createMutation.mutate({
        ...data,
        featuredImage: featuredImage.trim() || undefined,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();

      reader.onload = async (ev) => {
        try {
          const base64 = (ev.target?.result as string).split(",")[1];

          await uploadMutation.mutateAsync({
            filename: file.name,
            contentType: file.type,
            dataBase64: base64,
          });
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Falha ao processar a imagem.");
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerateExcerpt = () => {
    const generated = generateExcerptFromContent(content, 180);
    if (!generated) {
      toast.error("Não há conteúdo suficiente para gerar um resumo.");
      return;
    }
    setExcerpt(generated);
    toast.success("Resumo gerado automaticamente.");
  };

  const handleResetSlug = () => {
    const nextSlug = slugify(title);
    setSlug(nextSlug);
    setSlugManuallyEdited(false);
    toast.success("Slug regenerado a partir do título.");
  };

  const handleClearLocalDraft = () => {
    localStorage.removeItem(localDraftKey);
    setLastLocalSaveAt(null);
    toast.success("Rascunho local removido.");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave("draft");
      }

      if (mod && e.key === "Enter") {
        e.preventDefault();
        handleSave("published");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [title, slug, content, excerpt, featuredImage, status, author, selectedCategoryIds, publishReady]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingPost) {
    return (
      <AdminLayoutPro title="Editar Artigo">
        <div className="space-y-4 max-w-6xl">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Skeleton className="h-[520px] w-full lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-[520px] w-full rounded-2xl" />
          </div>
        </div>
      </AdminLayoutPro>
    );
  }

  return (
    <AdminLayoutPro title={isEditing ? "Editar Artigo" : "Novo Artigo"}>
      <div className="max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div className="space-y-3">
              <Link href="/admin/posts">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Voltar para artigos
                </Button>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`border ${statusMeta.className}`}>{statusMeta.label}</Badge>

                {hasUnsavedChanges ? (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                    Alterações não salvas
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                    Tudo salvo
                  </Badge>
                )}

                {lastLocalSaveAt && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Autosave {lastLocalSaveAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isEditing ? "Editor avançado de artigo" : "Criação de novo artigo"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escreva, revise, valide e publique com mais velocidade.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode((prev) => !prev)}
                className="rounded-xl"
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {previewMode ? "Voltar para edição" : "Preview"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateExcerpt}
                className="rounded-xl"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Gerar resumo
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
                className="rounded-xl"
              >
                <Save className="mr-1.5 h-4 w-4" />
                Salvar rascunho
              </Button>

              <Button
                size="sm"
                onClick={() => handleSave("published")}
                disabled={isSaving}
                className="rounded-xl"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {isSaving ? "Salvando..." : "Publicar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/60 bg-muted/20 p-4 lg:grid-cols-4 lg:p-5">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Palavras</span>
              </div>
              <div className="text-2xl font-semibold">{wordCount}</div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <PenSquare className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Caracteres</span>
              </div>
              <div className="text-2xl font-semibold">{charCount}</div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Leitura</span>
              </div>
              <div className="text-2xl font-semibold">{readTime} min</div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Qualidade</span>
              </div>
              <div className="text-2xl font-semibold">{completionScore}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Título
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite um título forte e claro..."
                    className="h-14 rounded-2xl border-border/70 bg-background text-lg font-semibold"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Slug / URL
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={handleResetSlug}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Regenerar
                    </Button>
                  </div>

                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="url-do-artigo"
                    className="rounded-2xl border-border/70 bg-background font-mono text-sm"
                  />

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>/noticias/{slugify(slug || title || "seu-artigo")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Conteúdo</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atalhos: Ctrl/Cmd + S para salvar, Ctrl/Cmd + Enter para publicar.
                  </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  {previewMode ? "Modo preview" : "Modo edição"}
                </Badge>
              </div>

              {previewMode ? (
                <div className="min-h-[480px] rounded-2xl border border-border/70 bg-background p-6">
                  <article className="prose prose-sm max-w-none dark:prose-invert">
                    {featuredImage && (
                      <img
                        src={featuredImage}
                        alt={title || "Imagem destaque"}
                        className="mb-6 h-64 w-full rounded-2xl object-cover"
                      />
                    )}

                    <h1>{title || "Título do artigo"}</h1>

                    {excerpt && (
                      <p className="lead text-muted-foreground">
                        {excerpt}
                      </p>
                    )}

                    <div dangerouslySetInnerHTML={{ __html: content || "<p>Sem conteúdo ainda.</p>" }} />
                  </article>
                </div>
              ) : (
                <TipTapEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Escreva o conteúdo do seu artigo aqui..."
                />
              )}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use um resumo direto, útil para listagens e compartilhamento.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateExcerpt}
                  className="rounded-xl"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Gerar automático
                </Button>
              </div>

              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumo do artigo..."
                className="min-h-[120px] rounded-2xl border-border/70 bg-background text-sm resize-none"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Ideal entre 120 e 180 caracteres</span>
                <span>{excerpt.length} caracteres</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Publicação</h3>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                    <SelectTrigger className="rounded-2xl border-border/70 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border">
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Autor
                  </Label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="rounded-2xl border-border/70 bg-background text-sm"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Pronto para publicar?</span>
                    <Badge
                      variant="outline"
                      className={
                        publishReady
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-amber-500/30 text-amber-600"
                      }
                    >
                      {publishReady ? "Sim" : "Pendente"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {publishChecks.map((item) => (
                      <div key={item.label} className="flex items-start gap-2 text-sm">
                        {item.ok ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                        )}
                        <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => handleSave("draft")}
                    disabled={isSaving}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    Rascunho
                  </Button>

                  <Button
                    className="rounded-2xl"
                    onClick={() => handleSave("published")}
                    disabled={isSaving}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Imagem de destaque</h3>

              {featuredImage ? (
                <div className="relative mb-3 overflow-hidden rounded-2xl border border-border/70">
                  <img
                    src={featuredImage}
                    alt="Imagem destaque"
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/75"
                    onClick={() => setFeaturedImage("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mb-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
                  <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Adicione uma capa para o artigo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Isso melhora a apresentação no CMS e no site.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="Cole a URL da imagem..."
                  className="rounded-2xl border-border/70 bg-background text-sm"
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-2xl"
                  onClick={() => {
                    console.log(fileInputRef.current);
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  {uploading ? "Enviando..." : "Fazer upload"}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Categorias</h3>

              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => {
                  const active = selectedCategoryIds.includes(cat.id);

                  return (
                    <Badge
                      key={cat.id}
                      variant={active ? "default" : "outline"}
                      className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs transition-all ${active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-primary"
                        }`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  );
                })}
              </div>

              {!!selectedCategoryIds.length && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {selectedCategoryIds.length} categoria(s) selecionada(s)
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Produtividade</h3>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-1 text-sm font-medium">Autosave local</div>
                  <p className="text-xs text-muted-foreground">
                    O editor salva automaticamente seu progresso no navegador.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-1 text-sm font-medium">Atalhos rápidos</div>
                  <p className="text-xs text-muted-foreground">
                    Ctrl/Cmd + S salva rascunho. Ctrl/Cmd + Enter publica.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLocalDraft}
                  className="w-full rounded-2xl"
                >
                  Limpar rascunho local
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutPro>
  );
}