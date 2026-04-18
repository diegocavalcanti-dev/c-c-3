import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { Streamdown } from "streamdown";

export default function ArticlePage() {
  const [location, navigate] = useLocation();
  const slug = location.split("/posts/")[1];

  const { data: post, isLoading } = trpc.posts.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              Desculpe, o artigo que você está procurando não existe.
            </p>
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
          <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            {post.author && <span>{post.author}</span>}
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
            )}
            <span>{post.viewCount} visualizações</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="w-full h-96 bg-muted overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-invert max-w-none mb-12">
            <Streamdown>{post.content}</Streamdown>
          </div>

          {/* Back Button */}
          <Button
            variant="outline"
            className="mt-12"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
        </div>
      </main>
    </div>
  );
}
