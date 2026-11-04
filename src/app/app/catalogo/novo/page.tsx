import { requireSession } from "@/lib/auth";
import { CatalogForm } from "@/components/CatalogForm";
import { PageHeader } from "@/components/ui";
import { saveCatalogItem } from "@/actions/records";

export const metadata = { title: "Novo item" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireSession();
  const { tipo } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Novo produto ou serviço" back="/app/catalogo" />
      <CatalogForm defaultType={tipo === "PRODUCT" ? "PRODUCT" : "SERVICE"} action={saveCatalogItem.bind(null, null)} />
    </div>
  );
}
