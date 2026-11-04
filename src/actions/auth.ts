"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type AuthState = { error?: string } | undefined;

export async function signup(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = String(fd.get("name") ?? "").trim();
  const companyName = String(fd.get("companyName") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const whatsapp = String(fd.get("whatsapp") ?? "").trim();
  if (!name || !email || password.length < 6) return { error: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Já existe uma conta com este e-mail." };

  const company = await db.company.create({
    data: {
      name: companyName || name,
      whatsapp: whatsapp || null,
      email,
      defaultConditions: "Pix, cartão ou dinheiro.",
      users: { create: { name, email, passwordHash: await bcrypt.hash(password, 10) } },
    },
    include: { users: true },
  });
  await createSession({ userId: company.users[0].id, companyId: company.id });
  redirect("/app?bemvindo=1");
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "E-mail ou senha incorretos." };
  await createSession({ userId: user.id, companyId: user.companyId });
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/entrar");
}
