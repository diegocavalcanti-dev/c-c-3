# Cenas de Combate API - TODO

## Migração e Schema
- [x] Analisar estrutura completa do banco de origem (TiDB)
- [x] Definir schema Drizzle com tabelas: posts, categories, post_categories, media, settings, users
- [x] Gerar e executar migrações SQL
- [x] Validar schema criado no novo banco

## Rotas tRPC e REST
- [x] Implementar rota tRPC pública: posts.list (com paginação, filtragem por categoria, busca)
- [x] Implementar endpoint REST GET /api/pub/post-meta/:slug para metadados de preview social
- [x] Testar endpoints com dados reais

## Painel Administrativo
- [x] Implementar autenticação/proteção de rotas admin
- [x] Implementar CRUD de posts (criar, editar, publicar, arquivar)
- [x] Implementar gerenciamento de categorias (criar, editar, excluir, associar)
- [x] Implementar UI do painel admin com formulários e listagens
- [x] Testar fluxos de admin

## Frontend Público
- [x] Implementar página Home (listagem de artigos com paginação)
- [x] Implementar página ArticlePage (leitura de artigo individual)
- [x] Implementar página CategoryPage (listagem por categoria)
- [x] Implementar contador de visualizações incrementado a cada acesso
- [x] Testar navegação e responsividade

## Sitemap e Deploy
- [x] Implementar geração de sitemap XML dinâmico
- [x] Configurar vercel.json para deploy do frontend
- [x] Testar geração de sitemap

## Migração de Dados
- [x] Executar migração completa de dados do banco TiDB de origem
- [x] Validar integridade dos dados migrados
- [x] Confirmar contagem de posts e categorias

## Validação Final
- [x] Validar todos os endpoints principais
- [x] Testar preview social com metadados
- [x] Confirmar compatibilidade com frontend atual
- [x] Documentar nova URL da API e envs para Vercel

## Status: COMPLETO ✓

Todas as funcionalidades foram implementadas e testadas com sucesso.


## Painel Administrativo Frontend (Completo)

- [x] Implementar layout de dashboard com sidebar de navegação admin
- [x] Criar rota protegida /admin com redirecionamento para login se não autenticado
- [x] Implementar página /admin/posts com listagem, criar, editar, publicar, arquivar
- [x] Implementar página /admin/categories com CRUD completo
- [x] Integrar formulários com validação e chamadas tRPC aos procedures admin
- [x] Testar fluxos completos de edição, criação e publicação (23 testes passando)
