# OrçaFácil

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

## Rodando localmente

```bash
npm install
npm run db:push
npm run db:seed   # opcional: login demo@orcafacil.test / demo123
npm run dev
```

Acesse http://localhost:3000.

## Produção

1. Troque `provider = "sqlite"` por `"postgresql"` em `prisma/schema.prisma` e defina `DATABASE_URL`.
2. Defina um `AUTH_SECRET` longo e aleatório.
3. Rode `npm run build && npm start`. Funciona em Vercel, Railway, Render ou VPS.
