import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ImageInput, SubmitButton } from "@/components/client";
import { SignatureField } from "@/components/SignatureField";
import { saveCompany } from "@/actions/records";

export const metadata = { title: "Minha empresa" };

export default async function Page({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const { company: c } = await requireCompany();
  const { salvo } = await searchParams;
  const input = (name: keyof typeof c, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, span = false) => (
    <label className={span ? "sm:col-span-2" : ""}>
      <span className="label">{label}</span>
      <input name={name} defaultValue={(c[name] as string | number | null) ?? ""} className="input" {...extra} />
    </label>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Minha empresa" subtitle="Esses dados aparecem nos seus orçamentos, pedidos e recibos." />
      {salvo && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Alterações salvas!</p>}
      <form action={saveCompany} className="space-y-5">
        <section className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <h2 className="font-semibold sm:col-span-2">Identidade visual</h2>
          <ImageInput name="logo" defaultValue={c.logo} label="Logo" max={500} />
          <label>
            <span className="label">Cor dos documentos</span>
            <input type="color" name="primaryColor" defaultValue={c.primaryColor} className="h-12 w-24 cursor-pointer rounded-xl border border-slate-300" />
          </label>
          <div className="sm:col-span-2">
            <SignatureField name="signature" defaultValue={c.signature} />
          </div>
        </section>

        <section className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <h2 className="font-semibold sm:col-span-2">Dados da empresa</h2>
          {input("name", "Nome da empresa *", { required: true }, true)}
          {input("slogan", "Slogan", {}, true)}
          {input("document", "CPF / CNPJ")}
          {input("email", "E-mail", { type: "email" })}
          {input("phone", "Telefone", { inputMode: "tel" })}
          {input("whatsapp", "WhatsApp", { inputMode: "tel" })}
          {input("address", "Endereço", {}, true)}
          {input("city", "Cidade")}
          {input("state", "UF", { maxLength: 2 })}
        </section>

        <section id="pix" className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <h2 className="font-semibold sm:col-span-2">Pix — QR Code nos orçamentos e pedidos</h2>
          {input("pixKey", "Chave Pix (CPF, CNPJ, e-mail, celular com +55 ou aleatória)", {}, true)}
          {input("pixName", "Nome do recebedor")}
          {input("pixCity", "Cidade do recebedor")}
        </section>

        <section className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <h2 className="font-semibold sm:col-span-2">Redes sociais (aparecem no portal do cliente)</h2>
          {input("instagram", "Instagram", { placeholder: "@suaempresa" })}
          {input("facebook", "Facebook")}
          {input("youtube", "YouTube")}
          {input("website", "Site")}
        </section>

        <section className="card grid gap-3 p-4 sm:p-6">
          <h2 className="font-semibold">Padrões dos orçamentos</h2>
          <label className="max-w-xs">
            <span className="label">Validade padrão (dias)</span>
            <input name="defaultValidityDays" type="number" min={1} defaultValue={c.defaultValidityDays} className="input" />
          </label>
          <label>
            <span className="label">Formas de pagamento padrão</span>
            <textarea name="defaultConditions" rows={2} defaultValue={c.defaultConditions ?? ""} className="input" />
          </label>
          <label>
            <span className="label">Garantia padrão</span>
            <input name="defaultWarranty" defaultValue={c.defaultWarranty ?? ""} className="input" />
          </label>
          <label>
            <span className="label">Observações padrão</span>
            <textarea name="defaultNotes" rows={2} defaultValue={c.defaultNotes ?? ""} className="input" />
          </label>
        </section>

        <div className="sticky bottom-20 z-10 md:bottom-4">
          <SubmitButton className="btn-primary w-full shadow-lg sm:w-auto">Salvar alterações</SubmitButton>
        </div>
      </form>
    </div>
  );
}
