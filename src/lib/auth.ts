import "server-only";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((h) => `https://${h}`);

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("BETTER_AUTH_SECRET não definido em produção.");
}

/**
 * Better Auth: e-mail + senha, sessões no banco (tabela Session), rate limit no banco.
 * Rotas HTTP em /api/auth/* (src/app/api/auth/[...all]/route.ts).
 */
export const auth = betterAuth({
  appName: "Fechou",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL, ...vercelOrigins, ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://192.168.*.*:3000"])],
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    // bcrypt mantém compatibilidade com o seed e com hashes já existentes.
    password: {
      hash: (password) => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  user: {
    // companyId nunca vem do cliente: é definido no hook abaixo.
    additionalFields: { companyId: { type: "string", required: false, input: false } },
  },
  databaseHooks: {
    user: {
      create: {
        // Todo usuário novo ganha a própria empresa (tenant). O nome é ajustado depois pelo cadastro.
        before: async (user) => {
          const company = await db.company.create({
            data: { name: user.name || "Minha empresa", email: user.email, defaultConditions: "Pix, cartão ou dinheiro." },
          });
          return { data: { ...user, companyId: company.id } };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  advanced: {
    database: { generateId: false },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  plugins: [nextCookies()],
});

export type Session = { userId: string; companyId: string };

/** Sessão atual (memoizada por requisição). */
export const getSession = cache(async (): Promise<Session | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  const companyId = (s?.user as { companyId?: string } | undefined)?.companyId;
  if (!s || !companyId) return null;
  return { userId: s.user.id, companyId };
});

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
