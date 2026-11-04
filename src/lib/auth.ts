import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "session";
export const authSecret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");

export type Session = { userId: string; companyId: string };

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(authSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return { userId: payload.userId as string, companyId: payload.companyId as string };
  } catch {
    return null;
  }
}

/** Toda página/ação autenticada passa por aqui; o companyId devolvido filtra todas as queries (multi-tenant). */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/entrar");
  return s;
}

export async function requireCompany() {
  const s = await requireSession();
  const company = await db.company.findUnique({ where: { id: s.companyId } });
  if (!company) redirect("/entrar");
  return { session: s, company };
}
