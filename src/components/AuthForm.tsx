"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/actions/auth";
import { SubmitButton } from "./client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  return (
    <form action={action} className="space-y-3">
      {mode === "signup" && (
        <>
          <label className="block">
            <span className="label">Seu nome</span>
            <input name="name" required className="input" autoComplete="name" />
          </label>
          <label className="block">
            <span className="label">Nome da empresa (aparece nos PDFs)</span>
            <input name="companyName" className="input" placeholder="Ex.: Clima Certo Refrigeração" />
          </label>
          <label className="block">
            <span className="label">WhatsApp</span>
            <input name="whatsapp" className="input" inputMode="tel" placeholder="(11) 99999-9999" />
          </label>
        </>
      )}
      <label className="block">
        <span className="label">E-mail</span>
        <input name="email" type="email" required className="input" autoComplete="email" />
      </label>
      <label className="block">
        <span className="label">Senha</span>
        <input name="password" type="password" required minLength={6} className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="btn-primary w-full" pendingText="Aguarde...">
        {mode === "login" ? "Entrar" : "Criar conta grátis"}
      </SubmitButton>
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            Não tem conta? <Link href="/cadastro" className="font-semibold text-brand-600">Cadastre-se grátis</Link>
          </>
        ) : (
          <>
            Já tem conta? <Link href="/entrar" className="font-semibold text-brand-600">Entrar</Link>
          </>
        )}
      </p>
    </form>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 to-white px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-8 w-8" /> OrçaFácil
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mb-5 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
