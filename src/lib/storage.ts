import "server-only";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import { isStoredImageUrl, parseImageDataUrl, type ImageFolder } from "./images";

/** Há Blob configurado? Sem token (dev offline) as imagens continuam como data URL no banco. */
export const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Normaliza um valor de imagem recebido de formulário antes de gravar no banco:
 * - vazio → null
 * - URL do Vercel Blob → mantém
 * - data URL PNG/JPEG/WebP → envia ao Blob e devolve a URL pública (ou mantém o data URL sem Blob)
 * - qualquer outra coisa → null (não aceita hosts arbitrários nem formatos desconhecidos)
 */
export async function persistImage(value: string | null | undefined, folder: ImageFolder, scope: string): Promise<string | null> {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (isStoredImageUrl(v)) return v;
  const img = parseImageDataUrl(v);
  if (!img) return null;
  if (!blobEnabled()) return v;
  const name = `${scope}/${folder}/${randomBytes(12).toString("base64url")}.${img.ext}`;
  const blob = await put(name, img.bytes, { access: "public", contentType: img.mime, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
  return blob.url;
}

/** Versão para listas (itens/fotos), em paralelo. */
export function persistImages<T>(list: T[], get: (x: T) => string | null | undefined, folder: ImageFolder, scope: string) {
  return Promise.all(list.map((x) => persistImage(get(x), folder, scope)));
}
