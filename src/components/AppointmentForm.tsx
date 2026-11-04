import type { Appointment } from "@prisma/client";
import { inputDateTime } from "@/lib/format";
import { SubmitButton } from "./client";

export function AppointmentForm({
  appt, clients, defaultClientId, defaultStart, action,
}: {
  appt?: Appointment | null;
  clients: { id: string; name: string }[];
  defaultClientId?: string;
  defaultStart?: string;
  action: (fd: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
      <label className="sm:col-span-2">
        <span className="label">Título *</span>
        <input name="title" required defaultValue={appt?.title} className="input" placeholder="Ex.: Visita técnica" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Cliente</span>
        <select name="clientId" defaultValue={appt?.clientId ?? defaultClientId ?? ""} className="input">
          <option value="">—</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>
        <span className="label">Início *</span>
        <input name="start" type="datetime-local" required defaultValue={appt ? inputDateTime(appt.start) : defaultStart} className="input" />
      </label>
      <label>
        <span className="label">Fim</span>
        <input name="end" type="datetime-local" defaultValue={inputDateTime(appt?.end)} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Local</span>
        <input name="location" defaultValue={appt?.location ?? ""} className="input" />
      </label>
      <label className="sm:col-span-2">
        <span className="label">Detalhes</span>
        <textarea name="description" rows={3} defaultValue={appt?.description ?? ""} className="input" />
      </label>
      <label>
        <span className="label">Lembrete</span>
        <select name="remindMin" defaultValue={appt?.remindMin ?? 60} className="input">
          <option value="0">Sem lembrete</option>
          <option value="15">15 min antes</option>
          <option value="30">30 min antes</option>
          <option value="60">1 hora antes</option>
          <option value="180">3 horas antes</option>
          <option value="1440">1 dia antes</option>
        </select>
      </label>
      <div className="flex items-end">
        <SubmitButton className="btn-primary w-full">Salvar compromisso</SubmitButton>
      </div>
    </form>
  );
}
