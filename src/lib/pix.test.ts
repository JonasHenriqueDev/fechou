import { describe, expect, it } from "vitest";
import { pixPayload } from "./pix";

// CRC16-CCITT (0xFFFF, poli 0x1021) independente da implementação do app.
function crc(s: string) {
  let c = 0xffff;
  for (const ch of Buffer.from(s, "utf8")) {
    c ^= ch << 8;
    for (let i = 0; i < 8; i++) c = (c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1) & 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}

/** Lê os campos EMV (ID 2 dígitos + tamanho 2 dígitos + valor). */
function parse(p: string) {
  const out: Record<string, string> = {};
  for (let i = 0; i < p.length; ) {
    const id = p.slice(i, i + 2);
    const len = Number(p.slice(i + 2, i + 4));
    out[id] = p.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

describe("pixPayload", () => {
  const p = pixPayload({ key: "demo@fechou.test", name: "Clima Certo Refrigeração", city: "São Paulo", amount: 150.5, txid: "PED-0007-26" });

  it("termina com CRC16 válido", () => {
    expect(p.slice(-4)).toBe(crc(p.slice(0, -4)));
  });

  it("monta os campos obrigatórios do BR Code", () => {
    const f = parse(p);
    expect(f["00"]).toBe("01");
    expect(f["26"]).toContain("br.gov.bcb.pix");
    expect(f["26"]).toContain("demo@fechou.test");
    expect(f["53"]).toBe("986");
    expect(f["54"]).toBe("150.50");
    expect(f["58"]).toBe("BR");
    expect(f["59"]).toBe("Clima Certo Refrigeracao");
    expect(f["60"]).toBe("Sao Paulo");
    expect(f["62"]).toBe("0509PED000726");
  });

  it("omite o valor quando não informado e usa txid padrão", () => {
    const f = parse(pixPayload({ key: "11999990000", name: "Ana", city: "Campinas" }));
    expect(f["54"]).toBeUndefined();
    expect(f["62"]).toBe("0503***");
  });

  it("limita nome a 25 e cidade a 15 caracteres", () => {
    const f = parse(pixPayload({ key: "k", name: "A".repeat(40), city: "B".repeat(40) }));
    expect(f["59"]).toHaveLength(25);
    expect(f["60"]).toHaveLength(15);
  });
});
