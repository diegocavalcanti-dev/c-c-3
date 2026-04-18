import { Link } from "wouter";
import { Calendar, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    featuredImage?: string | null;
    author?: string | null;
    publishedAt?: Date | null;
    viewCount?: number;
  };
  categories?: { id: number; name: string; slug: string }[];
  variant?: "default" | "featured" | "compact";
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1580130732478-4e339fb33746?w=800&q=80";

export default function PostCard({ post, categories, variant = "default" }: PostCardProps) {
  const imgSrc = post.featuredImage || FALLBACK_IMAGE;

  if (variant === "compact") {
    return (
      <Link href={`/${post.slug}`}>
        <div className="flex gap-3 group cursor-pointer py-2 border-b border-border last:border-0">
          <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-muted">
            <img
              src={imgSrc}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(post.publishedAt)}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/${post.slug}`}>
        <article className="group cursor-pointer relative overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full">
          <div className="aspect-video overflow-hidden">
            <img
              src={imgSrc}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
          </div>
          <div className="p-4">
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {categories.slice(0, 2).map((cat) => (
                  <Badge key={cat.id} variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}
            <h2 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.publishedAt)}
              </span>
              {post.viewCount !== undefined && post.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.viewCount.toLocaleString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Default card
  return (
    <Link href={`/${post.slug}`}>
      <article className="group cursor-pointer flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-all duration-200">
        <div className="w-24 h-20 shrink-0 rounded overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {categories.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30 px-1.5 py-0">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.publishedAt)}
            </span>
            {post.author && (
              <span className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{post.author}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
