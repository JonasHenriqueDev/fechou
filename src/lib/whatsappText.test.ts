import { describe, expect, it } from "vitest";
import { documentText, greetingName } from "./whatsappText";

const base = {
  docLabel: "Orçamento",
  code: "0007-26",
  companyName: "Clima Certo",
  clientName: "Maria Souza",
  discountType: "VALUE",
  discountValue: 0,
  deliveryFee: 0,
};

describe("greetingName", () => {
  it("usa o primeiro nome de pessoa e o nome completo de empresa", () => {
    expect(greetingName("Maria Souza")).toBe("Maria");
    expect(greetingName("Condomínio Residencial Primavera")).toBe("Condomínio Residencial Primavera");
    expect(greetingName("restaurante Sabor")).toBe("restaurante Sabor");
    expect(greetingName("  ")).toBe("");
  });
});

describe("documentText", () => {
  it("lista itens e total sem precisar abrir PDF", () => {
    const t = documentText({
      ...base,
      items: [
        { type: "SERVICE", name: "Instalação split 9.000 BTUs", unit: "un", quantity: 1, unitPrice: 900 },
        { type: "PRODUCT", name: "Tubulação", unit: "m", quantity: 3, unitPrice: 50, description: "Cobre 1/4 e 3/8" },
      ],
      sections: [{ title: "Garantia", text: "90 dias" }, { title: "Observações", text: "  " }],
      closing: "Para aprovar:",
    });
    expect(t).toContain("Olá, Maria! Segue o orçamento de *Clima Certo*:");
    expect(documentText({ ...base, docLabel: "Ordem de serviço", items: [] })).toContain("Segue a ordem de serviço");
    expect(t).toContain("*ORÇAMENTO Nº 0007-26*");
    expect(t).toContain("*Serviços*");
    expect(t).toMatch(/• Instalação split 9\.000 BTUs — R\$\s900,00/);
    expect(t).toMatch(/• Tubulação — 3 m × R\$\s50,00 = R\$\s150,00/);
    expect(t).toContain("_Cobre 1/4 e 3/8_");
    expect(t).toMatch(/\*TOTAL: R\$\s1\.050,00\*/);
    expect(t).toContain("*Garantia:* 90 dias");
    expect(t).not.toContain("Observações");
    expect(t).not.toContain("Subtotal");
    expect(t.endsWith("Para aprovar:")).toBe(true);
  });

  it("mostra subtotal, taxa e desconto quando houver", () => {
    const t = documentText({
      ...base,
      clientName: null,
      discountType: "PERCENT",
      discountValue: 10,
      deliveryFee: 50,
      items: [{ type: "SERVICE", name: "Limpeza", unit: "un", quantity: 1, unitPrice: 200 }],
    });
    expect(t.startsWith("Olá! Segue")).toBe(true);
    expect(t).not.toContain("*Serviços*");
    expect(t).toMatch(/Subtotal: R\$\s200,00/);
    expect(t).toMatch(/Taxa de entrega\/deslocamento: R\$\s50,00/);
    expect(t).toMatch(/Desconto \(10%\): - R\$\s20,00/);
    expect(t).toMatch(/\*TOTAL: R\$\s230,00\*/);
  });
});
