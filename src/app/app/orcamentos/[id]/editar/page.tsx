import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { editorOptions, quoteToEditor } from "@/lib/editor";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { saveQuote } from "@/actions/quotes";

export const metadata = { title: "Editar orçamento" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession();
  const { id } = await params;
  const q = await db.quote.findFirst({ where: { id, companyId }, include: { items: true, photos: true } });
  if (!q) notFound();
  const opts = await editorOptions(companyId);
  return (
    <div>
      <PageHeader title={`Editar orçamento nº ${q.code}`} back={`/app/orcamentos/${id}`} />
      <DocumentEditor mode="quote" initial={quoteToEditor(q)} {...opts} action={saveQuote.bind(null, id)} submitLabel="Salvar alterações" />
    </div>
  );
}
