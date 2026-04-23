import { ReactNode } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Home } from "lucide-react";

type InstitutionalPageLayoutProps = {
    title: string;
    eyebrow?: string;
    description?: string;
    updatedAt?: string;
    breadcrumbLabel: string;
    children: ReactNode;
};

const unwrapCollection = (data: any) => {
    if (Array.isArray(data?.json)) return data.json;
    if (Array.isArray(data)) return data;
    return [];
};

export default function InstitutionalPageLayout({
    title,
    eyebrow = "Institucional",
    description,
    updatedAt,
    breadcrumbLabel,
    children,
}: InstitutionalPageLayoutProps) {
    const { data: latestPostsData, isLoading: loadingLatest } =
        trpc.posts.getLatest.useQuery({ limit: 6 });

    const latestPosts = unwrapCollection(latestPostsData);
    const recentPosts = latestPosts.slice(0, 5);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SiteHeader />
            <AdBanner />

            <main className="flex-1">
                <div className="container py-6 px-4">
                    <nav className="mb-5 flex items-center gap-1.5 overflow-hidden text-xs text-muted-foreground">
                        <Link
                            href="/"
                            className="flex shrink-0 items-center gap-1 transition-colors hover:text-primary"
                        >
                            <Home className="h-3 w-3" />
                            Início
                        </Link>

                        <ChevronRight className="h-3 w-3 shrink-0" />
                        <span className="truncate text-foreground/70">{breadcrumbLabel}</span>
                    </nav>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                        <article className="lg:col-span-3 min-w-0">
                            <div className="mb-3 flex flex-wrap gap-2">
                                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                                    {eyebrow}
                                </Badge>
                            </div>

                            <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground md:text-4xl">
                                {title}
                            </h1>

                            <div className="mb-6 border-b border-border pb-4">
                                {description && (
                                    <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                                        {description}
                                    </p>
                                )}

                                {updatedAt && (
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Última atualização: {updatedAt}
                                    </p>
                                )}
                            </div>

                            <div className="article-content border-b border-border pb-2">
                                {children}
                            </div>

                            <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                            Continue explorando
                                        </p>
                                        <h3 className="text-2xl font-black tracking-tight">
                                            Mais conteúdo do Cenas de Combate
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link href="/sobre">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer rounded-full px-3 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                            >
                                                Sobre
                                            </Badge>
                                        </Link>
                                        <Link href="/contato">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer rounded-full px-3 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                            >
                                                Contato
                                            </Badge>
                                        </Link>
                                        <Link href="/politica-de-privacidade">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer rounded-full px-3 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                            >
                                                Privacidade
                                            </Badge>
                                        </Link>
                                        <Link href="/termos-de-uso">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer rounded-full px-3 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                            >
                                                Termos
                                            </Badge>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                    <div className="mb-4">
                                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
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
                                            recentPosts.map((p: any) => (
                                                <PostCard key={p.id} post={p} variant="compact" />
                                            ))
                                        )}
                                    </div>
                                </div>

                                <AdBanner />

                                <div className="relative overflow-hidden rounded-3xl border border-border bg-zinc-900 p-6 text-white shadow-sm">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)]" />
                                    <div className="relative z-10">
                                        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                            Cenas de Combate
                                        </p>
                                        <h3 className="mb-3 text-2xl font-black tracking-tight">
                                            Apoie o portal
                                        </h3>
                                        <p className="mb-5 text-sm leading-relaxed text-zinc-300">
                                            Ajude a manter vivo um espaço dedicado à história militar,
                                            geopolítica, aviação e tecnologia de defesa.
                                        </p>
                                        <a
                                            href="https://www.facebook.com/cenas.decombate/subscribe/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <Button className="w-full rounded-2xl bg-primary text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-primary/90">
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

            <AdBanner />
            <SiteFooter />
        </div>
    );
}