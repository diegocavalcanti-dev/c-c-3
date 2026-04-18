# Cenas de Combate - TODO

## Schema & Backend
- [x] Schema do banco: tabelas posts, categories, post_categories, media
- [x] Migrations SQL aplicadas via webdev_execute_sql
- [x] Query helpers em server/db.ts
- [x] Router tRPC: posts (list, get, create, update, delete, search)
- [x] Router tRPC: categories (list, get, create, update, delete)
- [x] Router tRPC: cms (stats, listPosts, getPost, createPost, updatePost, deletePost, uploadImage, importWordPress)
- [x] Admin guard (adminProcedure) para proteger rotas do CMS
- [x] Notificação ao proprietário ao publicar novo artigo

## Importação WordPress
- [x] Script Python para parsear XML e extrair 322 posts publicados
- [x] Upload das imagens do wp-content para S3 (em andamento, 530+ mapeamentos)
- [x] Atualização das URLs de imagens nos artigos
- [x] Importação dos 322 posts no banco de dados (100% sucesso)
- [x] 22 categorias importadas, 481 vínculos post-categoria

## Frontend Público
- [x] Design dark/militar com paleta de cores OKLCH e tipografia Inter
- [x] Layout global com header (SiteHeader), navegação por categorias e footer (SiteFooter)
- [x] Componente PostCard (variantes: default, featured, compact)
- [x] Página inicial com artigos em destaque e últimas notícias em grid
- [x] Listagem de artigos por categoria com paginação
- [x] Página de artigo individual com conteúdo HTML completo, breadcrumb, sidebar
- [x] Sistema de busca por título e conteúdo
- [x] Design responsivo (mobile-first)
- [x] Contador de visualizações por artigo

## Painel CMS
- [x] Rota /admin protegida por autenticação (AdminLayout)
- [x] Dashboard do CMS com estatísticas (total, publicados, rascunhos, categorias)
- [x] Listagem de artigos com ações (editar, excluir, publicar/despublicar)
- [x] Editor de artigos (título, slug, conteúdo HTML, excerpt, categoria, imagem destaque)
- [x] Upload de imagens no editor via S3
- [x] Gestão de categorias (criar, editar, excluir)
- [x] Página de importação WordPress via XML no browser
- [x] Notificação automática ao publicar

## Testes & Entrega
- [x] Testes Vitest: categories.list, categories.getBySlug
- [x] Testes Vitest: posts.list, posts.getBySlug
- [x] Testes Vitest: cms.stats (admin guard), cms.createPost
- [x] Teste de logout (auth.logout.test.ts)
- [x] 10/10 testes passando
- [x] Checkpoint final


## Tema Light (White)
- [x] Paleta de cores light com CSS variables OKLCH
- [x] Atualizar componentes para suportar ambos os temas
- [x] Toggle de tema no header (dark/light) com ícones Sun/Moon
- [x] Persistir preferência de tema no localStorage
- [x] Testar tema light em todas as páginas


## Sincronização GitHub e Preview Social
- [x] Sincronizar atualizações do GitHub
- [x] Criar rota GET /api/public/post-meta/:slug
- [x] Configurar env SITE_URL como https://cenasdecombate.com
- [x] Testar rota de preview social
