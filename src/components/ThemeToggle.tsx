"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export type ThemePref = "light" | "dark" | "system";
const KEY = "fechou:theme";

/**
 * Roda no <head> antes da pintura (evita “piscar” claro ao abrir no escuro).
 * Mantenha em sincronia com `apply` abaixo.
 */
export const themeScript = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref, animate: boolean) {
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  if (animate) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 350);
  }
  root.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111827" : "#1d5cf1");
}

function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    setPref(readPref());
    // Acompanha a troca de tema do sistema enquanto a preferência for “sistema”.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readPref() === "system" && apply("system", true);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const choose = (p: ThemePref) => {
    setPref(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {}
    apply(p, true);
  };
  return { pref, choose };
}

const OPTIONS: { value: ThemePref; label: string; icon: string }[] = [
  { value: "light", label: "Claro", icon: "sun" },
  { value: "dark", label: "Escuro", icon: "moon" },
  { value: "system", label: "Sistema", icon: "monitor" },
];

/** Seletor segmentado Claro / Escuro / Sistema (menu do app). */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { pref, choose } = useTheme();
  const idx = OPTIONS.findIndex((o) => o.value === pref);
  return (
    <div role="radiogroup" aria-label="Tema" className={`relative grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-xs font-semibold ${className}`}>
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{ width: "calc((100% - 0.5rem) / 3)", transform: `translateX(${idx * 100}%)` }}
      />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={pref === o.value}
          onClick={() => choose(o.value)}
          className={`relative flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-colors ${pref === o.value ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Icon name={o.icon} className="h-4 w-4" /> {o.label}
        </button>
      ))}
    </div>
  );
}

/** Botão redondo que alterna claro ↔ escuro (landing, portal, login). */
export function ThemeButton({ className = "" }: { className?: string }) {
  const { choose } = useTheme();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    setDark(root.classList.contains("dark"));
    const obs = new MutationObserver(() => setDark(root.classList.contains("dark")));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return (
    <button
      type="button"
      onClick={() => choose(dark ? "light" : "dark")}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-90 ${className}`}
    >
      <Icon key={dark ? "sun" : "moon"} name={dark ? "sun" : "moon"} className="h-[18px] w-[18px] animate-pop" />
    </button>
  );
}
