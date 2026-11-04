import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppointmentForm } from "@/components/AppointmentForm";
import { PageHeader } from "@/components/ui";
import { saveAppointment } from "@/actions/records";

export const metadata = { title: "Agendar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string; dia?: string }> }) {
  const { companyId } = await requireSession();
  const { cliente, dia } = await searchParams;
  const clients = await db.client.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const day = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Novo compromisso" back="/app/agenda" />
      <AppointmentForm clients={clients} defaultClientId={cliente} defaultStart={`${day}T09:00`} action={saveAppointment.bind(null, null)} />
    </div>
  );
}
