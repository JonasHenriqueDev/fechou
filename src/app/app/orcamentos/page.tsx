import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUOTE_STATUS } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { Badge, Chip, Empty, PageHeader, SearchBox } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Orçamentos" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { companyId } = await requireSession();
  const { q, status } = await searchParams;
  const quotes = await db.quote.findMany({
    where: {
      companyId,
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ code: { contains: q } }, { title: { contains: q } }, { client: { name: { contains: q } } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle={`${quotes.length} encontrado(s)`}
        actions={
          <Link href="/app/orcamentos/novo" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" /> Novo orçamento
          </Link>
        }
      />
      <SearchBox placeholder="Buscar por cliente, número ou título" defaultValue={q} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip href="/app/orcamentos" active={!status}>Todos</Chip>
        {Object.entries(QUOTE_STATUS).map(([k, s]) => (
          <Chip key={k} href={`/app/orcamentos?status=${k}`} active={status === k}>{s.label}</Chip>
        ))}
      </div>

      {quotes.length === 0 ? (
        <Empty icon="file" title="Nenhum orçamento" text="Crie um orçamento em menos de 1 minuto e envie pelo WhatsApp." action={<Link href="/app/orcamentos/novo" className="btn-primary">Criar orçamento</Link>} />
      ) : (
        <div className="card divide-y divide-slate-100">
          {quotes.map((x) => (
            <Link key={x.id} href={`/app/orcamentos/${x.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="truncate font-medium">{x.client?.name ?? "Sem cliente"}</div>
                <div className="truncate text-xs text-slate-500">
                  nº {x.code} · {date(x.createdAt)}
                  {x.title && ` · ${x.title}`}
                  {x.viewCount > 0 && ` · 👁 ${x.viewCount}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold">{money(x.total)}</span>
                <Badge map={QUOTE_STATUS} value={x.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
