/** Mês no formato "YYYY-MM" (horário de Brasília) → intervalo [start, end). */
export function monthRange(m?: string | null) {
  const now = new Date(Date.now() - 3 * 3600_000);
  const key = m && /^\d{4}-\d{2}$/.test(m) ? m : now.toISOString().slice(0, 7);
  const [y, mo] = key.split("-").map(Number);
  const start = new Date(`${key}-01T00:00:00-03:00`);
  const nextKey = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  const prevKey = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
  const end = new Date(`${nextKey}-01T00:00:00-03:00`);
  const label = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  return { key, start, end, nextKey, prevKey, label };
}
