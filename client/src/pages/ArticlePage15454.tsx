import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CalendarDays,
    User,
    Eye,
    ChevronRight,
    Home,
    Clock3,
    Share2,
    Copy,
    Shield,
    ArrowLeft,
} from "lucide-react";

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

const stripHtml = (html?: string) =>
    String(html || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatLongDate = (date?: string) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const estimateReadingTime = (content?: string, excerpt?: string) => {
    const text = `${stripHtml(content)} ${stripHtml(excerpt)}`.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return minutes;
};

export default function ArticlePage() {
    const { slug } = useParams<{ slug: string }>();

    const { data: postData, isLoading, error } = trpc.posts.getBySlug.useQuery(
        { slug: slug || "" },
        { enabled: !!slug }
    );

    const { data: latestPostsData, isLoading: loadingLatest } =
        trpc.posts.getLatest.useQuery({ limit: 8 });

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

    const publishedDate = formatLongDate(post?.publishedAt);
    const readingTime = useMemo(
        () => estimateReadingTime(post?.content, post?.excerpt),
        [post?.content, post?.excerpt]
    );

    const [copied, setCopied] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const documentHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const progress =
                documentHeight > 0 ? Math.min((scrollTop / documentHeight) * 100, 100) : 0;
            setReadingProgress(progress);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2200);
        } catch {
            setCopied(false);
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
        } catch {
            // silêncio intencional
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <SiteHeader />
                <main className="flex-1">
                    <div className="container px-4 py-8">
                        <div className="max-w-6xl mx-auto">
                            <Skeleton className="h-5 w-64 mb-6 rounded-full" />
                            <Skeleton className="h-16 w-full max-w-4xl mb-4 rounded-2xl" />
                            <Skeleton className="h-6 w-full max-w-2xl mb-8 rounded-xl" />
                            <Skeleton className="aspect-[16/9] w-full rounded-3xl mb-8" />
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                <div className="xl:col-span-8 space-y-4">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <Skeleton key={i} className="h-5 w-full rounded-lg" />
                                    ))}
                                </div>
                                <div className="xl:col-span-4 space-y-4">
                                    <Skeleton className="h-48 w-full rounded-3xl" />
                                    <Skeleton className="h-64 w-full rounded-3xl" />
                                </div>
                            </div>
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
                <main className="flex-1">
                    <div className="container px-4 py-20">
                        <div className="max-w-2xl mx-auto text-center rounded-3xl border border-border bg-card p-10 shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-5 flex items-center justify-center">
                                <Shield className="w-6 h-6" />
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-foreground mb-3">
                                Artigo não encontrado
                            </h1>

                            <p className="text-muted-foreground mb-8">
                                O conteúdo que você procura não existe, foi removido ou está com o link incorreto.
                            </p>

                            <Link href="/">
                                <Button className="rounded-2xl font-black uppercase tracking-[0.15em]">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar ao início
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <div className="fixed top-0 left-0 z-[60] h-1 bg-primary transition-all duration-150"
                style={{ width: `${readingProgress}%` }}
            />

            <SiteHeader />

            <main className="flex-1">
                <div className="container px-4 pt-6 pb-16">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-hidden">
                        <Link
                            href="/"
                            className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                        >
                            <Home className="w-3 h-3" />
                            Início
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
                        <span className="truncate text-foreground/70">{post.title}</span>
                    </nav>

                    {/* Header premium */}
                    <section className="max-w-7xl mx-auto mb-8">
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="p-6 md:p-10">
                                {categories.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {categories.map((cat: any) => (
                                            <Link key={cat.id || cat.slug} href={`/categoria/${cat.slug}`}>
                                                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 cursor-pointer rounded-full px-3 py-1.5">
                                                    {cat.name}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] text-foreground max-w-5xl">
                                    {post.title}
                                </h1>

                                {post.excerpt && (
                                    <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-4xl mt-5">
                                        {post.excerpt}
                                    </p>
                                )}

                                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {publishedDate && (
                                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground font-black mb-2">
                                                <CalendarDays className="w-4 h-4" />
                                                Publicação
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{publishedDate}</p>
                                        </div>
                                    )}

                                    {post.author && (
                                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground font-black mb-2">
                                                <User className="w-4 h-4" />
                                                Autor
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">{post.author}</p>
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground font-black mb-2">
                                            <Clock3 className="w-4 h-4" />
                                            Leitura
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {readingTime} min
                                        </p>
                                    </div>

                                    {post.viewCount > 0 && (
                                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground font-black mb-2">
                                                <Eye className="w-4 h-4" />
                                                Visualizações
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {post.viewCount.toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleShare}
                                        variant="default"
                                        className="rounded-2xl font-black uppercase tracking-[0.14em] text-xs"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Compartilhar
                                    </Button>

                                    <Button
                                        onClick={handleCopyLink}
                                        variant="outline"
                                        className="rounded-2xl font-black uppercase tracking-[0.14em] text-xs"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        {copied ? "Link copiado" : "Copiar link"}
                                    </Button>

                                    {categories[0] && (
                                        <Link href={`/categoria/${categories[0].slug}`}>
                                            <Button
                                                variant="ghost"
                                                className="rounded-2xl font-black uppercase tracking-[0.14em] text-xs"
                                            >
                                                Ver mais da editoria
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {post.featuredImage && (
                                <div className="border-t border-border">
                                    <img
                                        src={safeImage(post.featuredImage)}
                                        alt={post.title}
                                        className="w-full h-auto max-h-[620px] object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    <AdBanner />

                    {/* Conteúdo + Sidebar */}
                    <section className="max-w-7xl mx-auto mt-8">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            {/* Conteúdo */}
                            <article className="xl:col-span-8">
                                <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm">
                                    <div
                                        className="article-content max-w-none"
                                        dangerouslySetInnerHTML={{ __html: post.content || "" }}
                                    />
                                </div>

                                {/* Footer do artigo */}
                                <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
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

                                {/* Relacionados */}
                                {relatedPosts.length > 0 && (
                                    <div className="mt-10">
                                        <div className="flex items-center justify-between gap-4 mb-6">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-2">
                                                    Recomendados
                                                </p>
                                                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                                                    Continue lendo
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {relatedPosts.slice(0, 3).map((p: any) => (
                                                <PostCard key={p.id} post={p} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </article>

                            {/* Sidebar */}
                            <aside className="xl:col-span-4">
                                <div className="sticky top-24 space-y-6">

                                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-black mb-2">
                                                    Agora no portal
                                                </p>
                                                <h3 className="text-lg font-black tracking-tight">
                                                    Artigos recentes
                                                </h3>
                                            </div>
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
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}