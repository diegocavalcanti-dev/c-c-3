import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  User,
  Eye,
  ChevronRight,
  Home,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import AdBanner from "@/components/AdBanner";

const DEFAULT_IMAGE = "/og-default.jpg";

const unwrapCollection = (data: any) => {
  if (Array.isArray(data?.json)) return data.json;
  if (Array.isArray(data)) return data;
  return [];
};

const unwrapItem = (data: any) => {
  if (data?.json) return data.json;
  return data;
};

const safeImage = (src?: string) =>
  typeof src === "string" && src.trim().length > 0 ? src : DEFAULT_IMAGE;

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: postData, isLoading, error } = trpc.posts.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: latestPostsData, isLoading: loadingLatest } =
    trpc.posts.getLatest.useQuery({ limit: 6 });

  const post = unwrapItem(postData);
  const latestPosts = unwrapCollection(latestPostsData);

  const categories =
    post?.categories && Array.isArray(post.categories) && post.categories.length > 0
      ? post.categories
      : post?.category
        ? [post.category]
        : [];

  const relatedPosts = latestPosts
    .filter((p: any) => p?.slug !== slug)
    .slice(0, 6);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Artigo",
          text: post?.excerpt || post?.title || "",
          url: window.location.href,
        });
        return;
      }

      await handleCopyLink();
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <Skeleton className="aspect-video w-full rounded-lg mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Artigo não encontrado
          </h1>
          <p className="text-muted-foreground mb-6">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Voltar ao início
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <AdBanner />

      <main className="flex-1">
        <div className="container py-6 px-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 overflow-hidden">
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
            >
              <Home className="w-3 h-3" /> Início
            </Link>

            {categories.length > 0 && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <Link
                  href={`/categoria/${categories[0].slug}`}
                  className="hover:text-primary transition-colors truncate"
                >
                  {categories[0].name}
                </Link>
              </>
            )}

            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-foreground/70 truncate max-w-xs">
              {post.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <article className="lg:col-span-3 min-w-0">
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map((cat: any) => (
                    <Link key={cat.id || cat.slug} href={`/categoria/${cat.slug}`}>
                      <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer">
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5 pb-4 border-b border-border">
                {publishedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {publishedDate}
                  </span>
                )}

                {post.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                )}

                {/* {post.viewCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {post.viewCount.toLocaleString("pt-BR")} visualizações
                  </span>
                )} */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShare}
                    className="rounded-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="rounded-full"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? "Link copiado" : "Copiar link"}
                  </Button>
                </div>
              </div>



              {post.featuredImage && (
                <div className="mb-6 rounded-xl overflow-hidden border border-border">
                  <img
                    src={safeImage(post.featuredImage)}
                    alt={post.title}
                    className="w-full h-auto max-h-[520px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
              )}

              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />

              <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-2">
                      Continue explorando
                    </p>
                    <h3 className="text-2xl font-black tracking-tight">
                      Mais conteúdo do Cenas de Combate
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat: any) => (
                      <Link key={cat.id || cat.slug} href={`/categoria/${cat.slug}`}>
                        <Badge
                          variant="outline"
                          className="rounded-full px-3 py-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                        >
                          {cat.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {relatedPosts.length > 0 && (
                <div className="mt-10">
                  <div className="mb-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-2">
                      Recomendados
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                      Continue lendo
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {relatedPosts.slice(0, 3).map((p: any) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}
            </article>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-2">
                      Agora no portal
                    </p>
                    <h3 className="text-lg font-black tracking-tight">
                      Artigos recentes
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {loadingLatest ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                      ))
                    ) : (
                      relatedPosts.slice(0, 5).map((p: any) => (
                        <PostCard key={p.id} post={p} variant="compact" />
                      ))
                    )}
                  </div>
                </div>

                <AdBanner />

                <div className="rounded-3xl border border-border bg-zinc-900 text-white p-6 shadow-sm overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)]" />
                  <div className="relative z-10">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-3">
                      Cenas de Combate
                    </p>
                    <h3 className="text-2xl font-black tracking-tight mb-3">
                      Apoie o portal
                    </h3>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                      Ajude a manter vivo um espaço dedicado à história militar,
                      geopolítica, aviação e tecnologia de defesa.
                    </p>
                    <a
                      href="https://www.facebook.com/cenas.decombate/subscribe/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.14em] text-xs">
                        Apoiar nosso trabalho
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}