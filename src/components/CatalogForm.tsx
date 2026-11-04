"use client";

import { useState } from "react";
import type { CatalogItem } from "@prisma/client";
import { UNITS } from "@/lib/constants";
import { money } from "@/lib/format";
import { ImageInput, SubmitButton } from "./client";

export function CatalogForm({ item, defaultType, action }: { item?: CatalogItem | null; defaultType: string; action: (fd: FormData) => Promise<void> }) {
  const [type, setType] = useState(item?.type ?? defaultType);
  const [price, setPrice] = useState(item?.price ?? 0);
  const [cost, setCost] = useState(item?.cost ?? 0);
  const [markup, setMarkup] = useState(50);
  const [track, setTrack] = useState(item?.trackStock ?? false);
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return (
    <form action={action} className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        {[["SERVICE", "Serviço"], ["PRODUCT", "Produto"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${type === k ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="sm:col-span-2">
        <ImageInput name="photo" defaultValue={item?.photo} label="Foto (aparece no orçamento)" max={800} />
      </div>
      <label className="sm:col-span-2">
        <span className="label">Nome *</span>
        <input name="name" required defaultValue={item?.name} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Descrição</span>
        <textarea name="description" rows={2} defaultValue={item?.description ?? ""} className="input" />
      </label>
      <label>
        <span className="label">Unidade</span>
        <select name="unit" defaultValue={item?.unit ?? (type === "SERVICE" ? "serviço" : "un")} className="input">
          {UNITS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </label>
      <label>
        <span className="label">Custo (R$)</span>
        <input name="cost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="input" />
      </label>
      <label>
        <span className="label">Preço de venda (R$)</span>
        <input name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input" />
      </label>
      <div className="rounded-xl bg-slate-50 p-3 text-sm">
        <div className="mb-1 font-semibold">Calculadora de preço</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Markup</span>
          <input type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="input w-20 px-2 py-1" />
          <span>%</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPrice(Math.round(cost * (1 + markup / 100) * 100) / 100)}>Aplicar</button>
        </div>
        <div className="mt-1 text-xs text-slate-500">Lucro {money(profit)} · margem {margin.toFixed(1)}%</div>
      </div>

      {type === "PRODUCT" && (
        <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:col-span-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input type="checkbox" name="trackStock" checked={track} onChange={(e) => setTrack(e.target.checked)} className="h-4 w-4" />
            Controlar estoque deste produto
          </label>
          {track && (
            <label>
              <span className="label">Quantidade em estoque</span>
              <input name="stock" type="number" step="any" defaultValue={item?.stock ?? 0} className="input" />
            </label>
          )}
        </div>
      )}
      {type !== "PRODUCT" && <input type="hidden" name="stock" value={item?.stock ?? 0} />}

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" defaultChecked={item?.active ?? true} onChange={(e) => {
          const h = e.currentTarget.form?.elements.namedItem("active") as HTMLInputElement;
          h.value = e.target.checked ? "on" : "off";
        }} className="h-4 w-4" />
        Ativo (aparece na seleção de itens)
        <input type="hidden" name="active" defaultValue={item?.active === false ? "off" : "on"} />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary w-full sm:w-auto">Salvar</SubmitButton>
      </div>
    </form>
  );
}
