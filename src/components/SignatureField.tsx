"use client";

import { useState } from "react";
import { SignaturePad } from "./client";

/** Assinatura da empresa (aparece nos PDFs e recibos). */
export function SignatureField({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [editing, setEditing] = useState(!defaultValue);
  return (
    <div>
      <span className="label">Assinatura da empresa</span>
      <input type="hidden" name={name} value={value} />
      {editing ? (
        <SignaturePad onChange={setValue} height={140} />
      ) : (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Assinatura" className="h-20 rounded-lg border border-slate-200 bg-white object-contain p-1" />
          <button type="button" className="btn-secondary btn-sm" onClick={() => { setValue(""); setEditing(true); }}>Refazer</button>
        </div>
      )}
    </div>
  );
}
