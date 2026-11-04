"use client";

import { useEffect, useState } from "react";
import { importClients } from "@/actions/records";
import { SubmitButton } from "./client";
import { Icon } from "./Icon";

type Row = { name: string; phone?: string; email?: string };

function parseVcf(text: string): Row[] {
  return text.split(/END:VCARD/i).map((card) => {
    const fn = card.match(/^FN[^:]*:(.*)$/im)?.[1]?.trim();
    const tel = card.match(/^TEL[^:]*:(.*)$/im)?.[1]?.trim();
    const email = card.match(/^EMAIL[^:]*:(.*)$/im)?.[1]?.trim();
    return { name: fn ?? "", phone: tel, email };
  }).filter((r) => r.name);
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].toLowerCase().split(sep).map((h) => h.replace(/"/g, "").trim());
  const idx = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const iName = Math.max(0, idx("nome", "name"));
  const iPhone = idx("tel", "phone", "celular", "whats");
  const iEmail = idx("mail");
  return lines.slice(1).map((l) => {
    const c = l.split(sep).map((x) => x.replace(/^"|"$/g, "").trim());
    return { name: c[iName], phone: iPhone >= 0 ? c[iPhone] : undefined, email: iEmail >= 0 ? c[iEmail] : undefined };
  }).filter((r) => r.name);
}

export function ContactImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [hasPicker, setHasPicker] = useState(false);
  useEffect(() => setHasPicker("contacts" in navigator), []);

  const pickFromPhone = async () => {
    try {
      // Contact Picker API (Chrome no Android): importa direto da agenda do celular.
      const nav = navigator as unknown as { contacts: { select: (p: string[], o: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]> } };
      const res = await nav.contacts.select(["name", "tel", "email"], { multiple: true });
      setRows(res.map((c) => ({ name: c.name?.[0] ?? "", phone: c.tel?.[0], email: c.email?.[0] })).filter((r) => r.name));
    } catch {}
  };

  if (!open)
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        <Icon name="download" className="h-4 w-4" /> Importar contatos
      </button>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg animate-sheet-up space-y-3 rounded-t-3xl bg-white p-5 shadow-2xl sm:animate-scale-in sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Importar contatos</h3>
          <button onClick={() => setOpen(false)} className="p-1 text-slate-500" aria-label="Fechar"><Icon name="x" /></button>
        </div>
        {hasPicker && (
          <button className="btn-primary w-full" onClick={pickFromPhone}>
            <Icon name="phone" className="h-4 w-4" /> Escolher da agenda do celular
          </button>
        )}
        <label className="btn-secondary w-full cursor-pointer">
          Arquivo .vcf (contatos) ou .csv
          <input
            type="file"
            accept=".vcf,.csv,text/vcard,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              setRows(f.name.toLowerCase().endsWith(".vcf") ? parseVcf(text) : parseCsv(text));
            }}
          />
        </label>
        <p className="text-xs text-slate-500">CSV com colunas “nome”, “telefone” e “email”. No Google Contatos use Exportar → vCard.</p>
        {rows.length > 0 && (
          <form action={importClients} className="space-y-2">
            <input type="hidden" name="rows" value={JSON.stringify(rows)} />
            <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 text-sm">
              {rows.slice(0, 100).map((r, i) => (
                <div key={i} className="px-3 py-1.5">{r.name} <span className="text-slate-500">{r.phone}</span></div>
              ))}
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="Importando...">Importar {rows.length} contato(s)</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
