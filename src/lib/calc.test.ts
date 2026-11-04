import { describe, expect, it } from "vitest";
import { calcTotals, round2, splitInstallments } from "./calc";

describe("round2", () => {
  it("arredonda centavos sem erro de ponto flutuante", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("calcTotals", () => {
  const items = [
    { type: "SERVICE", quantity: 2, unitPrice: 150 },
    { type: "PRODUCT", quantity: 3, unitPrice: 19.9 },
  ];

  it("separa serviços e produtos e soma o subtotal", () => {
    const t = calcTotals(items, "VALUE", 0, 0);
    expect(t.services).toBe(300);
    expect(t.products).toBe(59.7);
    expect(t.subtotal).toBe(359.7);
    expect(t.total).toBe(359.7);
  });

  it("aplica desconto em R$ e taxa de entrega", () => {
    expect(calcTotals(items, "VALUE", 59.7, 20).total).toBe(320);
  });

  it("aplica desconto percentual sobre o subtotal", () => {
    const t = calcTotals(items, "PERCENT", 10, 0);
    expect(t.discount).toBe(35.97);
    expect(t.total).toBe(323.73);
  });

  it("nunca deixa o total negativo", () => {
    expect(calcTotals(items, "VALUE", 10_000, 0).total).toBe(0);
  });

  it("trata quantidade/preço vazios como zero", () => {
    expect(calcTotals([{ type: "PRODUCT", quantity: NaN, unitPrice: 10 }], "VALUE", 0, 0).total).toBe(0);
  });
});

describe("splitInstallments", () => {
  it("divide e joga a diferença de centavos na primeira parcela", () => {
    const p = splitInstallments(100, 3, new Date("2026-01-10T12:00:00Z"));
    expect(p.map((x) => x.amount)).toEqual([33.34, 33.33, 33.33]);
    expect(round2(p.reduce((s, x) => s + x.amount, 0))).toBe(100);
  });

  it("espaça os vencimentos pelo intervalo", () => {
    const p = splitInstallments(90, 3, new Date("2026-01-10T12:00:00Z"), 15);
    expect(p.map((x) => x.dueDate.toISOString().slice(0, 10))).toEqual(["2026-01-10", "2026-01-25", "2026-02-09"]);
    expect(p.map((x) => x.number)).toEqual([1, 2, 3]);
  });
});
