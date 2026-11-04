"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Barra fina no topo durante a navegação entre páginas. O App Router não expõe eventos
 * de rota, então ela começa no clique de um link interno (ou envio de formulário GET)
 * e termina quando a URL muda.
 */
function Bar() {
  const path = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = () => {
      window.clearTimeout(timer.current);
      setState("loading");
      // Segurança: se a navegação não acontecer (ex.: mesmo destino), some sozinha.
      timer.current = window.setTimeout(() => setState("idle"), 10_000);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!e.defaultPrevented && (f.method || "get").toLowerCase() === "get" && !f.getAttribute("action")?.startsWith("javascript")) start();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 400);
  }, [path, search]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 no-print">
      <div
        className="h-full bg-brand-500 shadow-[0_0_8px_rgb(51_123_252/0.7)]"
        style={{
          width: state === "idle" ? "0%" : state === "loading" ? "85%" : "100%",
          opacity: state === "done" ? 0 : 1,
          transition:
            state === "loading"
              ? "width 8s cubic-bezier(.1,.7,.2,1)"
              : state === "done"
                ? "width .2s ease-out, opacity .3s ease .15s"
                : "none",
        }}
      />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
