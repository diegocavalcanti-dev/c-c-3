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

## Editor de Artigos - Campo Published Date
- [x] Adicionar campo `publishedAt` ao schema Drizzle
- [x] Atualizar AdminPostEditor.tsx com input de data publicação
- [x] Integrar handleSave para enviar publishedAt ao backend
- [x] Atualizar procedures tRPC (createPost, updatePost) para aceitar publishedAt
- [x] Implementar lógica: se status=published sem publishedAt, usar data atual
- [x] Implementar lógica: se status=draft, publishedAt fica null
- [x] Testes vitest para validar publishedAt (5 testes)
- [x] Todos os 26 testes passando


## Bugs a Corrigir - Publicação de Artigos
- [x] Data desaparecendo após reload do editor (serialização/timezone)
- [x] Data com diferença de 1 dia (UTC vs local timezone)
- [x] Editor HTML não sincronizando visual com conteúdo salvo
- [x] Falta de botões de tamanho de fonte no editor TipTap


## Gerenciador de Mídia (Media Manager)
- [x] Implementar procedimento `cms.listMedia` para listar imagens do banco
- [x] Implementar procedimento `cms.deleteMedia` para deletar imagens
- [x] Adicionar helpers `getAllMedia()` e `deleteMedia()` em server/db.ts
- [x] Testar funcionalidade de mídia com 6 testes vitest
- [x] Todos os 43 testes passando (37 anteriores + 6 novos de mídia)
- [x] MediaGallery renderiza imagens corretamente do backend

## Sistema de Autores
- [x] Criar tabela `authors` no schema Drizzle (id, name, slug, bio, avatar, createdAt, updatedAt)
- [x] Adicionar foreign key `authorId` na tabela `posts`
- [x] Gerar e aplicar migration SQL para tabela de autores
- [x] Implementar procedures tRPC: authors.list, authors.get, authors.create, authors.update, authors.delete
- [x] Criar helpers em server/db.ts: getAllAuthors, getAuthorBySlug, getAuthorPosts
- [x] Criar página AdminAuthors.tsx no dashboard
- [x] Adicionar menu "Autores" na sidebar do AdminLayout
- [x] Atualizar AdminPostEditor.tsx para seleção de autor
- [x] Criar página pública /autores (lista todos os autores)
- [x] Criar página pública /autores/:slug (página do autor com seus artigos)
- [x] Implementar SEO nas páginas de autores
- [x] Escrever testes vitest para procedures de autores (7/7 testes passando)
- [x] Sincronizar com GitHub e publicar
