import { useState } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import AdBanner from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  Shield,
  TrendingUp,
  Plane,
  Cpu,
  Newspaper,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  Clock3,
  ExternalLink,
  Target,
  Globe,
  ScrollText,
  Radar,
  Swords,
} from "lucide-react";

const DEFAULT_IMAGE = "/og-default.jpg";

const unwrapCollection = (data: any) => {
  if (Array.isArray(data?.json)) return data.json;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeText = (value: any = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const safeImage = (src?: string) =>
  typeof src === "string" && src.trim().length > 0 ? src : DEFAULT_IMAGE;

const uniqueByKey = (items: any[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = String(item?.id ?? item?.slug ?? item?.title ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatDate = (date?: string) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR");
};

const getPostCategoryLabel = (post: any) =>
  post?.category?.name || post?.categories?.[0]?.name || "Especial";

const postMatchesTerms = (post: any, terms: string[]) => {
  const haystack = normalizeText(
    [
      post?.category?.name,
      post?.category?.slug,
      post?.title,
      post?.excerpt,
      post?.tags?.map?.((tag: any) => tag?.name).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return terms.some((term) => haystack.includes(normalizeText(term)));
};

const pickPosts = (
  posts: any[],
  terms: string[],
  limit: number,
  fallback: any[] = []
) => {
  const matched = uniqueByKey(posts.filter((post) => postMatchesTerms(post, terms)));
  const combined = uniqueByKey([...matched, ...fallback, ...posts]);
  return combined.slice(0, limit);
};

type ThemePreset = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  matches: string[];
};

const THEME_PRESETS: ThemePreset[] = [
  {
    key: "geopolitica",
    title: "Geopolítica",
    description: "Crises, alianças, disputas regionais e estratégia internacional.",
    icon: Globe,
    matches: ["geopolitica", "geopolítica", "politica internacional", "política internacional"],
  },
  {
    key: "aviacao",
    title: "Aviação",
    description: "Caças, aeronaves históricas, poder aéreo e defesa aérea.",
    icon: Plane,
    matches: ["aviacao", "aviação", "avioes", "aviões", "aeronaves", "forca aerea", "força aérea"],
  },
  {
    key: "historia-militar",
    title: "História Militar",
    description: "Grandes campanhas, batalhas e personagens que moldaram os conflitos.",
    icon: ScrollText,
    matches: ["historia militar", "história militar", "1 guerra", "2 guerra", "segunda guerra", "primeira guerra"],
  },
  {
    key: "tecnologia-militar",
    title: "Tecnologia Militar",
    description: "Mísseis, drones, radares, blindados e inovação no campo de batalha.",
    icon: Radar,
    matches: ["tecnologia militar", "defesa aerea", "defesa aérea", "drone", "radar", "missil", "míssil"],
  },
  {
    key: "conflitos-atuais",
    title: "Conflitos Atuais",
    description: "Cobertura, contexto e análise dos principais focos de tensão.",
    icon: Swords,
    matches: ["conflitos", "guerra", "oriente medio", "oriente médio", "ucrania", "ucrânia", "russia", "rússia"],
  },
  {
    key: "noticias",
    title: "Notícias",
    description: "Atualizações rápidas do cenário militar, industrial e geopolítico.",
    icon: Newspaper,
    matches: ["noticias", "notícias", "atualidades", "defesa"],
  },
];

const resolveThemeMeta = (category: any) => {
  const key = normalizeText(`${category?.name || ""} ${category?.slug || ""}`);
  return (
    THEME_PRESETS.find((theme) =>
      theme.matches.some((term) => key.includes(normalizeText(term)))
    ) || {
      key: category?.slug || category?.name || "categoria",
      title: category?.name || "Categoria",
      description: "Conteúdo especializado do universo militar, histórico e geopolítico.",
      icon: Shield,
      matches: [],
    }
  );
};

const SectionTitle = ({
  title,
  icon: Icon,
  href = "/categoria/materias",
}: {
  title: string;
  icon: LucideIcon;
  href?: string;
}) => (
  <div className="flex items-center justify-between gap-4 mb-8 border-b border-border pb-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black mb-1">
          Cenas de Combate
        </p>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
          {title}
        </h2>
      </div>
    </div>

    <Link href={href}>
      <Button
        variant="ghost"
        size="sm"
        className="text-[11px] uppercase font-black tracking-[0.18em] shrink-0"
      >
        Ver tudo <ChevronRight className="ml-1 w-4 h-4" />
      </Button>
    </Link>
  </div>
);

const SidebarWidget = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-primary" />
      {title}
    </h3>
    {children}
  </div>
);

export default function Home() {
  const { data: featuredPosts, isLoading: loadingFeatured } =
    trpc.posts.getFeatured.useQuery();

  const { data: latestPosts, isLoading: loadingLatest } =
    trpc.posts.getLatest.useQuery({ limit: 50 });

  const { data: categoriesData, isLoading: loadingCategories } =
    trpc.categories.list.useQuery();

  const featured = unwrapCollection(featuredPosts);
  const latest = unwrapCollection(latestPosts);
  const categoriesList = unwrapCollection(categoriesData);

  const allPosts = uniqueByKey([...featured, ...latest]);

  const heroPost = featured[0] || latest[0] || null;
  const sideHighlights = uniqueByKey([...featured.slice(1, 6), ...latest]).slice(0, 3);
  const tickerPosts = uniqueByKey([...latest, ...featured]).slice(0, 6);

  const geopoliticaPosts = pickPosts(
    allPosts,
    [
      "geopolitica",
      "geopolítica",
      "estreito",
      "politica internacional",
      "política internacional",
      "otan",
      "china",
      "russia",
      "rússia",
      "ucrania",
      "ucrânia",
      "oriente médio",
      "oriente medio",
      "emirados",
    ],
    4
  );

  const aviationPosts = pickPosts(
    allPosts,
    ["aviacao", "aviação", "avioes", "aviões", "aeronave", "força aérea", "forca aerea"],
    6
  );

  const historyPosts = pickPosts(
    allPosts,
    [
      "historia militar",
      "história militar",
      "1 guerra mundial",
      "primeira guerra mundial",
      "2 guerra mundial",
      "segunda guerra mundial",
      "ww1",
      "ww2",
    ],
    6
  );

  const ww1Posts = pickPosts(
    allPosts,
    ["1 guerra mundial", "primeira guerra mundial", "ww1"],
    3,
    historyPosts
  );

  const ww2Posts = pickPosts(
    allPosts,
    ["2 guerra mundial", "segunda guerra mundial", "ww2"],
    3,
    historyPosts
  );

  const techPosts = pickPosts(
    allPosts,
    [
      "tecnologia militar",
      "drone",
      "radar",
      "missil",
      "míssil",
      "blindado",
      "defesa aerea",
      "defesa aérea",
      "armamento",
      "tecnologia"
    ],
    4
  );

  const newsPosts = pickPosts(
    allPosts,
    ["noticias", "notícias", "defesa", "atualidades", "geopolitica", "geopolítica"],
    5
  );

  const mixedPosts = uniqueByKey([...latest, ...featured]).slice(0, 10);

  const matchedCategoryCards = THEME_PRESETS.map((theme) => {
    const category = categoriesList.find((cat: any) => {
      const key = normalizeText(`${cat?.name || ""} ${cat?.slug || ""}`);
      return theme.matches.some((term) => key.includes(normalizeText(term)));
    });

    if (!category) return null;

    return {
      id: category.id || theme.key,
      name: category.name || theme.title,
      slug: category.slug || theme.key,
      description: theme.description,
      icon: theme.icon,
      count: category.postsCount || category.posts_count || category.count || null,
    };
  }).filter(Boolean) as Array<{
    id: string | number;
    name: string;
    slug: string;
    description: string;
    icon: LucideIcon;
    count?: number | null;
  }>;

  const remainingCategoryCards = categoriesList
    .filter(
      (cat: any) =>
        !matchedCategoryCards.some(
          (card) => String(card.slug) === String(cat?.slug)
        )
    )
    .map((cat: any) => {
      const meta = resolveThemeMeta(cat);
      return {
        id: cat.id || cat.slug || cat.name,
        name: cat.name || meta.title,
        slug: cat.slug || meta.key,
        description: meta.description,
        icon: meta.icon,
        count: cat.postsCount || cat.posts_count || cat.count || null,
      };
    });

  const editorialCards = (
    matchedCategoryCards.length > 0
      ? uniqueByKey([...matchedCategoryCards, ...remainingCategoryCards]).slice(0, 8)
      : THEME_PRESETS.map((theme) => ({
        id: theme.key,
        name: theme.title,
        slug: theme.key,
        description: theme.description,
        icon: theme.icon,
        count: null,
      }))
  ) as Array<{
    id: string | number;
    name: string;
    slug: string;
    description: string;
    icon: LucideIcon;
    count?: number | null;
  }>;

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
      <SiteHeader />

      <main className="flex-1 pb-20">
        <h1 className="sr-only">
          Cenas de Combate - História Militar, Geopolítica e Tecnologia de Defesa
        </h1>
        {/* Ticker */}
        {/* <div className="border-b border-white/10 bg-zinc-950 text-white">
          <div className="container px-4 py-2.5 flex items-center gap-3 overflow-x-auto">
            <Badge variant="destructive" className="shrink-0 rounded-md px-2.5 py-1">
              URGENTE
            </Badge>

            <div className="flex items-center gap-3 min-w-max">
              {tickerPosts.map((post: any) => (
                <Link key={post.id} href={`/${post.slug}`}>
                  <span className="text-xs md:text-sm text-white/80 hover:text-primary transition-colors cursor-pointer whitespace-nowrap">
                    • {post.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div> */}

        {/* Hero */}
        <section className="container px-4 py-8 md:py-12">
          {loadingFeatured && !heroPost ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Skeleton className="lg:col-span-8 aspect-[16/9] rounded-3xl" />
              <div className="lg:col-span-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                {heroPost && (
                  <Link href={`/${heroPost.slug}`}>
                    <article className="group relative overflow-hidden rounded-3xl shadow-2xl bg-zinc-900 border border-white/50 aspect-[16/10] md:aspect-[16/9] cursor-pointer">
                      <img
                        src={safeImage(heroPost.featuredImage)}
                        alt={heroPost.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-99 group-hover:opacity-100"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                      <div className="absolute inset-0 p-5 md:p-10 flex flex-col justify-end">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {/* <Badge className="bg-primary hover:bg-primary text-white px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase">
                            Principal do Momento
                          </Badge> */}

                          {/* <span className="text-white/70 text-xs flex items-center gap-1.5 font-semibold">
                            <Clock3 className="w-3.5 h-3.5" />
                            {formatDate(heroPost.publishedAt)}
                          </span> */}
                        </div>

                        <h2 className="text-xl md:text-5xl font-black text-white leading-tight md:leading-[1.05] tracking-tight mb-4 group-hover:text-primary transition-colors">
                          {heroPost.title}
                        </h2>


                        {/* {heroPost.excerpt && (
                          <p className="text-white/80 text-sm md:text-lg line-clamp-3 max-w-3xl leading-relaxed">
                            {heroPost.excerpt}
                          </p>
                        )} */}
                      </div>
                    </article>
                  </Link>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Tendências
                </div>

                {sideHighlights.map((post: any, index: number) => (
                  <Link key={post.id || index} href={`/${post.slug}`}>
                    <article className="group flex gap-4 items-start border-b border-border pb-5 last:border-b-0 cursor-pointer">
                      <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
                        <img
                          src={safeImage(post.featuredImage)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="space-y-2 min-w-0">
                        <span className="text-[10px] font-black tracking-[0.18em] text-primary uppercase">
                          {getPostCategoryLabel(post)}
                        </span>

                        <h3 className="font-bold text-sm md:text-base leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>

                        <p className="text-xs text-muted-foreground">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner />

        {/* Geopolítica + Aviação */}
        <section className="container px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            <div className="xl:col-span-8">
              <SectionTitle title="Geopolítica em Foco" icon={Globe} href="/categoria/geopolitica" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {geopoliticaPosts[0] && (
                  <Link href={`/${geopoliticaPosts[0].slug}`} className="md:col-span-7">
                    <article className="group rounded-3xl overflow-hidden border border-border bg-card shadow-lg cursor-pointer h-full">
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={safeImage(geopoliticaPosts[0].featuredImage)}
                          alt={geopoliticaPosts[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>

                      <div className="p-6">
                        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                          {getPostCategoryLabel(geopoliticaPosts[0])}
                        </Badge>

                        <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">
                          {geopoliticaPosts[0].title}
                        </h3>

                        {geopoliticaPosts[0].excerpt && (
                          <p className="text-muted-foreground mt-3 line-clamp-3">
                            {geopoliticaPosts[0].excerpt}
                          </p>
                        )}
                      </div>
                    </article>
                  </Link>
                )}

                <div className="md:col-span-5 space-y-4">
                  {geopoliticaPosts.slice(1, 4).map((post: any) => (
                    <Link key={post.id} href={`/${post.slug}`}>
                      <article className="group flex gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all cursor-pointer">
                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={safeImage(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                            {getPostCategoryLabel(post)}
                          </span>
                          <h4 className="mt-2 font-bold leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <SectionTitle title="Aviação & Defesa Aérea" icon={Plane} href="/categoria/avioes" />

              <div className="space-y-5">
                {aviationPosts.slice(0, 4).map((post: any) => (
                  <Link key={post.id} href={`/${post.slug}`}>
                    <article className="group flex gap-4 items-start border-b border-border pb-5 last:border-b-0 cursor-pointer">
                      <div className="w-28 h-24 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
                        <img
                          src={safeImage(post.featuredImage)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                          {getPostCategoryLabel(post)}
                        </span>
                        <h4 className="mt-2 text-sm md:text-base font-bold leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Conflitos Históricos */}
        <section className="bg-zinc-950 py-20 md:py-24 text-zinc-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_90%)]" />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-20" />

          <div className="container px-4 relative z-10">
            <div className="mb-12">
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary font-black mb-3">
                Arquivo histórico
              </p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Conflitos que marcaram o século
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1.5 bg-primary rounded-full" />
                  <h3 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase">
                    1ª Guerra Mundial
                  </h3>
                </div>

                <div className="space-y-6">
                  {ww1Posts.map((post: any) => (
                    <Link key={post.id} href={`/${post.slug}`}>
                      <article className="group flex gap-5 cursor-pointer">
                        <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden bg-zinc-800 grayscale group-hover:grayscale-0 transition-all duration-500">
                          <img
                            src={safeImage(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-3">
                            {post.title}
                          </h4>
                          <p className="text-zinc-400 text-sm mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.18em] mt-3 inline-block">
                            Arquivo Histórico
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1.5 bg-primary rounded-full" />
                  <h3 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase">
                    2ª Guerra Mundial
                  </h3>
                </div>

                <div className="space-y-6">
                  {ww2Posts.map((post: any) => (
                    <Link key={post.id} href={`/${post.slug}`}>
                      <article className="group flex gap-5 cursor-pointer">
                        <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden bg-zinc-800 grayscale group-hover:grayscale-0 transition-all duration-500">
                          <img
                            src={safeImage(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-3">
                            {post.title}
                          </h4>
                          <p className="text-zinc-400 text-sm mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.18em] mt-3 inline-block">
                            Crônicas de Combate
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conteúdo principal + Sidebar */}
        <section className="container px-4 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-16">
              <div>
                <SectionTitle
                  title="Tecnologia Militar"
                  icon={Cpu}
                  href="/categoria/tecnologia-militar"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {techPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle title="Notícias de Defesa" icon={Newspaper} href="/categoria/noticias" />

                <div className="space-y-4">
                  {newsPosts.map((post: any) => (
                    <Link key={post.id} href={`/${post.slug}`}>
                      <article className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-all group flex items-center justify-between gap-4 cursor-pointer">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                              Atualizado
                            </span>
                          </div>

                          <h4 className="font-bold text-base md:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </article>
                    </Link>
                  ))}
                </div>
              </div>

              <AdBanner />

              <div>
                <SectionTitle title="Explorar Matérias" icon={Target} href="/categoria/materias" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mixedPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                <div className="mt-12 flex justify-center">
                  <Link href="/categoria/materias">
                    <Button className="px-10 py-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.18em] shadow-lg">
                      Carregar Mais Conteúdo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%)]" />
                <div className="relative z-10">
                  <img
                    src="https://www.cenasdecombate.com/og-default.jpg"
                    alt="Cenas de Combate"
                    className="w-20 h-20 rounded-2xl mb-6 shadow-lg border border-white/10 object-cover"
                  />

                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black mb-3">
                    Portal editorial
                  </p>

                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-4">
                    Cenas de Combate
                  </h3>

                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Portal dedicado à preservação da história militar e análise
                    geopolítica. Ajude a manter o Cenas de Combate ativo.
                  </p>

                  <div className="flex gap-3 mb-8">
                    {/* Facebook */}
                    <a
                      href="https://facebook.com/cenas.decombate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://instagram.com/cenas.decombate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>

                    {/* Youtube */}
                    <a
                      href="https://youtube.com/@cenasdeCombate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  </div>

                  <a
                    href="https://www.facebook.com/cenas.decombate/subscribe/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-2xl shadow-lg shadow-primary/20">
                      APOIE NOSSO TRABALHO
                    </Button>
                  </a>
                </div>
              </div>

              <SidebarWidget title="Boletim de Combate">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Receba análises, matérias e destaques da semana direto no seu e-mail.
                  </p>

                  {!isSubscribed ? (
                    <form onSubmit={handleSubscribe} className="space-y-3">
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Seu melhor e-mail"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-xl bg-muted border-none focus-visible:ring-primary"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl font-black uppercase tracking-[0.15em] text-xs"
                      >
                        Inscrever-se
                      </Button>
                    </form>
                  ) : (
                    <div className="bg-green-500/10 text-green-600 p-4 rounded-xl text-xs font-black text-center border border-green-500/20">
                      PRONTO! AGORA É SÓ CONFERIR SUA CAIXA DE ENTRADA.
                    </div>
                  )}
                </div>
              </SidebarWidget>

              {/* <SidebarWidget title="Categorias">
                {loadingCategories && categoriesList.length === 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map((cat: any) => (
                      <Link key={cat.id || cat.slug} href={`/categoria/${cat.slug}`}>
                        <Badge className="cursor-pointer rounded-full px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-white transition-colors">
                          {cat.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </SidebarWidget> */}


              <SidebarWidget title="Sugira uma pauta">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>

                  <h4 className="font-black text-base mb-2">
                    Tem uma pauta interessante?
                  </h4>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Sugestões de conflitos, aviação, história militar e tecnologia
                    podem virar destaque na home.
                  </p>

                  {/* Link para o e-mail */}
                  <a href="mailto:cenasdecombate@gmail.com">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-black uppercase tracking-[0.15em] text-xs hover:bg-primary hover:text-white transition-all"
                    >
                      Entrar em contato
                    </Button>
                  </a>
                </div>
              </SidebarWidget>

              {/* <div className="sticky top-24">
                <div className="w-full rounded-3xl border border-dashed border-border bg-muted/50 p-8 flex flex-col items-center justify-center text-center min-h-[320px]">
                  <Shield className="w-8 h-8 text-muted-foreground/60 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Espaço para publicidade
                  </p>
                </div>
              </div> */}
            </aside>
          </div>
        </section>
        {/* Editorias */}
        <section className="container px-4 py-10 md:py-14">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary font-black mb-2">
                Navegação editorial
              </p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight">
                Explore por editoria
              </h2>
              {/* <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Uma home mais forte começa por organizar bem o conteúdo. Aqui o leitor
                encontra rápido os assuntos centrais do portal.
              </p> */}
            </div>
          </div>

          {loadingCategories && editorialCards.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {editorialCards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link key={card.id} href={`/categoria/${card.slug}`}>
                    <article className="group h-full rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                          {card.name}
                        </h3>

                        {typeof card.count === "number" && (
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground shrink-0">
                            {card.count} posts
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        {card.description}
                      </p>

                      <div className="mt-5 inline-flex items-center text-sm font-bold text-primary">
                        Acessar editoria
                        <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
