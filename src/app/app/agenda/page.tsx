import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { time } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toggleAppointment } from "@/actions/records";
import { ReminderToggle } from "@/components/Reminders";

export const metadata = { title: "Agenda" };

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Dia "YYYY-MM-DD" em Brasília para um Date. */
const dayKey = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

export default async function Page({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { companyId } = await requireSession();
  const { dia } = await searchParams;
  const today = dayKey(new Date());
  const sel = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : today;

  // Semana (domingo a sábado) que contém o dia selecionado
  const selDate = new Date(`${sel}T12:00:00-03:00`);
  const weekStart = new Date(selDate.getTime() - selDate.getUTCDay() * 86400000);
  const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(weekStart.getTime() + i * 86400000)));
  const rangeStart = new Date(`${days[0]}T00:00:00-03:00`);
  const rangeEnd = new Date(new Date(`${days[6]}T00:00:00-03:00`).getTime() + 86400000);

  const appts = await db.appointment.findMany({
    where: { companyId, start: { gte: rangeStart, lt: rangeEnd } },
    orderBy: { start: "asc" },
    include: { client: true },
  });
  const ofDay = appts.filter((a) => dayKey(a.start) === sel);
  const shift = (n: number) => dayKey(new Date(selDate.getTime() + n * 86400000));

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Visitas, serviços e compromissos"
        actions={
          <>
            <ReminderToggle />
            <Link href={`/app/agenda/novo?dia=${sel}`} className="btn-primary">
              <Icon name="plus" className="h-4 w-4" /> Agendar
            </Link>
          </>
        }
      />

      <div className="card mb-4 p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <Link href={`/app/agenda?dia=${shift(-7)}`} className="btn-secondary btn-sm">‹ Semana</Link>
          <Link href="/app/agenda" className="font-semibold text-brand-600">Hoje</Link>
          <Link href={`/app/agenda?dia=${shift(7)}`} className="btn-secondary btn-sm">Semana ›</Link>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const count = appts.filter((a) => dayKey(a.start) === d).length;
            return (
              <Link key={d} href={`/app/agenda?dia=${d}`} className={`flex flex-col items-center rounded-xl py-2 text-xs ${d === sel ? "bg-brand-600 text-white" : d === today ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"}`}>
                <span className="uppercase opacity-70">{WEEK[i]}</span>
                <span className="text-lg font-bold">{d.slice(8)}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${count ? (d === sel ? "bg-white" : "bg-brand-500") : "bg-transparent"}`} />
              </Link>
            );
          })}
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-500">
        {new Date(`${sel}T12:00:00-03:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" })}
      </h2>
      {ofDay.length === 0 ? (
        <Empty icon="calendar" title="Nada agendado" action={<Link href={`/app/agenda/novo?dia=${sel}`} className="btn-primary">Agendar compromisso</Link>} />
      ) : (
        <div className="card divide-y divide-slate-100">
          {ofDay.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <form action={toggleAppointment.bind(null, a.id)}>
                <button className={`grid h-6 w-6 place-items-center rounded-full border-2 ${a.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`} aria-label="Concluir">
                  {a.done && <Icon name="check" className="h-4 w-4" />}
                </button>
              </form>
              <Link href={`/app/agenda/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="w-12 flex-none text-sm font-bold text-brand-600">{time(a.start)}</div>
                <div className="min-w-0">
                  <div className={`truncate font-medium ${a.done ? "text-slate-400 line-through" : ""}`}>{a.title}</div>
                  <div className="truncate text-xs text-slate-500">{[a.client?.name, a.location].filter(Boolean).join(" · ")}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
