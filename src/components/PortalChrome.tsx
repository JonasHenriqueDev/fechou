import Link from "next/link";
import type { Company } from "@prisma/client";
import { whatsappLink } from "@/lib/format";
import { Icon } from "./Icon";
import { ThemeButton } from "./ThemeToggle";

/** Cabeçalho + rodapé das páginas públicas (portal do orçamento, pedido e recibo). */
export function PortalChrome({ company, children, whatsText }: { company: Company; children: React.ReactNode; whatsText: string }) {
  const socials = [
    company.instagram && { label: "Instagram", href: company.instagram.startsWith("http") ? company.instagram : `https://instagram.com/${company.instagram.replace("@", "")}` },
    company.facebook && { label: "Facebook", href: company.facebook.startsWith("http") ? company.facebook : `https://facebook.com/${company.facebook}` },
    company.youtube && { label: "YouTube", href: company.youtube.startsWith("http") ? company.youtube : `https://youtube.com/${company.youtube}` },
    company.website && { label: "Site", href: company.website.startsWith("http") ? company.website : `https://${company.website}` },
  ].filter(Boolean) as { label: string; href: string }[];
  const phone = company.whatsapp || company.phone;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          {company.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt="" className="paper h-10 w-10 rounded-lg object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{company.name}</div>
            {company.slogan && <div className="truncate text-xs italic text-slate-500">{company.slogan}</div>}
          </div>
          {phone && (
            <a href={whatsappLink(phone, whatsText)} target="_blank" className="btn-whatsapp btn-sm">
              <Icon name="whatsapp" className="h-4 w-4" /> <span className="hidden sm:inline">Falar no WhatsApp</span>
            </a>
          )}
          <ThemeButton />
        </div>
        {socials.length > 0 && (
          <div className="mx-auto flex max-w-5xl gap-4 px-4 pb-2 text-xs font-medium text-brand-600">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl animate-fade-up px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <footer className="no-print pb-8 text-center text-xs text-slate-500">
        Documento emitido pelo <Link href="/" className="font-semibold text-brand-600">Fechou</Link>. Quer gerar o seu? É grátis.
      </footer>
    </div>
  );
}
