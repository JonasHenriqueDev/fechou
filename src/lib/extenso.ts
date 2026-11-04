// Valor monetário por extenso em português (usado no recibo). Suporta até bilhões.

const U = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (c) parts.push(C[c]);
  if (r) parts.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " e " + U[r % 10] : ""));
  return parts.join(" e ");
}

function inteiro(n: number): string {
  if (n === 0) return "zero";
  const scales: [number, string, string][] = [
    [1e9, "bilhão", "bilhões"],
    [1e6, "milhão", "milhões"],
    [1e3, "mil", "mil"],
    [1, "", ""],
  ];
  const parts: string[] = [];
  let rest = n;
  for (const [v, s, p] of scales) {
    const q = Math.floor(rest / v);
    rest %= v;
    if (!q) continue;
    if (v === 1e3 && q === 1) parts.push("mil");
    else parts.push(`${ate999(q)}${s ? " " + (q === 1 ? s : p) : ""}`);
  }
  if (parts.length > 1) {
    const last = n % 1000;
    const glue = last > 0 && (last < 100 || last % 100 === 0) ? " e " : ", ";
    return parts.slice(0, -1).join(", ") + glue + parts[parts.length - 1];
  }
  return parts[0];
}

export function valorPorExtenso(v: number) {
  const total = Math.round(v * 100);
  const reais = Math.floor(total / 100);
  const cents = total % 100;
  const out: string[] = [];
  if (reais) {
    const w = inteiro(reais);
    const de = reais >= 1e6 && reais % 1e6 === 0 ? " de" : "";
    out.push(`${w}${de} ${reais === 1 ? "real" : "reais"}`);
  }
  if (cents) out.push(`${inteiro(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
  return out.join(" e ") || "zero reais";
}
