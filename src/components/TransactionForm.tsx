"use client";

import { useState } from "react";
import type { Transaction } from "@prisma/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { inputDate } from "@/lib/format";
import { SubmitButton } from "./client";

export function TransactionForm({ tx, defaultType, action }: { tx?: Transaction | null; defaultType: string; action: (fd: FormData) => Promise<void> }) {
  const [type, setType] = useState(tx?.type ?? defaultType);
  const cats = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <form action={action} className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        <button type="button" onClick={() => setType("INCOME")} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${type === "INCOME" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-600"}`}>Receita</button>
        <button type="button" onClick={() => setType("EXPENSE")} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${type === "EXPENSE" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-300 text-slate-600"}`}>Despesa</button>
      </div>
      <label className="sm:col-span-2">
        <span className="label">Descrição *</span>
        <input name="description" required defaultValue={tx?.description} className="input" />
      </label>
      <label>
        <span className="label">Valor (R$) *</span>
        <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={tx?.amount} className="input" />
      </label>
      <label>
        <span className="label">Data</span>
        <input name="date" type="date" defaultValue={inputDate(tx?.date ?? new Date())} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Categoria</span>
        <input name="category" list="cats" defaultValue={tx?.category ?? cats[0]} key={type} className="input" />
        <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary w-full sm:w-auto">Salvar lançamento</SubmitButton>
      </div>
    </form>
  );
}
