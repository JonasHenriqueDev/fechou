// Regras puras (sem I/O) para valores de imagem vindos de formulários — testadas em images.test.ts.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const MIME_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Decodifica um data URL de imagem PNG/JPEG/WebP; devolve null se inválido ou grande demais. */
export function parseImageDataUrl(value: string): { mime: string; ext: string; bytes: Buffer } | null {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  return { mime: m[1], ext: MIME_EXT[m[1]], bytes };
}

/** URLs aceitas como imagem já armazenada: só o Vercel Blob público (evita apontar para hosts arbitrários). */
export function isStoredImageUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export type ImageFolder = "logos" | "assinaturas" | "catalogo" | "itens" | "fotos" | "aprovacoes";
export const IMAGE_FOLDERS: ImageFolder[] = ["logos", "assinaturas", "catalogo", "itens", "fotos", "aprovacoes"];
