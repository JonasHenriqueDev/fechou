import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Barreira rápida das rotas /app no edge: só confere se existe o cookie de sessão do Better Auth.
// A validação real da sessão (e o companyId) vem de requireSession() em src/lib/auth.ts.
export function middleware(req: NextRequest) {
  if (getSessionCookie(req)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app/:path*"] };
