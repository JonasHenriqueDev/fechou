import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { IMAGE_FOLDERS, type ImageFolder } from "@/lib/images";
import { persistImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Upload de imagem já redimensionada no navegador (components/client.tsx → uploadImage).
 * Assim os formulários enviam só a URL e ficam bem abaixo do limite de 4,5 MB de body da Vercel.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { dataUrl, folder } = (await req.json().catch(() => ({}))) as { dataUrl?: string; folder?: string };
  if (!folder || !IMAGE_FOLDERS.includes(folder as ImageFolder)) return NextResponse.json({ error: "folder" }, { status: 400 });
  const url = await persistImage(dataUrl, folder as ImageFolder, s.companyId);
  if (!url) return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json({ url });
}
