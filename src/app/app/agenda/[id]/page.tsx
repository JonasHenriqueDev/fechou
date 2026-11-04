import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppointmentForm } from "@/components/AppointmentForm";
import { PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client";
import { deleteAppointment, saveAppointment } from "@/actions/records";

export const metadata = { title: "Compromisso" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const [appt, clients] = await Promise.all([
    db.appointment.findFirst({ where: { id, companyId } }),
    db.client.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!appt) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Editar compromisso" back="/app/agenda" />
      <AppointmentForm appt={appt} clients={clients} action={saveAppointment.bind(null, id)} />
      <form action={deleteAppointment.bind(null, id)}>
        <ConfirmSubmit message="Excluir compromisso?">Excluir</ConfirmSubmit>
      </form>
    </div>
  );
}
