import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Proteção rápida das rotas /app no edge. A verificação definitiva (e o companyId) vem de requireSession().
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");
  if (token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {}
  }
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app/:path*"] };
