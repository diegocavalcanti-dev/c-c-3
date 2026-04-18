import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function CategoryPage() {
  const [location, navigate] = useLocation();
  const categoryId = parseInt(location.split("/categories/")[1] || "0");
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading: postsLoading } = trpc.posts.list.useQuery(
    {
      page,
      limit: 10,
      categoryId,
    },
    { enabled: categoryId > 0 }
  );

  const { data: categories } = trpc.categories.list.useQuery();
  const category = categories?.find((c) => c.id === categoryId);

  const handlePostClick = (slug: string) => {
    navigate(`/posts/${slug}`);
  };

  if (categoryId === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Categoria não encontrada</h1>
            <Button onClick={() => navigate("/")}>Voltar para Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {category?.name || "Categoria"}
          </h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Posts List */}
        <div className="mb-8">
          {postsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
          ) : postsData?.posts && postsData.posts.length > 0 ? (
            <div className="space-y-4">
              {postsData.posts.map((post) => (
                <Card
                  key={post.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePostClick(post.slug)}
                >
                  <div className="flex gap-6">
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{post.title}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt || post.content.substring(0, 150)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{post.author}</span>
                        {post.publishedAt && (
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span>{post.viewCount} visualizações</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum artigo encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {postsData && postsData.pages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <span className="text-foreground">
              Página {page} de {postsData.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(postsData.pages, page + 1))}
              disabled={page === postsData.pages}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
