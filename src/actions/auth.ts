"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export type AuthState = { error?: string } | undefined;

const authError = (e: unknown, fallback: string): AuthState => {
  if (e instanceof APIError) {
    if (e.status === "TOO_MANY_REQUESTS" || e.statusCode === 429) return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
    if (e.body?.code === "USER_ALREADY_EXISTS" || e.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return { error: "Já existe uma conta com este e-mail." };
    if (e.body?.code === "PASSWORD_TOO_SHORT") return { error: "A senha precisa ter pelo menos 6 caracteres." };
    if (e.body?.code === "INVALID_EMAIL") return { error: "E-mail inválido." };
    return { error: fallback };
  }
  throw e;
};

export async function signup(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = String(fd.get("name") ?? "").trim();
  const companyName = String(fd.get("companyName") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const whatsapp = String(fd.get("whatsapp") ?? "").trim();
  if (!name || !email || password.length < 6) return { error: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres." };

  let userId: string;
  try {
    // O hook de criação do usuário (lib/auth.ts) cria a empresa; aqui só completamos os dados.
    const res = await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
    userId = res.user.id;
  } catch (e) {
    return authError(e, "Não foi possível criar a conta. Tente novamente.");
  }
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user) await db.company.update({ where: { id: user.companyId }, data: { name: companyName || name, whatsapp: whatsapp || null } });
  redirect("/app?bemvindo=1");
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };
  try {
    await auth.api.signInEmail({ body: { email, password, rememberMe: true }, headers: await headers() });
  } catch (e) {
    return authError(e, "E-mail ou senha incorretos.");
  }
  redirect("/app");
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/entrar");
}
