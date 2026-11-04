"use client";

import Link from "next/link";
import { useState } from "react";
import { calcTotals } from "@/lib/calc";
import { money } from "@/lib/format";
import { fileToDataUrl } from "./client";
import { Icon } from "./Icon";

type Item = { key: number; type: "SERVICE" | "PRODUCT"; name: string; quantity: number; unitPrice: number };

/** Ferramenta pública sem cadastro: tudo roda no navegador, nada é salvo no servidor. */
export function FreeGenerator() {
  const [company, setCompany] = useState({ name: "", phone: "", document: "", logo: "" });
  const [client, setClient] = useState({ name: "", phone: "" });
  const [items, setItems] = useState<Item[]>([{ key: 1, type: "SERVICE", name: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [fee, setFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(15);
  const t = calcTotals(items, "VALUE", discount, fee);
  const today = new Date();
  const valid = new Date(today.getTime() + validDays * 86400000);

  const upd = (k: number, p: Partial<Item>) => setItems(items.map((i) => (i.key === k ? { ...i, ...p } : i)));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-7 w-7" /> Fechou
          </Link>
          <Link href="/cadastro" className="btn-primary btn-sm">Salvar e enviar pelo WhatsApp →</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        <div className="no-print space-y-4">
          <div>
            <h1 className="page-title">Gerador de orçamento grátis</h1>
            <p className="text-sm text-slate-500">Preencha, confira a prévia e baixe o PDF. Sem cadastro.</p>
          </div>
          <section className="card grid gap-3 p-4 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Sua empresa</h2>
            <input className="input sm:col-span-2" placeholder="Nome da empresa" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            <input className="input" placeholder="Telefone / WhatsApp" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
            <input className="input" placeholder="CPF / CNPJ" value={company.document} onChange={(e) => setCompany({ ...company, document: e.target.value })} />
            <label className="btn-secondary btn-sm cursor-pointer sm:col-span-2">
              {company.logo ? "Trocar logo" : "Adicionar logo"}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCompany({ ...company, logo: await fileToDataUrl(f, 400) }); }} />
            </label>
          </section>
          <section className="card grid gap-3 p-4 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Cliente</h2>
            <input className="input" placeholder="Nome do cliente" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            <input className="input" placeholder="Telefone" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
          </section>
          <section className="card space-y-3 p-4">
            <h2 className="font-semibold">Itens</h2>
            {items.map((i) => (
              <div key={i.key} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-slate-200 p-2">
                <input className="input" placeholder="Descrição do serviço ou produto" value={i.name} onChange={(e) => upd(i.key, { name: e.target.value })} />
                <select className="input w-28" value={i.type} onChange={(e) => upd(i.key, { type: e.target.value as Item["type"] })}>
                  <option value="SERVICE">Serviço</option>
                  <option value="PRODUCT">Produto</option>
                </select>
                <div className="col-span-2 grid grid-cols-[80px_1fr_auto] items-center gap-2">
                  <input type="number" min="0" step="any" className="input" value={i.quantity} onChange={(e) => upd(i.key, { quantity: Number(e.target.value) })} aria-label="Quantidade" />
                  <input type="number" min="0" step="0.01" className="input" value={i.unitPrice} onChange={(e) => upd(i.key, { unitPrice: Number(e.target.value) })} aria-label="Valor unitário" />
                  <button className="btn-danger btn-sm" onClick={() => setItems(items.filter((x) => x.key !== i.key))} aria-label="Remover"><Icon name="trash" className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <button className="btn-secondary btn-sm" onClick={() => setItems([...items, { key: Date.now(), type: "SERVICE", name: "", quantity: 1, unitPrice: 0 }])}>
              <Icon name="plus" className="h-4 w-4" /> Adicionar item
            </button>
            <div className="grid grid-cols-3 gap-2">
              <label><span className="label">Taxa</span><input type="number" min="0" step="0.01" className="input" value={fee} onChange={(e) => setFee(Number(e.target.value))} /></label>
              <label><span className="label">Desconto</span><input type="number" min="0" step="0.01" className="input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></label>
              <label><span className="label">Validade (dias)</span><input type="number" min="1" className="input" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} /></label>
            </div>
            <textarea className="input" rows={2} placeholder="Observações, prazo, formas de pagamento..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>
          <button className="btn-primary w-full py-3" onClick={() => window.print()}>
            <Icon name="download" className="h-4 w-4" /> Baixar PDF
          </button>
        </div>

        {/* Prévia / impressão */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card print-area p-6 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {company.logo && <img src={company.logo} alt="" className="h-14 w-14 object-contain" />}
                <div>
                  <div className="text-base font-bold">{company.name || "Sua empresa"}</div>
                  <div className="text-slate-500">{[company.phone, company.document].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase text-slate-500">Orçamento</div>
                <div className="text-slate-600">{today.toLocaleDateString("pt-BR")}</div>
                <div className="text-xs text-slate-500">Válido até {valid.toLocaleDateString("pt-BR")}</div>
              </div>
            </div>
            {client.name && <div className="mt-3"><span className="text-slate-500">Cliente:</span> <b>{client.name}</b> {client.phone}</div>}
            <table className="mt-4 w-full">
              <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <tr><th className="py-1">Item</th><th className="text-right">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.filter((i) => i.name).map((i) => (
                  <tr key={i.key}><td className="py-1.5">{i.name}</td><td className="text-right">{i.quantity}</td><td className="text-right">{money(i.unitPrice)}</td><td className="text-right">{money(i.quantity * i.unitPrice)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-4 w-56 space-y-1">
              {t.deliveryFee > 0 && <div className="flex justify-between"><span>Taxa</span><span>{money(t.deliveryFee)}</span></div>}
              {t.discount > 0 && <div className="flex justify-between"><span>Desconto</span><span>- {money(t.discount)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><span>Total</span><span>{money(t.total)}</span></div>
            </div>
            {notes && <div className="mt-4 whitespace-pre-line text-slate-700">{notes}</div>}
            <div className="mt-6 text-center text-[11px] text-slate-400">Gerado gratuitamente no Fechou</div>
          </div>
          <div className="no-print card mt-4 p-4 text-sm">
            <b>Quer aprovação online, assinatura e Pix?</b> Crie sua conta grátis e envie o link pelo WhatsApp.
            <Link href="/cadastro" className="btn-primary btn-sm mt-2 w-full">Criar conta grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
