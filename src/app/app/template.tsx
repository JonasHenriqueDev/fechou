/** Remonta a cada navegação dentro do app: o conteúdo entra com um leve fade/slide. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
