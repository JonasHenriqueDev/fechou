# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Responda em português (pt-BR). Toda a interface e as mensagens do produto são em pt-BR.

## Produto

OrçaFácil — SaaS web (sem instalação, responsivo para celular e PC) de orçamentos para MEI/autônomos, inspirado no app InteraUp. Fluxo central: orçamento → link público enviado pelo WhatsApp → cliente aprova com assinatura → vira pedido/OS → parcelas → recebimento (Pix) → recibo + lançamento financeiro.

## Comandos

```bash
npm install
cp .env.example .env # DATABASE_URL (SQLite) e AUTH_SECRET
npm run db:push      # cria/atualiza o banco SQLite (prisma/dev.db) a partir do schema
npm run db:seed      # dados demo — login demo@orcafacil.test / demo123
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run build        # prisma generate + next build (também faz lint e checagem de tipos)
npm run db:studio    # Prisma Studio para inspecionar o banco
```

Não há suíte de testes automatizados; valide com `npm run build` e navegando no app (`.claude/launch.json` tem a config "dev", que sobe com `-H 0.0.0.0` para abrir pelo celular na rede local — os IPs permitidos ficam em `allowedDevOrigins` no `next.config.mjs`).

Não há pasta de migrations: mudanças em `prisma/schema.prisma` são aplicadas com `db:push`. Para produção, o README indica trocar o provider para `postgresql` e definir `DATABASE_URL`/`AUTH_SECRET`.

## Stack

Next.js 15 (App Router, Server Components, Server Actions), React 19, Prisma 6 + SQLite, Tailwind 3, `jose` (JWT em cookie), `bcryptjs`, `qrcode`. Sem biblioteca de UI nem de ícones (ver `src/components/Icon.tsx`).

## Arquitetura

- **Multi-tenant por `companyId`.** `requireSession()`/`requireCompany()` (`src/lib/auth.ts`) devolvem o `companyId` da sessão; **toda** query e mutation autenticada deve filtrar por ele (`findFirst({ where: { id, companyId } })`, `updateMany`/`deleteMany` com `companyId`). `src/middleware.ts` só faz a barreira rápida de `/app/*` (roda no edge e lê `AUTH_SECRET` por conta própria, com o mesmo fallback de `authSecret()` — mantenha os dois em sincronia).
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

- Dinheiro é `Float` em reais; arredonde com `round2`. Status/tipos são `String` (SQLite sem enum) — valores e rótulos em `src/lib/constants.ts`.
- Datas de formulário: `parseInputDate` grava meio-dia UTC (evita “voltar um dia”); `datetime-local` é interpretado como Brasília (`parseInputDateTime`). Atraso de parcela usa `isOverdue` (comparação por dia em Brasília), nunca `dueDate < now`.
- Imagens (logo, fotos, assinaturas) são data URLs redimensionadas no navegador (`fileToDataUrl`) e salvas no banco — limite de body das actions em `next.config.mjs` (8 MB).
- Next 15: `params`/`searchParams` são `Promise` e precisam de `await`. Arquivos `page.tsx` só podem exportar o default e metadados — componentes auxiliares vão para `src/components`.
- Layout responsivo é requisito: teste em largura de celular (375px) e desktop.
