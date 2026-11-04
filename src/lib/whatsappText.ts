import { calcTotals, type CalcItem } from "./calc";
import { date, money, num } from "./format";

const BUSINESS = /^(condom[ií]nio|edif[ií]cio|residencial|restaurante|lanchonete|padaria|mercado|supermercado|loja|empresa|cl[ií]nica|consult[óo]rio|escola|col[ée]gio|igreja|hotel|pousada|academia|farm[áa]cia|oficina|associa[çc][ãa]o|instituto|escrit[óo]rio|bar|pizzaria|sal[ãa]o)$/i;

/** Primeiro nome para pessoa; nome completo para empresa/condomínio ("Olá, Condomínio!" soaria estranho). */
export function greetingName(name?: string | null) {
  const n = name?.trim();
  if (!n) return "";
  const first = n.split(/\s+/)[0];
  return BUSINESS.test(first) ? n : first;
}

export type TextItem =CalcItem & { name: string; description?: string | null; unit: string };

/**
 * Documento inteiro em texto para colar no WhatsApp (negrito com *...*).
 * Muitos clientes não abrem PDF nem link: o texto chega e já dá para ler tudo.
 * O link do portal (aprovar/assinar/Pix) é anexado no navegador, pois depende da origin.
 */
export function documentText(d: {
  docLabel: string;
  code: string;
  companyName: string;
  clientName?: string | null;
  title?: string | null;
  issueDate?: Date | null;
  validUntil?: Date | null;
  items: TextItem[];
  discountType: string;
  discountValue: number;
  deliveryFee: number;
  sections?: { title: string; text: string | null | undefined }[];
  closing?: string;
}) {
  const t = calcTotals(d.items, d.discountType, d.discountValue, d.deliveryFee);
  const first = greetingName(d.clientName);
  const lines: string[] = [];

  const article = /^ordem/i.test(d.docLabel) ? "a" : "o";
  lines.push(`Olá${first ? `, ${first}` : ""}! Segue ${article} ${d.docLabel.toLowerCase()} de *${d.companyName}*:`);
  lines.push("");
  lines.push(`*${d.docLabel.toUpperCase()} Nº ${d.code}*`);
  if (d.title?.trim()) lines.push(d.title.trim());
  if (d.issueDate) lines.push(`Data: ${date(d.issueDate)}`);

  const groups = [
    { label: "Serviços", list: d.items.filter((i) => i.type === "SERVICE") },
    { label: "Produtos", list: d.items.filter((i) => i.type !== "SERVICE") },
  ].filter((g) => g.list.length > 0);
  const showGroups = groups.length > 1;

  for (const g of groups) {
    lines.push("");
    if (showGroups) lines.push(`*${g.label}*`);
    for (const i of g.list) {
      const qty = i.quantity || 0;
      const price = i.unitPrice || 0;
      const detail = qty === 1 ? money(price) : `${num(qty)} ${i.unit} × ${money(price)} = ${money(qty * price)}`;
      lines.push(`• ${i.name.trim()} — ${detail}`);
      if (i.description?.trim()) lines.push(`   _${i.description.trim().replace(/\s*\n\s*/g, " ")}_`);
    }
  }

  lines.push("");
  const extras = t.deliveryFee > 0 || t.discount > 0;
  if (extras) lines.push(`Subtotal: ${money(t.subtotal)}`);
  if (t.deliveryFee > 0) lines.push(`Taxa de entrega/deslocamento: ${money(t.deliveryFee)}`);
  if (t.discount > 0) lines.push(`Desconto${d.discountType === "PERCENT" ? ` (${num(d.discountValue)}%)` : ""}: - ${money(t.discount)}`);
  lines.push(`*TOTAL: ${money(t.total)}*`);

  for (const s of d.sections ?? []) {
    if (s.text?.trim()) {
      lines.push("");
      lines.push(`*${s.title}:* ${s.text.trim()}`);
    }
  }
  if (d.validUntil) {
    lines.push("");
    lines.push(`Válido até ${date(d.validUntil)}.`);
  }
  if (d.closing) {
    lines.push("");
    lines.push(d.closing);
  }
  return lines.join("\n");
}
