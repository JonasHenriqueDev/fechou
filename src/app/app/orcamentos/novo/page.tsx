import { requireCompany } from "@/lib/auth";
import { editorOptions, emptyEditor } from "@/lib/editor";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PageHeader } from "@/components/ui";
import { saveQuote } from "@/actions/quotes";

export const metadata = { title: "Novo orçamento" };

export default async function Page({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { company } = await requireCompany();
  const { cliente } = await searchParams;
  const opts = await editorOptions(company.id);
  return (
    <div>
      <PageHeader title="Novo orçamento" back="/app/orcamentos" />
      <DocumentEditor mode="quote" initial={emptyEditor(company, cliente ?? "")} {...opts} action={saveQuote.bind(null, null)} submitLabel="Salvar orçamento" />
    </div>
  );
}
