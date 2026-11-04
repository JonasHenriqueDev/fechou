const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const money = (v: number | null | undefined) => brl.format(v ?? 0);

export const num = (v: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(v);

const TZ = "America/Sao_Paulo";

export const date = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ }) : "—";

export const dateTime = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

export const time = (d: Date | string) =>
  new Date(d).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

/** "2026-10-14" para inputs type=date */
export const inputDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

/** Converte "2026-10-14" em Date ao meio-dia UTC, para não “voltar um dia” por fuso. */
export const parseInputDate = (s: string | null | undefined) =>
  s ? new Date(`${s}T12:00:00Z`) : null;

/** "2026-10-14T09:30" para inputs datetime-local (horário de Brasília) */
export const inputDateTime = (d: Date | string | null | undefined) => {
  if (!d) return "";
  const x = new Date(new Date(d).getTime() - 3 * 3600_000);
  return x.toISOString().slice(0, 16);
};

/** Interpreta o valor de um datetime-local como horário de Brasília (UTC-3). */
export const parseInputDateTime = (s: string | null | undefined) =>
  s ? new Date(`${s}:00-03:00`) : null;

/** "YYYY-MM-DD" do dia em Brasília. */
export const brDay = (d: Date | string = new Date()) =>
  new Date(new Date(d).getTime() - 3 * 3600_000).toISOString().slice(0, 10);

/** Vencida só a partir do dia seguinte ao vencimento (comparação por dia, não por hora). */
export const isOverdue = (due: Date | string, now: Date = new Date()) => brDay(due) < brDay(now);

export const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

/** Link wa.me; assume DDI 55 quando o número tem 10–11 dígitos. Sem número abre o seletor de contato. */
export function whatsappLink(phone: string | null | undefined, text: string) {
  let d = onlyDigits(phone);
  if (d && d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
