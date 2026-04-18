import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 20;

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.posts.list.useQuery(
    { page, limit: POSTS_PER_PAGE, search: query },
    { enabled: query.length > 0 }
  );

  const totalPages = data ? Math.ceil(data.total / POSTS_PER_PAGE) : 0;

  useEffect(() => {
    setPage(1);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            Buscar Artigos
          </h1>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Digite para buscar artigos..."
              className="flex-1 bg-secondary border-border"
              autoFocus
            />
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="w-4 h-4 mr-1.5" />
              Buscar
            </Button>
          </form>

          {/* Results */}
          {query && (
            <>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : data?.posts.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum artigo encontrado para "<strong className="text-foreground">{query}</strong>"
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {data?.total} resultado{data?.total !== 1 ? "s" : ""} para "<strong className="text-foreground">{query}</strong>"
                  </p>

                  <div className="space-y-3">
                    {data?.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Próxima <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Digite um termo para buscar artigos.</p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
