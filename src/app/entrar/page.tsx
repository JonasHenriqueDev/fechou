import { AuthCard, AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Entrar" };

export default function Page() {
  return (
    <AuthCard title="Entrar" subtitle="Acesse sua conta pelo celular ou computador.">
      <AuthForm mode="login" />
    </AuthCard>
  );
}
