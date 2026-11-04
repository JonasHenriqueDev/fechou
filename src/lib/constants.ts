export const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  SENT: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  VIEWED: { label: "Visualizado", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Aprovado", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Recusado", className: "bg-red-100 text-red-700" },
  CONVERTED: { label: "Convertido em pedido", className: "bg-violet-100 text-violet-700" },
};

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Aberto", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Em andamento", className: "bg-amber-100 text-amber-800" },
  DONE: { label: "Concluído", className: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

export const ORDER_KIND: Record<string, string> = {
  ORDER: "Pedido",
  SERVICE_ORDER: "Ordem de serviço",
};

export const PAYMENT_METHODS: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export const INCOME_CATEGORIES = ["Vendas", "Serviços", "Outras receitas"];
export const EXPENSE_CATEGORIES = [
  "Materiais", "Combustível", "Alimentação", "Ferramentas", "Aluguel", "Impostos",
  "Marketing", "Funcionários", "Contas (água, luz, internet)", "Outras despesas",
];

export const UNITS = ["un", "h", "m", "m²", "m³", "kg", "L", "cx", "pç", "diária", "serviço"];
