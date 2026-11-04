"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { Reminders } from "./Reminders";
import { ThemeSwitch } from "./ThemeToggle";

const NAV = [
  { href: "/app", label: "Início", icon: "home" },
  { href: "/app/orcamentos", label: "Orçamentos", icon: "file" },
  { href: "/app/pedidos", label: "Pedidos e OS", icon: "cart" },
  { href: "/app/clientes", label: "Clientes", icon: "users" },
  { href: "/app/catalogo", label: "Catálogo e estoque", icon: "box" },
  { href: "/app/financeiro", label: "Financeiro", icon: "wallet" },
  { href: "/app/recibos", label: "Recibos", icon: "receipt" },
  { href: "/app/agenda", label: "Agenda", icon: "calendar" },
  { href: "/app/relatorios", label: "Relatórios", icon: "chart" },
  { href: "/app/configuracoes", label: "Minha empresa", icon: "settings" },
];

// No celular, a barra inferior mostra 4 atalhos + "Mais" (abre o menu completo).
const MOBILE = ["/app", "/app/orcamentos", "/app/pedidos", "/app/clientes"];

export function AppShell({
  companyName,
  logo,
  unread,
  logoutAction,
  children,
}: {
  companyName: string;
  logo: string | null;
  unread: number;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  const brand = (
    <div className="flex items-center gap-3">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="paper h-9 w-9 rounded-lg border border-slate-200 object-contain" />
      ) : (
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          {companyName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{companyName}</div>
        <div className="text-[11px] text-slate-500">Fechou</div>
      </div>
    </div>
  );

  const links = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
            active(n.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100"
          }`}
        >
          <Icon name={n.icon} className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          {n.label}
        </Link>
      ))}
      <form action={logoutAction}>
        <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
          <Icon name="logout" /> Sair
        </button>
      </form>
      <ThemeSwitch className="mt-3" />
    </nav>
  );

  return (
    <div className="min-h-screen md:pl-64">
      {/* Sidebar — computador/tablet */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-slate-200 bg-white p-4 md:flex no-print">
        {brand}
        <Link href="/app/orcamentos/novo" className="btn-primary">
          <Icon name="plus" /> Novo orçamento
        </Link>
        <div className="flex-1 overflow-y-auto">{links}</div>
      </aside>

      {/* Topo — celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden no-print">
        {brand}
        <Link href="/app/notificacoes" className="relative rounded-lg p-2 text-slate-600" aria-label="Notificações">
          <Icon name="bell" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 animate-pop grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </header>

      {/* Sino — computador */}
      <div className="fixed right-6 top-4 z-30 hidden md:block no-print">
        <Link href="/app/notificacoes" className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Notificações">
          <Icon name="bell" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 animate-pop grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">{children}</main>
      <Reminders />

      {/* Barra inferior — celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden no-print">
        {NAV.filter((n) => MOBILE.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${active(n.href) ? "text-brand-600" : "text-slate-500"}`}>
            <span className={`absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand-500 transition-transform duration-300 ${active(n.href) ? "scale-x-100" : "scale-x-0"}`} />
            <Icon name={n.icon} className={`h-5 w-5 transition-transform duration-200 ${active(n.href) ? "-translate-y-0.5" : ""}`} />
            {n.label.split(" ")[0]}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500">
          <Icon name="menu" /> Mais
        </button>
      </nav>

      {/* Menu completo — celular (fica montado para animar a entrada e a saída) */}
      <div className={`fixed inset-0 z-40 md:hidden no-print ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          <div className="mb-4 flex items-center justify-between">
            {brand}
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Fechar">
              <Icon name="x" />
            </button>
          </div>
          {links}
        </div>
      </div>

      {/* Botão flutuante de novo orçamento — celular */}
      {!path.includes("/novo") && !path.includes("/editar") && (
        <Link
          href="/app/orcamentos/novo"
          className="fixed bottom-20 right-4 z-30 grid h-14 w-14 animate-scale-in place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-90 md:hidden no-print"
          aria-label="Novo orçamento"
        >
          <Icon name="plus" className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
