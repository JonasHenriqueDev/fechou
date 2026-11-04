# Fechou

> Orçamento no WhatsApp, aprovação com assinatura, Pix e recibo — tudo fechado num link.

Plataforma web de orçamentos para MEI, autônomos e prestadores de serviço. Funciona no navegador do celular e do computador, sem instalar nada.

## Funcionalidades

- **Orçamentos**: serviços e produtos com foto, quantidade, unidade e preço; desconto (R$ ou %), taxa de entrega, validade, prazo, formas de pagamento, garantia, observações e fotos anexas. Também dá para duplicar, aprovar ou recusar manualmente e reabrir.
- **Portal do cliente** (link enviado pelo WhatsApp): o cliente vê o orçamento, aprova com assinatura feita com o dedo (com data e hora), recusa informando o motivo, baixa o PDF e paga via Pix.
- **Acompanhamento**: notificação quando o cliente abre, aprova ou recusa, além da contagem de visualizações.
- **Pedidos e ordens de serviço**: gerados a partir do orçamento com um clique ou criados do zero, com status, pagamento à vista, parcelado ou com entrada, e portal com parcelas, Pix e recibos.
- **Recibos**: gerados automaticamente a cada recebimento, com valor por extenso. Também há recibo avulso.
- **QR Code Pix**: Pix copia e cola com o valor do documento ou da próxima parcela.
- **Catálogo e estoque**: produtos e serviços com foto, preço e custo, calculadora de markup e baixa ou devolução automática de estoque.
- **Clientes**: histórico (orçamentos, pedidos, valor pago, em atraso e a receber), atalhos de WhatsApp, ligação e e-mail, e importação da agenda do celular ou de arquivos .vcf/.csv.
- **Financeiro**: receitas e despesas por categoria, fluxo de caixa com saldo, contas a receber e extrato em PDF.
- **Relatórios**: mais vendidos, ticket médio, lucro bruto estimado, conversão de orçamentos e recebimentos por forma de pagamento.
- **Agenda**: compromissos por cliente, com lembretes no navegador.
- **Minha empresa**: logo, cor dos documentos, assinatura, dados, chave Pix, redes sociais e textos padrão.
- **Gerador grátis** sem cadastro (`/gerador`) e landing page (`/`).

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions), **React 19**, **TypeScript**, **Tailwind CSS 3**
- **PostgreSQL** com **Prisma 6** e migrations versionadas (`prisma/migrations`). Em produção usa **Neon** e em dev, Postgres no Docker.
- **Better Auth**: login por e-mail e senha, sessões no banco e rate limit no login e no cadastro.
- **Vercel Blob**: armazenamento de logos, fotos e assinaturas.
- **Vitest**: testes unitários. **ESLint**: lint (`next/core-web-vitals` e `next/typescript`).
- Hospedagem na **Vercel**, com deploy automático a cada push na `main`.

## Rodando localmente

Pré-requisitos: Node 20+ e Docker.

```bash
npm install
cp .env.example .env   # e gere um BETTER_AUTH_SECRET
npm run db:up          # sobe o Postgres local (docker-compose.yml)
npm run db:migrate     # aplica as migrations
npm run db:seed        # opcional: login demo@fechou.test / demo123
npm run dev
```

Acesse http://localhost:3000.

### Scripts úteis

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` / `npm run typecheck` | Lint e checagem de tipos |
| `npm run build` | Build de produção |
| `npm run db:migrate -- --name <nome>` | Cria uma migration após editar o `schema.prisma` |
| `npm run db:studio` | Abre o Prisma Studio |

## Produção (Vercel)

O projeto `fechou` na Vercel já está ligado a:

- **Neon Postgres**, que injeta `DATABASE_URL` e `DATABASE_URL_UNPOOLED`;
- **Vercel Blob**, que injeta `BLOB_READ_WRITE_TOKEN`;
- `BETTER_AUTH_SECRET`, definido separadamente para Production e Preview.

No deploy, a Vercel roda o script `vercel-build`, que executa `prisma migrate deploy` **só em produção**. Os previews usam o mesmo banco, então não migram nada: uma branch com migration nova só altera o banco quando entra na `main`. Para publicar, basta dar push na `main`. Os previews saem de qualquer outra branch.

Para usar um domínio próprio, adicione-o no painel da Vercel e defina `BETTER_AUTH_URL=https://seu-dominio` em Production.
