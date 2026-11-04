import { AuthCard, AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Criar conta" };

export default function Page() {
  return (
    <AuthCard title="Crie sua conta grátis" subtitle="Sem cartão de crédito. Sem instalar nada.">
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
