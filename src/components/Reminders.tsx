"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type Toast = { key: string; text: string; link?: string | null };

const SEEN = "fechou:seen";

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]"));
  } catch {
    return new Set();
  }
}
function saveSeen(s: Set<string>) {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...s].slice(-300)));
  } catch {}
}

/**
 * Lembretes da agenda e avisos (cliente abriu/aprovou) enquanto o app está aberto:
 * toast na tela + notificação do navegador quando permitido. Sem instalar nada.
 */
export function Reminders() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        if (!res.ok) return;
        const data: { reminders: { id: string; title: string; start: string; client: string | null }[]; notifications: { id: string; message: string; link: string | null }[] } = await res.json();
        const seen = loadSeen();
        const fresh: Toast[] = [];
        for (const r of data.reminders) {
          const key = `r:${r.id}`;
          if (seen.has(key)) continue;
          const at = new Date(r.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          fresh.push({ key, text: `⏰ ${at} — ${r.title}${r.client ? ` (${r.client})` : ""}`, link: `/app/agenda/${r.id}` });
        }
        for (const n of data.notifications) {
          const key = `n:${n.id}`;
          if (seen.has(key)) continue;
          fresh.push({ key, text: n.message, link: n.link });
        }
        if (!alive || fresh.length === 0) return;
        fresh.forEach((t) => seen.add(t.key));
        saveSeen(seen);
        setToasts((cur) => [...cur, ...fresh].slice(-4));
        if ("Notification" in window && Notification.permission === "granted") {
          fresh.forEach((t) => new Notification("Fechou", { body: t.text, icon: "/icon.svg" }));
        }
        if (data.notifications.length) router.refresh();
      } catch {}
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [router]);

  if (!toasts.length) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-50 flex flex-col gap-2 sm:left-auto sm:right-20 sm:w-96 no-print">
      {toasts.map((t) => (
        <div key={t.key} className="card flex items-start gap-3 p-3 shadow-lg">
          <Icon name="bell" className="mt-0.5 h-5 w-5 flex-none text-brand-600" />
          <button className="flex-1 text-left text-sm" onClick={() => { if (t.link) router.push(t.link); setToasts((c) => c.filter((x) => x.key !== t.key)); }}>
            {t.text}
          </button>
          <button onClick={() => setToasts((c) => c.filter((x) => x.key !== t.key))} className="text-slate-400" aria-label="Fechar">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ReminderToggle() {
  const [perm, setPerm] = useState<string>("unsupported");
  useEffect(() => {
    if ("Notification" in window) setPerm(Notification.permission);
  }, []);
  if (perm === "unsupported" || perm === "granted") return null;
  return (
    <button className="btn-secondary" onClick={async () => setPerm(await Notification.requestPermission())}>
      <Icon name="bell" className="h-4 w-4" /> Ativar lembretes
    </button>
  );
}
