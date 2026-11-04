import Link from "next/link";
import { Icon } from "./Icon";

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:pr-14">
      <div className="flex items-start gap-2">
        {back && (
          <Link href={back} className="-ml-2 mt-0.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Voltar">
            <Icon name="arrowLeft" />
          </Link>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ map, value }: { map: Record<string, { label: string; className: string }>; value: string }) {
  const s = map[value] ?? { label: value, className: "bg-slate-100 text-slate-700" };
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="font-semibold">{title}</div>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "slate" }: { label: string; value: string; hint?: string; tone?: "slate" | "green" | "red" | "amber" | "blue" }) {
  const tones = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-brand-600",
  };
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold sm:text-2xl ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function SearchBox({ placeholder, defaultValue }: { placeholder: string; defaultValue?: string }) {
  return (
    <form className="relative mb-4">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} className="input pl-9" />
    </form>
  );
}

export function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600"}`}>
      {children}
    </Link>
  );
}
