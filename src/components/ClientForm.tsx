import type { Client } from "@prisma/client";
import { SubmitButton } from "./client";

export function ClientForm({ client, action, returnTo }: { client?: Client | null; action: (fd: FormData) => Promise<void>; returnTo?: string }) {
  return (
    <form action={action} className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <label className="sm:col-span-2">
        <span className="label">Nome *</span>
        <input name="name" required defaultValue={client?.name} className="input" />
      </label>
      <label>
        <span className="label">WhatsApp / celular</span>
        <input name="phone" inputMode="tel" defaultValue={client?.phone ?? ""} className="input" placeholder="(11) 99999-9999" />
      </label>
      <label>
        <span className="label">Telefone 2</span>
        <input name="phone2" inputMode="tel" defaultValue={client?.phone2 ?? ""} className="input" />
      </label>
      <label>
        <span className="label">E-mail</span>
        <input name="email" type="email" defaultValue={client?.email ?? ""} className="input" />
      </label>
      <label>
        <span className="label">CPF / CNPJ</span>
        <input name="document" defaultValue={client?.document ?? ""} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Endereço</span>
        <input name="address" defaultValue={client?.address ?? ""} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Anotações</span>
        <textarea name="notes" rows={3} defaultValue={client?.notes ?? ""} className="input" />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary w-full sm:w-auto">Salvar cliente</SubmitButton>
      </div>
    </form>
  );
}
