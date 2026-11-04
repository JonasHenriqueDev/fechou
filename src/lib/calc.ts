export type CalcItem = { type: string; quantity: number; unitPrice: number };

export const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Regra única de totais para orçamentos, pedidos e o gerador gratuito. */
export function calcTotals(
  items: CalcItem[],
  discountType: string,
  discountValue: number,
  deliveryFee: number,
) {
  const sum = (pred: (i: CalcItem) => boolean) =>
    round2(items.filter(pred).reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0));
  const services = sum((i) => i.type === "SERVICE");
  const products = sum((i) => i.type !== "SERVICE");
  const subtotal = round2(services + products);
  const discount = round2(
    discountType === "PERCENT" ? (subtotal * (discountValue || 0)) / 100 : discountValue || 0,
  );
  const fee = deliveryFee || 0;
  const total = round2(Math.max(0, subtotal + fee - discount));
  return { services, products, subtotal, discount, deliveryFee: fee, total };
}

/** Divide o total em N parcelas; a diferença de centavos vai para a primeira. */
export function splitInstallments(total: number, n: number, firstDue: Date, intervalDays = 30) {
  const base = Math.floor((total / n) * 100) / 100;
  const first = round2(total - base * (n - 1));
  return Array.from({ length: n }, (_, i) => {
    const due = new Date(firstDue);
    due.setUTCDate(due.getUTCDate() + i * intervalDays);
    return { number: i + 1, amount: i === 0 ? first : base, dueDate: due };
  });
}
