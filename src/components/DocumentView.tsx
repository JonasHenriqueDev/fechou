import type { Company, Client } from "@prisma/client";
import { date, dateTime, money, num } from "@/lib/format";
import { calcTotals } from "@/lib/calc";

export type DocItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  photo: string | null;
};

/**
 * Corpo do documento (orçamento / pedido / OS) usado no portal do cliente, na tela
 * interna e na impressão em PDF — um único layout para tudo.
 */
export function DocumentView({
  company,
  client,
  docLabel,
  code,
  issueDate,
  validUntil,
  title,
  items,
  discountType,
  discountValue,
  deliveryFee,
  photos = [],
  sections = [],
  clientSignature,
  signedAt,
  signedBy,
  footer,
}: {
  company: Company;
  client: Client | null;
  docLabel: string;
  code: string;
  issueDate: Date;
  validUntil?: Date | null;
  title?: string | null;
  items: DocItem[];
  discountType: string;
  discountValue: number;
  deliveryFee: number;
  photos?: { id: string; image: string; caption: string | null }[];
  sections?: { title: string; text: string | null | undefined }[];
  clientSignature?: string | null;
  signedAt?: Date | null;
  signedBy?: string | null;
  footer?: React.ReactNode;
}) {
  const t = calcTotals(items, discountType, discountValue, deliveryFee);
  const services = items.filter((i) => i.type === "SERVICE");
  const products = items.filter((i) => i.type !== "SERVICE");
  const color = company.primaryColor || "#1d5cf1";
  const socials = [
    company.instagram && `Instagram: ${company.instagram}`,
    company.facebook && `Facebook: ${company.facebook}`,
    company.youtube && `YouTube: ${company.youtube}`,
    company.website && company.website,
  ].filter(Boolean);

  return (
    <div className="card paper print-area overflow-hidden">
      <div className="h-2" style={{ background: color }} />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between print:flex-row print:items-start print:justify-between">
          <div className="flex items-start gap-4">
            {company.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt="" className="h-16 w-16 rounded-lg object-contain sm:h-20 sm:w-20" />
            )}
            <div className="text-sm">
              <div className="text-lg font-bold">{company.name}</div>
              {company.slogan && <div className="italic text-slate-500">{company.slogan}</div>}
              {company.document && <div className="text-slate-600">CPF/CNPJ: {company.document}</div>}
              <div className="text-slate-600">{[company.phone, company.whatsapp, company.email].filter(Boolean).join(" • ")}</div>
              {(company.address || company.city) && (
                <div className="text-slate-600">{[company.address, company.city && `${company.city}${company.state ? "/" + company.state : ""}`].filter(Boolean).join(" — ")}</div>
              )}
              {socials.length > 0 && <div className="text-xs text-slate-500">{socials.join(" • ")}</div>}
            </div>
          </div>
          <div className="flex-none text-left xl:text-right print:text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{docLabel}</div>
            <div className="whitespace-nowrap text-2xl font-bold" style={{ color }}>
              Nº {code}
            </div>
            <div className="text-sm text-slate-600">Emitido em {date(issueDate)}</div>
            {validUntil && <div className="text-sm text-slate-600">Válido até {date(validUntil)}</div>}
          </div>
        </div>

        {/* Cliente */}
        {client && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</div>
            <div className="font-semibold">{client.name}</div>
            {client.document && <div className="text-slate-600">CPF/CNPJ: {client.document}</div>}
            <div className="text-slate-600">{[client.phone, client.phone2, client.email].filter(Boolean).join(" • ")}</div>
            {client.address && <div className="text-slate-600">{client.address}</div>}
          </div>
        )}

        {title && <div className="text-base font-semibold">{title}</div>}

        {/* Itens */}
        {[
          { label: "Serviços", list: services, total: t.services },
          { label: "Produtos", list: products, total: t.products },
        ]
          .filter((g) => g.list.length > 0)
          .map((g) => (
            <div key={g.label} className="avoid-break">
              <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: color + "14", color }}>
                <span>
                  {g.label} <span className="font-normal text-slate-500">({g.list.length} {g.list.length === 1 ? "item" : "itens"})</span>
                </span>
                <span>{money(g.total)}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {g.list.map((i) => (
                  <div key={i.id} className="avoid-break flex gap-3 px-1 py-3 text-sm">
                    {i.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.photo} alt="" className="h-14 w-14 flex-none rounded-lg border border-slate-200 object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{i.name}</div>
                      {i.description && <div className="whitespace-pre-line text-xs text-slate-500">{i.description}</div>}
                      <div className="text-xs text-slate-500">
                        {num(i.quantity)} {i.unit} × {money(i.unitPrice)}
                      </div>
                    </div>
                    <div className="font-semibold">{money(i.quantity * i.unitPrice)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Totais */}
        <div className="avoid-break ml-auto w-full max-w-xs space-y-1 text-sm">
          {t.services > 0 && <Row label="Total serviços" value={money(t.services)} />}
          {t.products > 0 && <Row label="Total produtos" value={money(t.products)} />}
          {t.deliveryFee > 0 && <Row label="Taxa de entrega/deslocamento" value={money(t.deliveryFee)} />}
          {t.discount > 0 && <Row label={`Desconto${discountType === "PERCENT" ? ` (${num(discountValue)}%)` : ""}`} value={`- ${money(t.discount)}`} />}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span style={{ color }}>{money(t.total)}</span>
          </div>
        </div>

        {/* Condições / observações */}
        {sections.filter((s) => s.text).map((s) => (
          <div key={s.title} className="avoid-break text-sm">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.title}</div>
            <div className="whitespace-pre-line text-slate-700">{s.text}</div>
          </div>
        ))}

        {/* Fotos */}
        {photos.length > 0 && (
          <div className="avoid-break">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fotos e anexos</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.caption ?? ""} className="aspect-square w-full object-cover" />
                  {p.caption && <figcaption className="p-1.5 text-xs text-slate-600">{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Assinaturas */}
        {(company.signature || clientSignature) && (
          <div className="avoid-break grid gap-6 pt-4 sm:grid-cols-2">
            <SignatureBlock image={company.signature} label={company.name} sub="Empresa" />
            <SignatureBlock
              image={clientSignature}
              label={signedBy || client?.name || "Cliente"}
              sub={signedAt ? `Cliente — assinado em ${dateTime(signedAt)}` : "Cliente"}
            />
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SignatureBlock({ image, label, sub }: { image?: string | null; label: string; sub: string }) {
  return (
    <div className="text-center text-sm">
      <div className="flex h-20 items-end justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && <img src={image} alt="Assinatura" className="max-h-20 object-contain" />}
      </div>
      <div className="border-t border-slate-400 pt-1 font-medium">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}
