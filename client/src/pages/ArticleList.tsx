import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import AdBanner from "@/components/AdBanner";

const POSTS_PER_PAGE = 20;

export default function ArticleList() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data, isLoading } = trpc.posts.list.useQuery({
    page,
    limit: POSTS_PER_PAGE,
    categorySlug: slug,
  });

  const totalPages = data ? Math.ceil(data.total / POSTS_PER_PAGE) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <AdBanner />

      <main className="flex-1 container py-8">
        {/* Category header */}
        <div className="mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {category?.name || slug}
            </h1>
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.total} artigo{data.total !== 1 ? "s" : ""} encontrado{data.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Posts grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : data?.posts.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum artigo encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.posts.map((post) => (
              <PostCard key={post.id} post={post} variant="featured" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-border"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 p-0 ${page === pageNum ? "bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-border"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
