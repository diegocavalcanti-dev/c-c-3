import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PostCard from "@/components/PostCard";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data: author, isLoading: loadingAuthor } = trpc.authors.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: postsData, isLoading: loadingPosts } = trpc.authors.getPosts.useQuery(
    { authorId: author?.id || 0, page, limit: 10 },
    { enabled: !!author?.id }
  );

  if (loadingAuthor) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-48 rounded-lg mb-8" />
          <Skeleton className="h-96 rounded-lg" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Autor não encontrado</h1>
          <p className="text-muted-foreground">O autor que você procura não existe.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12">
          {/* Author Header */}
          <div className="border border-border rounded-lg p-8 mb-8">
            <div className="flex gap-6 items-start">
              {author.avatar && (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-32 h-32 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{author.name}</h1>
                {author.bio && (
                  <p className="text-lg text-muted-foreground">{author.bio}</p>
                )}
                <div className="mt-4 text-sm text-muted-foreground">
                  {postsData?.total || 0} artigo{(postsData?.total || 0) !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Artigos de {author.name}</h2>

            {loadingPosts ? (
              <div className="grid gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : postsData?.posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6">
                  {postsData?.posts.map((post) => (
                    <PostCard key={post.id} post={post} variant="default" />
                  ))}
                </div>

                {/* Pagination */}
                {postsData && postsData.total > 10 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2">
                      Página {page} de {Math.ceil(postsData.total / 10)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(postsData.total / 10)}
                      className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
