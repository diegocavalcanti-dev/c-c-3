import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function AuthorsListPage() {
  const { data: authors, isLoading } = trpc.authors.list.useQuery();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Nossos Autores</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Conheça os autores que compartilham análises e insights sobre combate.
          </p>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : authors?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum autor cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {authors?.map((author) => (
                <Link key={author.id} href={`/autores/${author.slug}`}>
                  <a className="group block">
                    <div className="border border-border rounded-lg p-6 hover:border-primary transition-colors h-full">
                      {author.avatar && (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-20 h-20 rounded-full mb-4 object-cover"
                        />
                      )}
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {author.name}
                      </h2>
                      {author.bio && (
                        <p className="text-muted-foreground line-clamp-3">
                          {author.bio}
                        </p>
                      )}
                      <div className="mt-4 text-sm text-primary font-medium">
                        Ver artigos →
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
