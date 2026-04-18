# Guia de Deploy - Cenas de Combate

## Deploy na Vercel (Frontend Only)

Este projeto está configurado para deploy **frontend-only** na Vercel. O backend continua rodando no Manus ou em outro servidor.

### Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Repositório GitHub conectado
3. Backend rodando em um servidor remoto (Manus, Railway, Render, etc.)

### Passo 1: Conectar GitHub à Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione seu repositório GitHub `cenasdecombate`
4. Clique em "Import"

### Passo 2: Configurar Variáveis de Ambiente

Na página de configuração do projeto Vercel, adicione as seguintes variáveis:

```
VITE_APP_ID=<seu_app_id>
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<sua_frontend_api_key>
VITE_APP_TITLE=Cenas de Combate
VITE_APP_LOGO=<url_da_logo>
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=<seu_website_id>
VITE_API_URL=<url_do_seu_backend_remoto>
```

**Importante:** A variável `VITE_API_URL` deve apontar para o backend remoto. Exemplos:
- Se backend está no Manus: `https://3000-xxxxx.us2.manus.computer`
- Se backend está no Railway: `https://seu-app.railway.app`
- Se backend está no Render: `https://seu-app.onrender.com`

### Passo 3: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (normalmente 2-5 minutos)
3. Seu site estará disponível em `https://seu-projeto.vercel.app`

### Passo 4: Configurar Domínio Customizado (Opcional)

1. No dashboard Vercel, vá para "Settings" → "Domains"
2. Adicione seu domínio customizado (ex: `cenasdecombate.com`)
3. Siga as instruções para atualizar os registros DNS

## Estrutura do Projeto

```
/
├── client/              # Frontend React/Vite (deploy na Vercel)
│   ├── src/
│   ├── dist/           # Build output
│   └── package.json
├── server/             # Backend Node.js/Express (roda separadamente)
├── drizzle/            # Schema do banco de dados
├── vercel.json         # Configuração de build para Vercel
└── package.json        # Root package.json
```

## Troubleshooting

### Erro: "Cannot find module"
- Certifique-se de que `VITE_API_URL` está configurada corretamente
- Verifique se o backend está rodando e acessível

### Erro: "Build failed"
- Verifique os logs de build na Vercel
- Certifique-se de que todas as variáveis de ambiente estão configuradas
- Execute `pnpm install && pnpm build` localmente para testar

### Erro: "CORS"
- O backend deve ter CORS configurado para aceitar requisições da Vercel
- Adicione o domínio da Vercel à lista de origens CORS permitidas

## Atualizações

Para atualizar o site:

1. Faça as mudanças localmente
2. Execute `git push` para o GitHub
3. A Vercel automaticamente detectará as mudanças e fará o deploy

## Backend

O backend continua rodando no Manus em: `https://3000-i9bs5io4s1flpoup430za-117a2465.us2.manus.computer`

Para mudar o backend para outro servidor (Railway, Render, etc.):

1. Deploy o backend naquele servidor
2. Atualize `VITE_API_URL` na Vercel com a nova URL
3. Faça um novo deploy

## Suporte

Para dúvidas sobre Vercel, consulte: https://vercel.com/docs
Para dúvidas sobre o projeto, entre em contato.
