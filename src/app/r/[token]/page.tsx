import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PAYMENT_METHODS } from "@/lib/constants";
import { date, dateTime, money } from "@/lib/format";
import { valorPorExtenso } from "@/lib/extenso";
import { PrintButton, WhatsAppShare } from "@/components/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recibo", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await db.receipt.findUnique({
    where: { token },
    include: { company: true, payment: { include: { client: true, order: true, installment: true } } },
  });
  if (!r) notFound();
  const c = r.company;
  const p = r.payment;
  const s = await getSession();
  const isOwner = s?.companyId === c.id;
  const color = c.primaryColor || "#1d5cf1";

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 sm:py-8">
      <title>{`Recibo-${r.code}-${c.name}`}</title>
      <div className="no-print mx-auto mb-3 flex max-w-2xl flex-wrap justify-end gap-2">
        {isOwner && (
          <WhatsAppShare phone={p.client?.phone} message={`Olá${p.client ? `, ${p.client.name.split(" ")[0]}` : ""}! Segue seu recibo nº ${r.code} no valor de ${money(p.amount)}. Obrigado!`} path={`/r/${token}`} label="Enviar recibo" />
        )}
        <PrintButton className="btn-primary" />
      </div>

      <div className="card print-area mx-auto max-w-2xl overflow-hidden">
        <div className="h-2" style={{ background: color }} />
        <div className="space-y-6 p-6 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {c.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logo} alt="" className="h-16 w-16 rounded-lg object-contain" />
              )}
              <div className="text-sm">
                <div className="text-lg font-bold">{c.name}</div>
                {c.document && <div className="text-slate-600">CPF/CNPJ: {c.document}</div>}
                <div className="text-slate-600">{[c.phone || c.whatsapp, c.email].filter(Boolean).join(" • ")}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recibo</div>
              <div className="whitespace-nowrap text-xl font-bold" style={{ color }}>Nº {r.code}</div>
            </div>
          </div>

          <div className="rounded-xl p-4 text-center" style={{ background: color + "12" }}>
            <div className="text-xs font-semibold uppercase text-slate-500">Valor recebido</div>
            <div className="text-3xl font-bold" style={{ color }}>{money(p.amount)}</div>
          </div>

          <p className="text-[15px] leading-relaxed">
            Recebi(emos) de <b>{p.client?.name ?? "—"}</b>
            {p.client?.document && <> (CPF/CNPJ {p.client.document})</>}, a importância de <b>{money(p.amount)}</b> ({valorPorExtenso(p.amount)}), referente a{" "}
            <b>{r.description}</b>
            {p.installment && <> — parcela {p.installment.number}</>}, paga via <b>{PAYMENT_METHODS[p.method] ?? p.method}</b> em {date(p.paidAt)}.
          </p>
          <p className="text-sm text-slate-600">Para maior clareza, firmo(amos) o presente recibo, dando plena quitação do valor acima.</p>

          <div className="pt-6 text-center text-sm">
            <div className="flex h-20 items-end justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.signature && <img src={c.signature} alt="Assinatura" className="max-h-20 object-contain" />}
            </div>
            <div className="mx-auto max-w-xs border-t border-slate-400 pt-1 font-medium">{c.name}</div>
            <div className="text-xs text-slate-500">{[c.city, c.state].filter(Boolean).join("/")} {[c.city, c.state].some(Boolean) && "—"} {date(p.paidAt)}</div>
          </div>
          <div className="text-center text-[11px] text-slate-400">Recibo digital emitido em {dateTime(r.createdAt)} · código {r.token.slice(0, 8)}</div>
        </div>
      </div>
    </div>
  );
}
