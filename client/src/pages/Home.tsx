import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Shield, TrendingUp } from "lucide-react";
import AdBanner from "@/components/AdBanner";

export default function Home() {
  const { data: featuredPosts, isLoading: loadingFeatured } =
    trpc.posts.getFeatured.useQuery();
  const { data: latestPosts, isLoading: loadingLatest } =
    trpc.posts.getLatest.useQuery({ limit: 18 });
  const { data: categories } = trpc.categories.list.useQuery();

  const featured = (featuredPosts as any)?.json ?? featuredPosts ?? [];
  const latest = (latestPosts as any)?.json ?? latestPosts ?? [];

  const heroPost = featured[0];
  const gridPosts = featured.slice(1, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section - Ajustado px-4 para mobile e py-8 para respiro */}
        <section className="container px-4 py-8">
          {loadingFeatured ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Skeleton className="lg:col-span-3 aspect-video rounded-lg" />
              <div className="space-y-4 lg:col-span-1">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main hero post */}
              {heroPost && (
                <Link href={`/${heroPost.slug}`} className="lg:col-span-3">
                  <article className="group cursor-pointer relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full shadow-lg">

                    {/* Proporção 4:3 no mobile e Video no desktop */}
                    <div className="aspect-[4/3] md:aspect-video md:min-h-[520px] overflow-hidden">
                      <img
                        src={heroPost.featuredImage || "https://unsplash.com"}
                        alt={heroPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Gradiente mais curto para não escurecer a foto toda */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                    {/* Conteúdo ancorado embaixo com padding menor */}
                    <div className="absolute inset-0 p-4 md:p-10 flex flex-col justify-end">
                      <Badge className="w-fit mb-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase py-0.5">
                        Destaque
                      </Badge>

                      <h1 className="text-lg md:text-4xl font-bold text-white leading-tight group-hover:text-primary transition-colors">
                        {heroPost.title}
                      </h1>

                      {heroPost.excerpt && (
                        <p className="text-xs md:text-base text-white/80 mt-1.5 line-clamp-2 leading-relaxed">
                          {heroPost.excerpt}
                        </p>
                      )}

                      <p className="text-[10px] md:text-xs text-white/50 mt-2 font-medium">
                        {heroPost.publishedAt ? new Date(heroPost.publishedAt).toLocaleDateString("pt-BR") : ""}
                      </p>
                    </div>
                  </article>
                </Link>
              )}


              {/* Side posts - Coluna lateral mais fina */}
              <div className="flex flex-col gap-4 lg:col-span-1">
                {gridPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner />

        {/* Latest articles */}
        <section className="container px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Últimas Publicações
                  </h2>
                </div>
                <Link href="/categoria/materias">
                  <Button variant="ghost" size="sm" className="text-primary text-xs">
                    Ver todas <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              {loadingLatest ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {latest.slice(0, 12).map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              <div className="mt-10 text-center">
                <Link href="/categoria/materias">
                  <Button variant="outline" className="px-8 border-primary/30 text-primary">
                    Carregar mais artigos
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar Profissional */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Widget de Apoio e Sobre (Agrupados para fazer sentido visual) */}
              <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
                <div className="p-6">
                  <div className="flex items-center jus mb-4">
                    <div className="w-14 h-14 md:w-24 md:h-24 overflow-hidden shrink-0">
                      <img
                        src="https://cenasdecombate.com/og-default.jpg"
                        alt="Logo Cenas de Combate"
                        className="block w-full h-full object-cover object-left -translate-x-3"
                      />
                    </div>
                    <h3 className="font-black text-sm text-white uppercase tracking-wider">
                      Cenas de Combate
                    </h3>
                  </div>

                  <p className="text-shadow-xs text-zinc-200 leading-relaxed mb-6">
                    Portal dedicado à preservação da história militar e análise geopolítica.
                    Ajude a manter o Cenas de Combate ativo.
                  </p>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary text-center">
                      Apoiar o Cenas de Combate
                    </p>

                    <a
                      href="https://www.facebook.com/cenas.decombate/subscribe/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-white text-black hover:bg-zinc-200 font-black rounded-xl py-6 transition-all duration-300 shadow-lg">
                        APOIE NOSSO TRABALHO
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
              {/* Widget de Categorias ou Mais Lidos pode vir aqui abaixo se quiser */}
            </aside>
          </div>
        </section>
      </main>
      <AdBanner />
      <SiteFooter />
    </div>
  );
}
