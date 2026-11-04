"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

/** Redimensiona a imagem no navegador e devolve um data URL JPEG/PNG (mantém o banco leve). */
export async function fileToDataUrl(file: File, max = 1000): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const png = file.type === "image/png";
    return c.toDataURL(png ? "image/png" : "image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Envia a imagem (data URL) para o storage via /api/upload e devolve a URL pública.
 * Se falhar (offline, sem Blob em dev), devolve o próprio data URL — a action também persiste no servidor.
 */
export async function uploadImage(dataUrl: string, folder: string): Promise<string> {
  try {
    const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, folder }) });
    if (!res.ok) return dataUrl;
    const { url } = (await res.json()) as { url?: string };
    return url || dataUrl;
  } catch {
    return dataUrl;
  }
}

/** Redimensiona no navegador e já envia ao storage. */
export async function fileToImageUrl(file: File, max: number, folder: string) {
  return uploadImage(await fileToDataUrl(file, max), folder);
}

export function SubmitButton({ children, className = "btn-primary", pendingText = "Salvando..." }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function ConfirmSubmit({ children, message, className = "btn-danger" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/** Campo de imagem: mostra prévia, envia ao storage e guarda a URL num input hidden com `name`. */
export function ImageInput({ name, defaultValue, label = "Imagem", max = 1000, folder, className = "h-28 w-28" }: { name: string; defaultValue?: string | null; label?: string; max?: number; folder: string; className?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="label">{label}{uploading && <span className="ml-2 font-normal text-slate-400">enviando...</span>}</span>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => ref.current?.click()} className={`${className} grid place-items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-brand-400`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <Icon name="plus" className="h-6 w-6" />
          )}
        </button>
        {value && (
          <button type="button" onClick={() => setValue("")} className="btn-secondary btn-sm">
            Remover
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const preview = await fileToDataUrl(f, max);
          setValue(preview);
          setUploading(true);
          setValue(await uploadImage(preview, folder));
          setUploading(false);
        }}
      />
    </div>
  );
}

/** Assinatura com o dedo/mouse; devolve PNG data URL via onChange. */
export function SignaturePad({ onChange, height = 180 }: { onChange: (dataUrl: string) => void; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, [height]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div>
      <canvas
        ref={canvas}
        style={{ height, touchAction: "none" }}
        className="w-full rounded-xl border border-slate-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvas.current!.getContext("2d")!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          canvas.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          dirty.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (dirty.current) onChange(canvas.current!.toDataURL("image/png"));
        }}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>Assine no quadro acima</span>
        <button
          type="button"
          className="font-semibold text-brand-600"
          onClick={() => {
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            dirty.current = false;
            onChange("");
          }}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

export function CopyButton({ text, label = "Copiar", className = "btn-secondary btn-sm" }: { text: string; label?: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      <Icon name={ok ? "check" : "copy"} className="h-4 w-4" /> {ok ? "Copiado!" : label}
    </button>
  );
}

export function PrintButton({ label = "Baixar PDF", className = "btn-secondary" }: { label?: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <Icon name="download" className="h-4 w-4" /> {label}
    </button>
  );
}

/** Abre o diálogo de impressão automaticamente (páginas /pdf). */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}

/** Compartilhamento nativo (celular) com fallback para copiar link. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        const full = url.startsWith("http") ? url : window.location.origin + url;
        if (navigator.share) {
          try {
            await navigator.share({ title, url: full });
            return;
          } catch {}
        }
        await navigator.clipboard.writeText(full);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      <Icon name="link" className="h-4 w-4" /> {ok ? "Link copiado!" : "Compartilhar link"}
    </button>
  );
}

/** Botão de WhatsApp que monta o link com a URL absoluta do portal (origin só existe no navegador). */
export function WhatsAppShare({ phone, message, path, label = "Enviar pelo WhatsApp", className = "btn-whatsapp", onSent }: { phone?: string | null; message: string; path?: string; label?: string; className?: string; onSent?: () => Promise<void> }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onSent?.();
        const full = path ? `${message}\n${window.location.origin}${path}` : message;
        let d = (phone ?? "").replace(/\D/g, "");
        if (d && d.length <= 11) d = "55" + d;
        window.open(`https://wa.me/${d}?text=${encodeURIComponent(full)}`, "_blank");
      }}
    >
      <Icon name="whatsapp" className="h-4 w-4" /> {label}
    </button>
  );
}
