# Guia de Autenticação Clerk (Fase 1)

Este guia documenta a configuração atual do Clerk no Financeito e descreve como personalizar ou estender os fluxos existentes utilizando `@clerk/nextjs`. As instruções a seguir substituem qualquer tentativa de recriar aplicações separadas em Vite/Express – toda a autenticação roda dentro do Next.js.

## 1. Visão geral da configuração atual

### Dependências e variáveis de ambiente
- `@clerk/nextjs` está definido em `package.json` (versão `^5.4.2`).
- As variáveis obrigatórias estão listadas em `.env.example`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (exposta ao navegador).
  - `CLERK_SECRET_KEY` (usada apenas no servidor Next.js).
- Scripts de desenvolvimento (`npm run dev`) já cuidam de `prisma generate`/`db push` antes de subir o Next na porta 5000.

### Providers globais
- `app/providers.tsx` encapsula toda a aplicação com `<ClerkProvider>` antes dos contextos de tema e toast. Isso permite que hooks como `useAuth`, `useUser`, `useSignIn` etc. funcionem em qualquer componente client-side.
- O layout de rotas públicas (`app/(auth)/layout.tsx`) também envolve a árvore com `<ClerkProvider>` para garantir que as telas de login/registro tenham acesso direto aos hooks do Clerk.

### Middleware e rotas públicas
- `middleware.ts` usa `clerkMiddleware` com um `createRouteMatcher` para liberar `/login`, `/register`, `/api/:path*`, `/sso-callback` e `/mfa-verification`.
- Toda rota fora dessa lista exige sessão válida (`auth().protect()`). Para abrir novas páginas públicas, basta adicioná-las ao array `isPublicRoute`.

### Telas personalizadas
- `components/auth/custom-signin.tsx` implementa um formulário totalmente customizado usando `useSignIn`. O componente:
  - Trata autenticação por email/senha com `signIn.create` e `setActive`.
  - Redireciona para `/mfa-verification` quando o Clerk sinaliza MFA (`needs_second_factor`).
  - Oferece login social com Google via `authenticateWithRedirect` apontando para `/sso-callback`.
  - Exibe mensagens de erro localizadas e logs detalhados condicionais por hostname.

## 2. Como personalizar ou estender a autenticação

### Aparência e internacionalização
Passe opções diretamente ao `<ClerkProvider>` (em `app/providers.tsx` ou `app/(auth)/layout.tsx`):

```tsx
import { ptBR } from '@clerk/localizations';

<ClerkProvider
  appearance={{ elements: { card: 'bg-card-glass/60' } }}
  localization={ptBR}
>
  {children}
</ClerkProvider>
```

### Ajustando o fluxo de login
- Para alterar mensagens, validações ou campos extras, edite `components/auth/custom-signin.tsx` e continue usando os métodos do hook `useSignIn` (por exemplo, `signIn.create`, `signIn.prepareFirstFactor`).
- Para novos provedores OAuth, chame `authenticateWithRedirect` com a `strategy` correspondente (`oauth_github`, `oauth_apple`, etc.) e reutilize o mesmo `redirectUrl`/`redirectUrlComplete` já mapeados.

### Registro e MFA
- Crie componentes semelhantes usando `useSignUp`, `useSession`, `useOrganizationList` conforme necessário. Todos os hooks estão disponíveis porque o `ClerkProvider` está no topo da árvore.
- Fluxos de MFA existentes podem ser estendidos em `components/auth/mfa-verification.tsx`; a verificação atual usa `signIn.attemptSecondFactor` e pode receber novos métodos (TOTP, SMS) mantendo o mesmo padrão.

### Controle de acesso em novas páginas
- Para proteger páginas no App Router, utilize os helpers do Clerk nas server components:

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function Dashboard() {
  const { userId } = auth();
  if (!userId) redirect('/login');
  // ...render
}
```

- Caso uma página deva ficar pública, acrescente sua rota ao matcher do `middleware.ts`.

## 3. Consumindo as rotas `app/api/**`

As APIs internas já usam `auth()` do Clerk (ex.: `app/api/transactions/route.ts`, `app/api/goals/route.ts`, `app/api/admin/deploy/route.ts`). Portanto:

1. **No frontend (React/Next):** faça requisições relativas (`fetch('/api/transactions')` ou via Axios). Os cookies de sessão do Clerk são anexados automaticamente, então não há necessidade de headers manuais.
2. **Em Server Actions ou RSC:** use `await fetch('http://localhost:5000/api/...', { headers: { cookie: headers().get('cookie')! } })` (importando `headers` de `next/headers`) quando estiver fora do contexto automático (ex.: em cron jobs).
3. **De serviços externos:** utilize as chaves da API do Clerk (ou tokens JWT emitidos por `getAuth().getToken()`) e valide-os dentro das rotas, se necessário.

> ❗ Não existem diretórios separados `backend/` ou `frontend/`. Toda a aplicação (páginas, componentes e APIs) mora em `app/` e compartilha a sessão fornecida pelo Clerk.

## 4. Próximos passos sugeridos
- Centralizar mensagens, temas e branding do Clerk em um objeto de configuração compartilhado para reutilização em múltiplos componentes.
- Documentar fluxos avançados (ex: convites de organização, webhooks) numa fase futura, reutilizando a infraestrutura atual do Next.js.

Com este guia, qualquer customização passa obrigatoriamente pelos providers e hooks já configurados com `@clerk/nextjs`, mantendo a coesão do projeto sem criar aplicações paralelas.
