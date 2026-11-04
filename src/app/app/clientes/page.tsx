import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader, SearchBox } from "@/components/ui";
import { ContactImport } from "@/components/ContactImport";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Clientes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; importados?: string }> }) {
  const { companyId } = await requireSession();
  const { q, importados } = await searchParams;
  const clients = await db.client.findMany({
    where: { companyId, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { document: { contains: q, mode: "insensitive" as const } }] } : {}) },
    orderBy: { name: "asc" },
    include: { _count: { select: { quotes: true, orders: true } } },
    take: 500,
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} cliente(s)`}
        actions={
          <>
            <ContactImport />
            <Link href="/app/clientes/novo" className="btn-primary">
              <Icon name="plus" className="h-4 w-4" /> Novo cliente
            </Link>
          </>
        }
      />
      {importados && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{importados} contato(s) importado(s).</p>}
      <SearchBox placeholder="Buscar por nome, telefone, e-mail ou documento" defaultValue={q} />
      {clients.length === 0 ? (
        <Empty icon="users" title="Nenhum cliente" text="Cadastre clientes ou importe da agenda do celular." action={<Link href="/app/clientes/novo" className="btn-primary">Cadastrar cliente</Link>} />
      ) : (
        <div className="card divide-y divide-slate-100">
          {clients.map((c) => (
            <Link key={c.id} href={`/app/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-50 font-bold text-brand-700">{c.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="truncate text-xs text-slate-500">{[c.phone, c.email].filter(Boolean).join(" · ") || "Sem contato"}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {c._count.quotes} orç. · {c._count.orders} ped.
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
