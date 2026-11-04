"use client";

import { useActionState, useState } from "react";
import { approveQuote, rejectQuote, type PortalState } from "@/actions/portal";
import { SignaturePad, SubmitButton } from "./client";
import { Icon } from "./Icon";

export function ApprovalPanel({ token, defaultName }: { token: string; defaultName?: string }) {
  const [signature, setSignature] = useState("");
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [aState, approve] = useActionState<PortalState, FormData>(approveQuote.bind(null, token), undefined);
  const [rState, reject] = useActionState<PortalState, FormData>(rejectQuote.bind(null, token), undefined);

  if (aState?.ok)
    return (
      <div className="card flex items-center gap-3 border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <Icon name="check" className="h-6 w-6" /> Orçamento aprovado! A empresa já foi avisada.
      </div>
    );
  if (rState?.ok) return <div className="card p-4 text-slate-600">Recebemos sua resposta. Obrigado!</div>;

  if (mode === "idle")
    return (
      <div className="card space-y-3 p-4">
        <div className="font-semibold">O que você achou deste orçamento?</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-success" onClick={() => setMode("approve")}>
            <Icon name="check" className="h-4 w-4" /> Aprovar
          </button>
          <button className="btn-secondary" onClick={() => setMode("reject")}>
            Recusar
          </button>
        </div>
      </div>
    );

  if (mode === "reject")
    return (
      <form action={reject} className="card space-y-3 p-4">
        <div className="font-semibold">Recusar orçamento</div>
        <textarea name="reason" className="input" rows={3} placeholder="Conte o motivo (opcional) — ex.: preço, prazo..." />
        {rState?.error && <p className="text-sm text-red-600">{rState.error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={() => setMode("idle")}>Voltar</button>
          <SubmitButton className="btn-danger" pendingText="Enviando...">Confirmar</SubmitButton>
        </div>
      </form>
    );

  return (
    <form action={approve} className="card space-y-3 p-4">
      <div className="font-semibold">Aprovar e assinar</div>
      <label className="block">
        <span className="label">Seu nome completo</span>
        <input name="name" required defaultValue={defaultName} className="input" />
      </label>
      <input type="hidden" name="signature" value={signature} />
      <SignaturePad onChange={setSignature} />
      <p className="text-xs text-slate-500">Ao assinar, você concorda com os itens, valores e condições deste orçamento. Data e hora ficam registradas.</p>
      {aState?.error && <p className="text-sm text-red-600">{aState.error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary" onClick={() => setMode("idle")}>Voltar</button>
        <SubmitButton className="btn-success" pendingText="Enviando...">Aprovar orçamento</SubmitButton>
      </div>
    </form>
  );
}
