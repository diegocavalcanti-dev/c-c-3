import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image,
  FolderOpen,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import AdminLayoutPro from "@/components/AdminLayoutPro";
import { toast } from "sonner";

export default function AdminCMSPro() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  // Force rebuild v3 - complete rebuild

  const { data: posts = [], isLoading: loadingPosts } = trpc.cms.listPosts.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: stats } = trpc.cms.stats.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const deletePostMutation = trpc.cms.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Artigo deletado com sucesso!");
      trpc.useUtils().cms.listPosts.invalidate();
      trpc.useUtils().cms.stats.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const handleDeletePost = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este artigo?")) {
      deletePostMutation.mutate({ id });
    }
  };

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    return posts.filter(
      (post) =>
        post?.title?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
        post?.slug?.toLowerCase?.().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "draft":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Publicado";
      case "draft":
        return "Rascunho";
      case "scheduled":
        return "Agendado";
      default:
        return status;
    }
  };

  return (
    <AdminLayoutPro>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel CMS</h1>
            <p className="text-muted-foreground">Gerencie seu conteúdo de forma profissional</p>
          </div>
          <Button
            onClick={() => navigate("/admin/posts/novo")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Artigos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.publishedPosts || 0} publicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rascunhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.draftPosts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando publicação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Categorias ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Artigos</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Mídia</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Artigos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />

                {loadingPosts ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando artigos...
                  </div>
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <div className="space-y-2">
                    {filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(post.status)}
                            <h3 className="font-medium truncate">{post.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {post.slug}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(post.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/posts/${post.id}/editar`)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum artigo encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciador de Mídia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Gerenciador de mídia em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categorias</CardTitle>
                <Button
                  size="sm"
                  onClick={() => navigate("/admin/categorias")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </CardHeader>
              <CardContent>
                {categories && categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted/50 transition cursor-pointer"
                      >
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria encontrada
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configurações em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutPro>
  );
}
