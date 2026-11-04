"use client";

import { useMemo, useState } from "react";
import { calcTotals } from "@/lib/calc";
import { money } from "@/lib/format";
import { UNITS } from "@/lib/constants";
import { fileToDataUrl, SubmitButton } from "./client";
import { Icon } from "./Icon";

export type EditorItem = {
  key: string;
  catalogItemId: string | null;
  type: "SERVICE" | "PRODUCT";
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  photo: string | null;
};

export type EditorPhoto = { key: string; image: string; caption: string };

export type EditorValue = {
  clientId: string;
  newClientName: string;
  newClientPhone: string;
  title: string;
  issueDate: string;
  validUntil: string;
  executionTerm: string;
  paymentConditions: string;
  warranty: string;
  notes: string;
  discountType: "VALUE" | "PERCENT";
  discountValue: number;
  deliveryFee: number;
  kind: string;
  scheduledDate: string;
  items: EditorItem[];
  photos: EditorPhoto[];
};

type CatalogOption = { id: string; type: string; name: string; description: string | null; unit: string; price: number; photo: string | null; stock: number; trackStock: boolean };
type ClientOption = { id: string; name: string; phone: string | null };

const key = () => Math.random().toString(36).slice(2);

export function DocumentEditor({
  mode,
  initial,
  clients,
  catalog,
  action,
  submitLabel,
}: {
  mode: "quote" | "order";
  initial: EditorValue;
  clients: ClientOption[];
  catalog: CatalogOption[];
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [v, setV] = useState<EditorValue>(initial);
  const [picker, setPicker] = useState<null | "SERVICE" | "PRODUCT">(null);
  const [search, setSearch] = useState("");
  const set = <K extends keyof EditorValue>(k: K, val: EditorValue[K]) => setV((s) => ({ ...s, [k]: val }));
  const totals = useMemo(() => calcTotals(v.items, v.discountType, v.discountValue, v.deliveryFee), [v]);

  const updateItem = (k: string, patch: Partial<EditorItem>) =>
    set("items", v.items.map((i) => (i.key === k ? { ...i, ...patch } : i)));

  const addBlank = (type: "SERVICE" | "PRODUCT") =>
    set("items", [...v.items, { key: key(), catalogItemId: null, type, name: "", description: "", unit: type === "SERVICE" ? "serviço" : "un", quantity: 1, unitPrice: 0, photo: null }]);

  const addFromCatalog = (c: CatalogOption) => {
    set("items", [
      ...v.items,
      { key: key(), catalogItemId: c.id, type: c.type as "SERVICE" | "PRODUCT", name: c.name, description: c.description ?? "", unit: c.unit, quantity: 1, unitPrice: c.price, photo: c.photo },
    ]);
    setPicker(null);
    setSearch("");
  };

  const move = (k: string, dir: -1 | 1) => {
    const idx = v.items.findIndex((i) => i.key === k);
    const to = idx + dir;
    if (to < 0 || to >= v.items.length) return;
    const arr = [...v.items];
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    set("items", arr);
  };

  const groups: { type: "SERVICE" | "PRODUCT"; label: string; total: number }[] = [
    { type: "SERVICE", label: "Serviços", total: totals.services },
    { type: "PRODUCT", label: "Produtos", total: totals.products },
  ];

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />

      <div className="space-y-5">
        {/* Cliente */}
        <section className="card space-y-3 p-4 sm:p-5">
          <h2 className="font-semibold">Cliente</h2>
          <select className="input" value={v.clientId} onChange={(e) => set("clientId", e.target.value)}>
            <option value="">— Novo cliente / sem cliente —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.phone ? ` · ${c.phone}` : ""}
              </option>
            ))}
          </select>
          {!v.clientId && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Nome do novo cliente (opcional)" value={v.newClientName} onChange={(e) => set("newClientName", e.target.value)} />
              <input className="input" placeholder="WhatsApp" inputMode="tel" value={v.newClientPhone} onChange={(e) => set("newClientPhone", e.target.value)} />
            </div>
          )}
        </section>

        {/* Dados gerais */}
        <section className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          <h2 className="font-semibold sm:col-span-2">Dados {mode === "quote" ? "do orçamento" : "do pedido"}</h2>
          {mode === "order" && (
            <label className="sm:col-span-2">
              <span className="label">Tipo</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["ORDER", "Pedido de venda"],
                  ["SERVICE_ORDER", "Ordem de serviço"],
                ].map(([k, l]) => (
                  <button type="button" key={k} onClick={() => set("kind", k)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${v.kind === k ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </label>
          )}
          <label className="sm:col-span-2">
            <span className="label">Título / descrição (opcional)</span>
            <input className="input" placeholder="Ex.: Instalação de ar-condicionado no escritório" value={v.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label>
            <span className="label">Data de emissão</span>
            <input type="date" className="input" value={v.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </label>
          {mode === "quote" ? (
            <label>
              <span className="label">Válido até</span>
              <input type="date" className="input" value={v.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
            </label>
          ) : (
            <label>
              <span className="label">Data de entrega / execução</span>
              <input type="date" className="input" value={v.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
            </label>
          )}
        </section>

        {/* Itens */}
        {groups.map((g) => {
          const list = v.items.filter((i) => i.type === g.type);
          return (
            <section key={g.type} className="card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  {g.label} <span className="text-sm font-normal text-slate-500">· {money(g.total)}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {list.map((i) => (
                  <div key={i.key} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex gap-3">
                      <ItemPhoto value={i.photo} onChange={(photo) => updateItem(i.key, { photo })} />
                      <div className="grid flex-1 gap-2">
                        <input className="input" placeholder={g.type === "SERVICE" ? "Nome do serviço" : "Nome do produto"} value={i.name} onChange={(e) => updateItem(i.key, { name: e.target.value })} />
                        <textarea className="input min-h-[40px]" rows={1} placeholder="Descrição (opcional)" value={i.description} onChange={(e) => updateItem(i.key, { description: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
                      <label>
                        <span className="label">Qtd</span>
                        <input type="number" step="any" min="0" className="input" value={i.quantity} onChange={(e) => updateItem(i.key, { quantity: Number(e.target.value) })} />
                      </label>
                      <label>
                        <span className="label">Unid.</span>
                        <select className="input" value={i.unit} onChange={(e) => updateItem(i.key, { unit: e.target.value })}>
                          {[...new Set([...UNITS, i.unit])].map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="label">Valor unit.</span>
                        <input type="number" step="0.01" min="0" className="input" value={i.unitPrice} onChange={(e) => updateItem(i.key, { unitPrice: Number(e.target.value) })} />
                      </label>
                      <div className="col-span-3 flex items-end justify-between gap-1 sm:col-span-1">
                        <span className="text-sm font-semibold sm:hidden">{money(i.quantity * i.unitPrice)}</span>
                        <div className="flex gap-1">
                          <button type="button" className="btn-secondary btn-sm" onClick={() => move(i.key, -1)} aria-label="Subir">↑</button>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => move(i.key, 1)} aria-label="Descer">↓</button>
                          <button type="button" className="btn-danger btn-sm" onClick={() => set("items", v.items.filter((x) => x.key !== i.key))} aria-label="Remover">
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 hidden text-right text-sm font-semibold sm:block">{money(i.quantity * i.unitPrice)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setPicker(g.type)}>
                  <Icon name="box" className="h-4 w-4" /> Do catálogo
                </button>
                <button type="button" className="btn-secondary btn-sm" onClick={() => addBlank(g.type)}>
                  <Icon name="plus" className="h-4 w-4" /> Item avulso
                </button>
              </div>
            </section>
          );
        })}

        {/* Condições */}
        <section className="card grid gap-3 p-4 sm:p-5">
          <h2 className="font-semibold">Condições e observações</h2>
          {mode === "quote" && (
            <>
              <label>
                <span className="label">Prazo de execução / entrega</span>
                <input className="input" placeholder="Ex.: 5 dias úteis após aprovação" value={v.executionTerm} onChange={(e) => set("executionTerm", e.target.value)} />
              </label>
              <label>
                <span className="label">Formas de pagamento</span>
                <textarea className="input" rows={2} placeholder="Ex.: 50% na aprovação e 50% na entrega. Pix, cartão ou dinheiro." value={v.paymentConditions} onChange={(e) => set("paymentConditions", e.target.value)} />
              </label>
              <label>
                <span className="label">Garantia</span>
                <input className="input" placeholder="Ex.: 90 dias para mão de obra" value={v.warranty} onChange={(e) => set("warranty", e.target.value)} />
              </label>
            </>
          )}
          <label>
            <span className="label">Observações</span>
            <textarea className="input" rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </section>

        {/* Fotos */}
        {mode === "quote" && (
          <section className="card p-4 sm:p-5">
            <h2 className="font-semibold">Fotos do orçamento</h2>
            <p className="mb-3 text-sm text-slate-500">Antes, depois, referências e anexos.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {v.photos.map((p) => (
                <div key={p.key} className="overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="aspect-square w-full object-cover" />
                  <div className="flex gap-1 p-1.5">
                    <input className="input px-2 py-1 text-xs" placeholder="Legenda" value={p.caption} onChange={(e) => set("photos", v.photos.map((x) => (x.key === p.key ? { ...x, caption: e.target.value } : x)))} />
                    <button type="button" className="text-red-500" onClick={() => set("photos", v.photos.filter((x) => x.key !== p.key))} aria-label="Remover foto">
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400">
                <div className="flex flex-col items-center text-xs">
                  <Icon name="plus" className="h-6 w-6" /> Adicionar fotos
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    const imgs = await Promise.all(files.map((f) => fileToDataUrl(f, 1200)));
                    setV((s) => ({ ...s, photos: [...s.photos, ...imgs.map((image) => ({ key: key(), image, caption: "" }))] }));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
        )}
      </div>

      {/* Resumo (fixo no desktop) */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card space-y-3 p-4 sm:p-5">
          <h2 className="font-semibold">Resumo</h2>
          <Line label="Serviços" value={money(totals.services)} />
          <Line label="Produtos" value={money(totals.products)} />
          <label className="block">
            <span className="label">Taxa de entrega / deslocamento</span>
            <input type="number" step="0.01" min="0" className="input" value={v.deliveryFee} onChange={(e) => set("deliveryFee", Number(e.target.value))} />
          </label>
          <div>
            <span className="label">Desconto</span>
            <div className="flex gap-2">
              <select className="input w-24" value={v.discountType} onChange={(e) => set("discountType", e.target.value as "VALUE" | "PERCENT")}>
                <option value="VALUE">R$</option>
                <option value="PERCENT">%</option>
              </select>
              <input type="number" step="0.01" min="0" className="input" value={v.discountValue} onChange={(e) => set("discountValue", Number(e.target.value))} />
            </div>
          </div>
          {totals.discount > 0 && <Line label="Desconto" value={`- ${money(totals.discount)}`} />}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span className="text-brand-600">{money(totals.total)}</span>
          </div>
          <SubmitButton className="btn-primary w-full">{submitLabel}</SubmitButton>
        </div>
      </aside>

      {/* Seletor do catálogo */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setPicker(null)} />
          <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl bg-white p-4 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{picker === "SERVICE" ? "Serviços" : "Produtos"} do catálogo</h3>
              <button type="button" onClick={() => setPicker(null)} className="p-1 text-slate-500" aria-label="Fechar">
                <Icon name="x" />
              </button>
            </div>
            <input autoFocus className="input mb-3" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {catalog
                .filter((c) => c.type === picker && c.name.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <button type="button" key={c.id} onClick={() => addFromCatalog(c)} className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-slate-50">
                    {c.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon name="box" className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {money(c.price)} / {c.unit}
                        {c.trackStock && ` · estoque: ${c.stock}`}
                      </div>
                    </div>
                  </button>
                ))}
              {catalog.filter((c) => c.type === picker).length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">Nenhum item cadastrado. Use “Item avulso” ou cadastre no Catálogo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ItemPhoto({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <label className="relative grid h-16 w-16 flex-none cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-center text-[10px] leading-tight">+ foto</span>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onChange(await fileToDataUrl(f, 600));
          e.target.value = "";
        }}
      />
      {value && (
        <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }} className="absolute right-0 top-0 rounded-bl bg-white/90 px-1 text-xs text-red-500">
          ×
        </button>
      )}
    </label>
  );
}
