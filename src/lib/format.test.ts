import { describe, expect, it } from "vitest";
import { brDay, inputDate, isOverdue, parseInputDate, parseInputDateTime, whatsappLink } from "./format";
import { docCode, publicToken } from "./tokens";

describe("datas", () => {
  it("parseInputDate grava meio-dia UTC (não volta um dia)", () => {
    const d = parseInputDate("2026-10-14")!;
    expect(d.toISOString()).toBe("2026-10-14T12:00:00.000Z");
    expect(inputDate(d)).toBe("2026-10-14");
    expect(parseInputDate("")).toBeNull();
  });

  it("parseInputDateTime interpreta como horário de Brasília", () => {
    expect(parseInputDateTime("2026-10-14T09:30")!.toISOString()).toBe("2026-10-14T12:30:00.000Z");
  });

  it("brDay usa o dia de Brasília", () => {
    expect(brDay(new Date("2026-10-15T02:00:00Z"))).toBe("2026-10-14");
  });

  it("isOverdue compara por dia em Brasília", () => {
    const due = parseInputDate("2026-10-14")!;
    expect(isOverdue(due, new Date("2026-10-14T23:00:00-03:00"))).toBe(false);
    expect(isOverdue(due, new Date("2026-10-15T00:30:00-03:00"))).toBe(true);
  });
});

describe("whatsappLink", () => {
  it("adiciona DDI 55 a números nacionais", () => {
    expect(whatsappLink("(19) 99999-0000", "Olá")).toBe("https://wa.me/5519999990000?text=Ol%C3%A1");
  });
  it("mantém números com DDI", () => {
    expect(whatsappLink("+351 912 345 678", "x")).toBe("https://wa.me/351912345678?text=x");
  });
});

describe("tokens", () => {
  it("docCode usa 4 dígitos + ano com 2 dígitos", () => {
    expect(docCode(7, new Date("2026-05-01"))).toBe("0007-26");
  });
  it("publicToken é longo e único", () => {
    const a = publicToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(publicToken()).not.toBe(a);
  });
});
