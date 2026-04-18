import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Eye, ChevronRight, Home } from "lucide-react";
import AdBanner from "@/components/AdBanner";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = trpc.posts.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: latestPosts } = trpc.posts.getLatest.useQuery({ limit: 6 });

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
          <h1 className="text-2xl font-bold text-foreground mb-3">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">O artigo que você procura não existe ou foi removido.</p>
          <Link href="/" className="text-primary hover:underline">Voltar ao início</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      {/* ADSENSE */}
      <AdBanner />

      <main className="flex-1">
        <div className="container py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Início
            </Link>
            {post.categories && post.categories.length > 0 && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/categoria/${post.categories[0].slug}`} className="hover:text-primary transition-colors">
                  {post.categories[0].name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground/70 truncate max-w-xs">{post.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Article */}
            <article className="lg:col-span-3">
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map((cat) => (
                    <Link key={cat.id} href={`/categoria/${cat.slug}`}>
                      <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer">
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
                {post.title}
              </h1>

              {/* Meta */}
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
                {post.viewCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {post.viewCount.toLocaleString("pt-BR")} visualizações
                  </span>
                )}
              </div>

              {/* Featured image */}
              {post.featuredImage && (
                <div className="mb-6 rounded-lg overflow-hidden border border-border">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Content */}
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags/Categories footer */}
              {post.categories && post.categories.length > 0 && (
                <div className="mt-8 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground mr-2">Categorias:</span>
                  {post.categories.map((cat) => (
                    <Link key={cat.id} href={`/categoria/${cat.slug}`}>
                      <Badge variant="outline" className="mr-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer">
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-4 sticky top-20">
                <h3 className="font-semibold text-sm text-foreground mb-3">Artigos Recentes</h3>
                <div className="space-y-1">
                  {latestPosts?.filter(p => p.slug !== slug).slice(0, 6).map((p) => (
                    <PostCard key={p.id} post={p} variant="compact" />
                  ))}
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
