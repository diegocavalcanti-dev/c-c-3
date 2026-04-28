import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ChangeEvent,
} from "react";
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
  RefreshCw,
  Clock3,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PenSquare,
  Copy,
  ExternalLink,
} from "lucide-react";

type PostStatus = "draft" | "published" | "archived";

type EditorSnapshotInput = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: PostStatus;
  author: string;
  publishedAt: string;
  selectedCategoryIds: number[];
};

type LocalDraftPayload = EditorSnapshotInput & {
  slugManuallyEdited: boolean;
  savedAt: string;
};

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

function buildSnapshot(input: EditorSnapshotInput) {
  return JSON.stringify({
    title: input.title,
    slug: input.slug,
    content: input.content,
    excerpt: input.excerpt,
    featuredImage: input.featuredImage,
    status: input.status,
    author: input.author,
    publishedAt: input.publishedAt,
    selectedCategoryIds: [...input.selectedCategoryIds].sort((a, b) => a - b),
  });
}

function formatPublishedAtForInput(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatNowForInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getSeoScoreState(length: number, min: number, idealMax: number, hardMax: number) {
  if (length === 0) {
    return {
      label: "vazio",
      className: "text-muted-foreground",
    };
  }

  if (length < min) {
    return {
      label: "curto",
      className: "text-amber-600",
    };
  }

  if (length <= idealMax) {
    return {
      label: "bom",
      className: "text-emerald-600",
    };
  }

  if (length <= hardMax) {
    return {
      label: "alto",
      className: "text-amber-600",
    };
  }

  return {
    label: "longo",
    className: "text-destructive",
  };
}

async function copyToClipboard(text: string, successMessage: string) {
  if (!text) {
    toast.error("Nada para copiar.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

export default function AdminPostEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const isEditing = Boolean(id);
  const postId = id ? parseInt(id, 10) : undefined;
  const localDraftKey = `cms-post-editor:${postId ?? "new"}`;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [author, setAuthor] = useState("Cenas de Combate");
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState<Date | null>(null);
  const [hasRestoredLocalDraft, setHasRestoredLocalDraft] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const initialSnapshotRef = useRef("");
  const pendingSaveSnapshotRef = useRef("");
  const hasInitializedEditorRef = useRef(false);

  const utils = trpc.useUtils();

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: authors } = trpc.authors.list.useQuery();

  const { data: existingPost, isLoading: loadingPost } = trpc.cms.getPost.useQuery(
    { id: postId! },
    {
      enabled: isEditing && !!postId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  const plainTextContent = useMemo(() => stripHtml(content), [content]);
  const wordCount = useMemo(
    () => plainTextContent.split(/\s+/).filter(Boolean).length,
    [plainTextContent],
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
    [title, slug, content, excerpt, featuredImage, selectedCategoryIds],
  );

  const publishChecks = useMemo(
    () => [
      { ok: title.trim().length >= 8, label: "Título com pelo menos 8 caracteres" },
      { ok: slug.trim().length >= 3, label: "Slug configurado" },
      {
        ok: plainTextContent.length >= 300,
        label: "Conteúdo com pelo menos 300 caracteres",
      },
      { ok: excerpt.trim().length >= 60, label: "Resumo preenchido" },
      {
        ok: selectedCategoryIds.length > 0,
        label: "Ao menos 1 categoria selecionada",
      },
    ],
    [title, slug, plainTextContent, excerpt, selectedCategoryIds],
  );

  const publishReady = publishChecks.every((item) => item.ok);

  const currentSnapshot = useMemo(
    () =>
      buildSnapshot({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        author,
        publishedAt,
        selectedCategoryIds,
      }),
    [
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status,
      author,
      publishedAt,
      selectedCategoryIds,
    ],
  );

  const hasUnsavedChanges = currentSnapshot !== initialSnapshotRef.current;
  const statusMeta = getStatusMeta(status);

  const titleSeoState = useMemo(
    () => getSeoScoreState(title.trim().length, 30, 65, 90),
    [title],
  );
  const excerptSeoState = useMemo(
    () => getSeoScoreState(excerpt.trim().length, 100, 160, 220),
    [excerpt],
  );
  const slugSeoState = useMemo(
    () => getSeoScoreState(slug.trim().length, 10, 75, 110),
    [slug],
  );

  const isFuturePublication = useMemo(() => {
    if (!publishedAt) return false;
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
  }, [publishedAt]);

  const publicationLabel = useMemo(() => {
    if (!publishedAt) return "Sem data definida";
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) return "Data inválida";

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }, [publishedAt]);

  const publicArticleUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const normalizedSlug = slugify(slug.trim());
    if (!normalizedSlug) return "";
    return `${window.location.origin}/${normalizedSlug}`;
  }, [slug]);

  const flushLocalDraft = useCallback(() => {
    const payload: LocalDraftPayload = {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status,
      author,
      publishedAt,
      selectedCategoryIds,
      slugManuallyEdited,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(localDraftKey, JSON.stringify(payload));
    setLastLocalSaveAt(new Date());
  }, [
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    status,
    author,
    publishedAt,
    selectedCategoryIds,
    slugManuallyEdited,
    localDraftKey,
  ]);

  useEffect(() => {
    hasInitializedEditorRef.current = false;
    setHasRestoredLocalDraft(false);
  }, [postId]);

  useEffect(() => {
    if (loadingPost) return;
    if (hasInitializedEditorRef.current) return;

    const applyState = (data: {
      title: string;
      slug: string;
      content: string;
      excerpt: string;
      featuredImage: string;
      status: PostStatus;
      author: string;
      publishedAt: string;
      selectedCategoryIds: number[];
      slugManuallyEdited?: boolean;
    }) => {
      setTitle(data.title);
      setSlug(data.slug);
      setContent(data.content);
      setExcerpt(data.excerpt);
      setFeaturedImage(data.featuredImage);
      setStatus(data.status);
      setAuthor(data.author);
      setPublishedAt(data.publishedAt);
      setSelectedCategoryIds(data.selectedCategoryIds);
      setSlugManuallyEdited(Boolean(data.slugManuallyEdited ?? true));

      initialSnapshotRef.current = buildSnapshot({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: data.status,
        author: data.author,
        publishedAt: data.publishedAt,
        selectedCategoryIds: data.selectedCategoryIds,
      });

      setHasRestoredLocalDraft(true);
      hasInitializedEditorRef.current = true;
    };

    const saved = localStorage.getItem(localDraftKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<LocalDraftPayload>;

        applyState({
          title: parsed.title || "",
          slug: parsed.slug || "",
          content: parsed.content || "",
          excerpt: parsed.excerpt || "",
          featuredImage: parsed.featuredImage || "",
          status: (parsed.status as PostStatus) || "draft",
          author: parsed.author || "Cenas de Combate",
          publishedAt: parsed.publishedAt || "",
          selectedCategoryIds: parsed.selectedCategoryIds || [],
          slugManuallyEdited: Boolean(parsed.slugManuallyEdited),
        });

        toast.success("Rascunho local restaurado.");
        return;
      } catch {
        localStorage.removeItem(localDraftKey);
      }
    }

    if (existingPost) {
      applyState({
        title: existingPost.title || "",
        slug: existingPost.slug || "",
        content: existingPost.content || "",
        excerpt: existingPost.excerpt || "",
        featuredImage: existingPost.featuredImage || "",
        status: (existingPost.status as PostStatus) || "draft",
        author: existingPost.author || "Cenas de Combate",
        publishedAt: formatPublishedAtForInput(existingPost.publishedAt),
        selectedCategoryIds: existingPost.categories?.map((c: any) => c.id) || [],
        slugManuallyEdited: true,
      });

      return;
    }

    if (!isEditing) {
      setHasRestoredLocalDraft(true);
      hasInitializedEditorRef.current = true;
    }
  }, [loadingPost, existingPost, localDraftKey, isEditing]);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  useEffect(() => {
    if (!hasRestoredLocalDraft && !existingPost) return;

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      flushLocalDraft();
    }, 900);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [flushLocalDraft, existingPost, hasRestoredLocalDraft]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushLocalDraft();
      }
    };

    const onPageHide = () => {
      flushLocalDraft();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushLocalDraft]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;

      flushLocalDraft();
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges, flushLocalDraft]);

  const createMutation = trpc.cms.createPost.useMutation({
    onSuccess: (data) => {
      toast.success("Artigo criado com sucesso!");
      utils.cms.listPosts.invalidate();
      utils.cms.stats.invalidate();
      localStorage.removeItem(localDraftKey);
      setLastLocalSaveAt(new Date());

      if (pendingSaveSnapshotRef.current) {
        initialSnapshotRef.current = pendingSaveSnapshotRef.current;
      }

      navigate(`/admin/posts/${data.id}/editar`);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.cms.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Artigo salvo com sucesso!");
      utils.cms.listPosts.invalidate();
      utils.cms.stats.invalidate();

      if (postId) {
        utils.cms.getPost.invalidate({ id: postId });
      }

      localStorage.removeItem(localDraftKey);
      setLastLocalSaveAt(new Date());

      if (pendingSaveSnapshotRef.current) {
        initialSnapshotRef.current = pendingSaveSnapshotRef.current;
      }
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

    const normalizedTitle = title.trim();
    const normalizedSlug = slugify(slug.trim());
    const normalizedExcerpt = excerpt.trim();
    const normalizedAuthor = author.trim();

    let publishedAtIso: string | undefined;

    if (publishedAt) {
      const localDateTime = new Date(publishedAt);
      if (!Number.isNaN(localDateTime.getTime())) {
        publishedAtIso = localDateTime.toISOString();
      }
    }

    pendingSaveSnapshotRef.current = buildSnapshot({
      title: normalizedTitle,
      slug: normalizedSlug,
      content,
      excerpt: normalizedExcerpt,
      featuredImage,
      status: finalStatus,
      author: normalizedAuthor,
      publishedAt,
      selectedCategoryIds,
    });

    setTitle(normalizedTitle);
    setSlug(normalizedSlug);
    setExcerpt(normalizedExcerpt);
    setAuthor(normalizedAuthor);
    setStatus(finalStatus);

    const data = {
      title: normalizedTitle,
      slug: normalizedSlug,
      content,
      excerpt: normalizedExcerpt,
      status: finalStatus,
      author: normalizedAuthor,
      authorId: authorId,
      categoryIds: selectedCategoryIds,
      publishedAt: publishedAtIso,
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

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
          const result = ev.target?.result as string;
          const base64 = result.split(",")[1];

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

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
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

  const handleSetPublishedNow = () => {
    setPublishedAt(formatNowForInput());
    toast.success("Data e horário definidos para agora.");
  };

  const handleClearPublicationDate = () => {
    setPublishedAt("");
    toast.success("Data e horário removidos.");
  };

  const handleCopyHtml = async () => {
    await copyToClipboard(content, "HTML copiado.");
  };

  const handleCopyPlainText = async () => {
    await copyToClipboard(plainTextContent, "Texto copiado.");
  };

  const handleCopyPublicLink = async () => {
    await copyToClipboard(publicArticleUrl, "Link copiado.");
  };

  const handleOpenPublicLink = () => {
    if (!publicArticleUrl) {
      toast.error("Defina um slug antes de abrir o artigo.");
      return;
    }

    window.open(publicArticleUrl, "_blank", "noopener,noreferrer");
  };

  const handleInsertH2 = () => {
    setContent((prev) => `${prev || ""}<h2>Novo subtítulo</h2><p></p>`);
    toast.success("Subtítulo H2 inserido.");
  };

  const handleInsertParagraph = () => {
    setContent((prev) => `${prev || ""}<p>Novo parágrafo</p>`);
    toast.success("Parágrafo inserido.");
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
  }, [
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    status,
    author,
    publishedAt,
    selectedCategoryIds,
    publishReady,
  ]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingPost && !hasInitializedEditorRef.current) {
    return (
      <AdminLayoutPro>
        <div className="space-y-4">
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      </AdminLayoutPro>
    );
  }

  return (
    <AdminLayoutPro>
      <div className="space-y-6">
        <div className="sticky top-0 z-20 -mx-2 border-b bg-background/90 px-2 py-3 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link href="/admin/posts">
                <Button variant="ghost" className="rounded-xl px-0 hover:bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para artigos
                </Button>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusMeta.className}>{statusMeta.label}</Badge>

                {isFuturePublication && (
                  <Badge variant="outline" className="border-sky-500/30 text-sky-600">
                    Horário futuro definido
                  </Badge>
                )}

                {hasUnsavedChanges ? (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                    <AlertCircle className="mr-1 h-3.5 w-3.5" />
                    Alterações não salvas
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Tudo salvo
                  </Badge>
                )}

                {lastLocalSaveAt && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                    Autosave{" "}
                    {lastLocalSaveAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isEditing ? "Editor avançado de artigo" : "Criação de novo artigo"}
                </h1>
                <p className="text-muted-foreground">
                  Escreva, revise, valide e publique com mais velocidade.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPreviewMode((prev) => !prev)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewMode ? "Voltar para edição" : "Preview"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={handleCopyHtml}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar HTML
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar rascunho
              </Button>

              <Button
                type="button"
                className="rounded-xl"
                onClick={() => handleSave("published")}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <PenSquare className="mr-2 h-4 w-4" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Palavras
            </div>
            <div className="mt-2 text-2xl font-bold">{wordCount}</div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Caracteres
            </div>
            <div className="mt-2 text-2xl font-bold">{charCount}</div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Leitura
            </div>
            <div className="mt-2 text-2xl font-bold">{readTime} min</div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Qualidade
            </div>
            <div className="mt-2 text-2xl font-bold">{completionScore}%</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite um título forte e claro..."
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="slug-do-artigo"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={handleResetSlug}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerar
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleInsertH2}
                >
                  Inserir H2
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleInsertParagraph}
                >
                  Inserir parágrafo
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleGenerateExcerpt}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar resumo
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleCopyPlainText}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar texto
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo</Label>

                {previewMode ? (
                  <div className="rounded-2xl border bg-background p-5">
                    <div
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: content || "<p></p>" }}
                    />
                  </div>
                ) : (
                  <TipTapEditor value={content} onChange={setContent} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="excerpt">Resumo</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={handleGenerateExcerpt}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar automático
                  </Button>
                </div>

                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={5}
                  placeholder="Resumo curto para SEO, cards e compartilhamento..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Publicação</h2>
                <Badge variant="outline">{publicationLabel}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PostStatus)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>

                <Select value={authorId?.toString() || "default"} onValueChange={(val) => {
                  if (val === "default") {
                    setAuthorId(null);
                    setAuthor("Cenas de Combate");
                  } else {
                    const id = parseInt(val);
                    setAuthorId(id);
                    const selectedAuthor = authors?.find(a => a.id === id);
                    if (selectedAuthor) setAuthor(selectedAuthor.name);
                  }
                }}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um autor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (Cenas de Combate)</SelectItem>
                    {authors?.map((author) => (
                      <SelectItem key={author.id} value={author.id.toString()}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Ou use o campo abaixo para autor customizado</p>
                <Input
                  id="author-custom"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Autor customizado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishedAt">Data e hora de publicação</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="rounded-xl"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleSetPublishedNow}
                  >
                    Definir agora
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleClearPublicationDate}
                  >
                    Limpar data
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Rascunho
                </Button>
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => handleSave("published")}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <h2 className="font-semibold">Checklist de publicação</h2>

                <div className="space-y-2">
                  {publishChecks.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${item.ok
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        }`}
                    >
                      {item.ok ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featuredImage">Imagem destacada</Label>
                <Input
                  id="featuredImage"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl"
                />

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Enviando..." : "Upload"}
                  </Button>

                  {featuredImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-destructive"
                      onClick={() => setFeaturedImage("")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>

                {featuredImage && (
                  <div className="overflow-hidden rounded-2xl border bg-background">
                    <img
                      src={featuredImage}
                      alt="Prévia da imagem destacada"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Categorias</h2>
                <Badge variant="outline">{selectedCategoryIds.length} selecionada(s)</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {(categories || []).map((category: any) => {
                  const active = selectedCategoryIds.includes(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                        }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Link do artigo</h2>
                <Badge variant="outline">{slug ? "pronto" : "pendente"}</Badge>
              </div>

              <div className="rounded-xl border bg-background px-3 py-3 text-sm text-muted-foreground break-all">
                {publicArticleUrl || "Defina um slug para gerar o link público."}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleCopyPublicLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleOpenPublicLink}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">SEO rápido</h2>
                <Badge variant="outline">{completionScore}%</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span>Título</span>
                    <span className={titleSeoState.className}>
                      {title.trim().length} • {titleSeoState.label}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span>Resumo</span>
                    <span className={excerptSeoState.className}>
                      {excerpt.trim().length} • {excerptSeoState.label}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span>Slug</span>
                    <span className={slugSeoState.className}>
                      {slug.trim().length} • {slugSeoState.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Prévia de busca
                </div>
                <div className="mt-3 space-y-1">
                  <div className="line-clamp-2 text-[20px] font-semibold leading-6 text-blue-600">
                    {title.trim() || "Título do artigo"}
                  </div>
                  <div className="text-sm text-emerald-700 break-all">
                    {publicArticleUrl || "https://www.seusite.com/slug-do-artigo"}
                  </div>
                  <div className="line-clamp-3 text-sm text-muted-foreground">
                    {excerpt.trim() || "Resumo do artigo para aparecer em mecanismos de busca."}
                  </div>
                </div>
              </div>
            </div>



            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <h2 className="font-semibold">Ações locais</h2>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={flushLocalDraft}
              >
                <Save className="mr-2 h-4 w-4" />
                Forçar autosave local
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleCopyPlainText}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar texto limpo
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl text-destructive"
                onClick={handleClearLocalDraft}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar rascunho local
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutPro>
  );
}