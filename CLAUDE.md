# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Responda em português (pt-BR). Toda a interface e as mensagens do produto são em pt-BR.

## Produto

Fechou (antes chamado OrçaFácil) — SaaS web (sem instalação, responsivo para celular e PC) de orçamentos para MEI/autônomos, inspirado no app InteraUp. Fluxo central: orçamento → link público enviado pelo WhatsApp → cliente aprova com assinatura → vira pedido/OS → parcelas → recebimento (Pix) → recibo + lançamento financeiro.

## Comandos

```bash
npm install
cp .env.example .env   # DATABASE_URL(_UNPOOLED), BETTER_AUTH_SECRET, BLOB_READ_WRITE_TOKEN (opcional)
npm run db:up          # Postgres local no Docker (docker-compose.yml)
npm run db:migrate     # prisma migrate dev — aplica/cria migrations
npm run db:seed        # dados demo — login demo@fechou.test / demo123
npm run dev            # http://localhost:3000
npm test               # Vitest (src/**/*.test.ts)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint . (flat config em eslint.config.mjs)
npm run build          # prisma generate + next build
npm run db:studio      # Prisma Studio
```

Testes unitários cobrem as regras puras de `src/lib` (totais, parcelas, Pix, datas, validação de imagens). Fluxos de tela não têm teste automatizado: valide com `npm run build` e navegando no app (`.claude/launch.json` tem a config "dev", que sobe com `-H 0.0.0.0` para abrir pelo celular na rede local — os IPs permitidos ficam em `allowedDevOrigins` no `next.config.mjs`). O dev server trava a DLL do Prisma no Windows: pare-o antes de `npm run build`/`prisma generate`.

**Banco e migrations:** mudou `prisma/schema.prisma` → `npm run db:migrate -- --name <descricao>` e commite a pasta gerada em `prisma/migrations`. Nunca use `db push`. Na Vercel, `vercel-build` roda `prisma migrate deploy` só quando `VERCEL_ENV=production` (previews compartilham o banco de produção e não migram).

**Deploy:** projeto Vercel `fechou` (conta jonashenriquedev), ligado ao GitHub `JonasHenriqueDev/fechou` — push na `main` publica em produção (https://fechou-xi.vercel.app; `fechou.vercel.app` já era de outra pessoa). A Vercel bloqueia deploy com Next.js vulnerável: mantenha o `next` no último patch da 15.5. Neon Postgres (`fechou-db`, us-east-1) e Vercel Blob (`fechou-blob`, público) injetam as variáveis; `BETTER_AUTH_SECRET` é separado por ambiente. O `.env` local aponta para o Docker — não use `vercel env pull` para `.env.local` (o Next daria prioridade a ele e o dev passaria a usar o banco de produção).

## Stack

Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript, PostgreSQL + Prisma 6 (migrations), Better Auth (e-mail/senha, hash bcrypt), Vercel Blob, Tailwind 3, `qrcode`, Vitest, ESLint 9. Sem biblioteca de UI nem de ícones (ver `src/components/Icon.tsx`).

## Arquitetura

- **Multi-tenant por `companyId`.** `requireSession()`/`requireCompany()` (`src/lib/auth.ts`) devolvem o `companyId` da sessão; **toda** query e mutation autenticada deve filtrar por ele (`findFirst({ where: { id, companyId } })`, `updateMany`/`deleteMany` com `companyId`). `src/middleware.ts` só faz a barreira rápida de `/app/*` (confere se existe o cookie de sessão com `getSessionCookie`); a validação real é `getSession()`.
- **Autenticação = Better Auth** (`src/lib/auth.ts`, rotas em `/api/auth/[...all]`). Sessões ficam na tabela `Session` (cookie cache de 5 min); senha (bcrypt) em `Account.password` com `providerId: "credential"`; rate limit na tabela `RateLimit`. `User.companyId` é `input: false` (o cliente não consegue definir) e é preenchido pelo `databaseHooks.user.create.before`, que cria a `Company` do novo usuário; a action `signup` só completa nome/WhatsApp da empresa. Login/cadastro/logout são Server Actions (`actions/auth.ts`) chamando `auth.api.*` com o plugin `nextCookies`.
- **Mutations = Server Actions** em `src/actions/*.ts` (`"use server"`), ligadas às páginas com `.bind(null, id)`. Tudo que um arquivo `"use server"` exporta vira endpoint público — helpers internos sem checagem de auth (ex.: `applyStock`, `createPaymentWithReceipt`, `nextSeq`) ficam em `src/actions/helpers.ts`, que **não** é `"use server"`.
- **Rotas:** `/app/*` área logada (layout com `AppShell`: sidebar no desktop, barra inferior + menu “Mais” no celular). Páginas públicas por token não adivinhável (`publicToken()`): `/o/[token]` portal do orçamento (visualização, aprovação com assinatura, Pix), `/p/[token]` portal do pedido (parcelas, Pix, recibos), `/r/[token]` recibo. Sufixo `/pdf` = mesma visualização + `window.print()`. `/gerador` é o gerador grátis sem cadastro (`FreeGenerator`, só client, não grava no banco) e `/` é a landing.
- **PDF = impressão do navegador.** Não há gerador de PDF no servidor; `DocumentView` é o layout único de orçamento/pedido/OS usado na tela, no portal e na impressão. Classes `no-print`, `print-area`, `avoid-break` em `globals.css` controlam o resultado impresso.
- **Editor de documento** (`components/DocumentEditor.tsx`, client) serve orçamento e pedido (`mode`). Serializa todo o estado em um input hidden `payload` (JSON); as actions fazem `parseEditor` → `resolveClient` (cria cliente inline) → `sanitizeItems` (valida vínculos de catálogo do tenant) e substituem itens/fotos inteiros na edição.
- **Totais:** sempre via `calcTotals` (`src/lib/calc.ts`) — serviços/produtos, taxa de entrega, desconto em R$ ou %. `total` é persistido no documento, mas a exibição recalcula a partir dos itens.
- **Ciclo financeiro:** `createPaymentWithReceipt` cria Payment + Receipt numerado + Transaction INCOME (vinculada por `paymentId`). Lançamentos com `paymentId` são automáticos e não editáveis no financeiro; excluir o pagamento remove os três (cascade) e `refreshInstallment` recalcula a parcela.
- **Estoque:** `applyStock(orderId, ±1)` baixa produtos com `trackStock` ao criar pedido, devolve ao cancelar/excluir/editar; `Order.stockApplied` evita aplicar duas vezes.
- **Numeração** sequencial por empresa (`Company.quoteSeq/orderSeq/receiptSeq` via `nextSeq`) no formato `0007-26` (`docCode`).
- **Notificações:** abrir/aprovar/recusar no portal cria `Notification` (`src/lib/tracking.ts`, `actions/portal.ts`); visitas do próprio dono logado não contam. `components/Reminders.tsx` consulta `/api/pulse` a cada 60s para toasts + Notification API do navegador (lembretes da agenda).
- **Pix:** `src/lib/pix.ts` gera BR Code estático (EMV + CRC16) com a chave da empresa; `PixBox` renderiza QR no servidor. Não há confirmação automática — o dono registra o recebimento.

## Convenções

- Dinheiro é `Float` em reais; arredonde com `round2`. Status/tipos são `String` — valores e rótulos em `src/lib/constants.ts`.
- Buscas com `contains` usam `mode: "insensitive"` (Postgres diferencia maiúsculas).
- Datas de formulário: `parseInputDate` grava meio-dia UTC (evita “voltar um dia”); `datetime-local` é interpretado como Brasília (`parseInputDateTime`). Atraso de parcela usa `isOverdue` (comparação por dia em Brasília), nunca `dueDate < now`.
- Imagens (logo, fotos, assinaturas): o navegador redimensiona (`fileToDataUrl`) e envia para `/api/upload` (`uploadImage`/`fileToImageUrl` em `components/client.tsx`), que grava no Vercel Blob em `<companyId>/<pasta>/...`; o formulário leva só a URL. **Toda action que salva imagem passa o valor por `persistImage`/`persistImages` (`src/lib/storage.ts`)**: aceita só URL do Blob ou data URL PNG/JPEG/WebP (que é enviado ao Blob) e descarta o resto. Sem `BLOB_READ_WRITE_TOKEN`, o data URL fica no banco (dev offline). Limite de body das actions: 4 MB (a Vercel corta em 4,5 MB). O gerador grátis (`/gerador`) continua só com data URLs, sem upload.
- Next 15: `params`/`searchParams` são `Promise` e precisam de `await`. Arquivos `page.tsx` só podem exportar o default e metadados — componentes auxiliares vão para `src/components`.
- Layout responsivo é requisito: teste em largura de celular (375px) e desktop.
