import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Icon } from "@/components/Icon";

const FEATURES = [
  { icon: "file", title: "Orçamento em PDF em 1 minuto", text: "Itens, fotos, descontos, taxas, validade, prazo e garantia. Com sua logo, cor e assinatura." },
  { icon: "whatsapp", title: "Envio pelo WhatsApp", text: "Um toque e o cliente recebe o link do orçamento online ou o PDF." },
  { icon: "check", title: "Aprovação online com assinatura", text: "O cliente aprova e assina com o dedo pelo celular, sem instalar nada. Tudo com data e hora." },
  { icon: "eye", title: "Saiba quando o cliente abriu", text: "Notificação quando o cliente visualizar, aprovar ou recusar — fale com ele na hora certa." },
  { icon: "pix", title: "QR Code Pix", text: "Pix copia e cola e QR Code com o valor certo, gerados automaticamente em cada documento." },
  { icon: "cart", title: "Pedidos e ordens de serviço", text: "Converta o orçamento aprovado em pedido ou OS com um clique. Pagamento à vista ou parcelado." },
  { icon: "receipt", title: "Recibo automático", text: "Pagamento registrado = recibo numerado, com valor por extenso, pronto para enviar." },
  { icon: "box", title: "Catálogo e estoque", text: "Produtos e serviços com foto, preço e custo. Baixa automática de estoque nos pedidos." },
  { icon: "wallet", title: "Financeiro sem planilha", text: "Fluxo de caixa, receitas e despesas por categoria, contas a receber e extrato em PDF." },
  { icon: "users", title: "Gestão de clientes", text: "Histórico completo: orçamentos, pedidos, pago, em atraso e a receber. Importe da agenda." },
  { icon: "calendar", title: "Agenda com lembretes", text: "Visitas e serviços por cliente, com lembretes no navegador." },
  { icon: "chart", title: "Relatórios", text: "Mais vendidos, ticket médio, lucro estimado, conversão e recebimentos por período." },
];

const STEPS = [
  ["Cadastre o cliente", "Na hora ou importando da agenda do celular."],
  ["Monte o orçamento", "Escolha itens do catálogo; o total é calculado sozinho."],
  ["Envie pelo WhatsApp", "O cliente abre no navegador, aprova e assina."],
  ["Receba e emita o recibo", "Pix com QR Code e recibo gerado na hora."],
];

export default async function Home() {
  const logged = !!(await getSession());
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-8 w-8" /> OrçaFácil
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/gerador" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">Gerador grátis</Link>
            {logged ? (
              <Link href="/app" className="btn-primary btn-sm">Abrir o app</Link>
            ) : (
              <>
                <Link href="/entrar" className="btn-secondary btn-sm">Entrar</Link>
                <Link href="/cadastro" className="btn-primary btn-sm">Criar conta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="badge bg-brand-100 text-brand-700">100% online · celular e computador · sem instalar nada</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Orçamentos profissionais em <span className="text-brand-600">menos de 1 minuto</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Para MEI, autônomo e prestador de serviço. Crie o orçamento em PDF, envie pelo WhatsApp, receba a aprovação com assinatura e cobre via Pix — direto do navegador.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn-primary px-6 py-3 text-base">Começar grátis</Link>
              <Link href="/gerador" className="btn-secondary px-6 py-3 text-base">Gerar orçamento sem cadastro</Link>
            </div>
            <p className="mt-3 text-sm text-slate-500">Sem cartão de crédito · Funciona em qualquer navegador</p>
          </div>
          <div className="card mx-auto w-full max-w-sm rotate-1 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Orçamento nº 0002-26</div>
                <div className="text-2xl font-bold">R$ 2.875,08</div>
              </div>
              <span className="badge bg-emerald-100 text-emerald-700">Aprovado</span>
            </div>
            <div className="space-y-2 text-sm">
              {[["Instalação split 9.000 BTUs", "R$ 900,00"], ["Kit de instalação", "R$ 354,00"], ["Ar-condicionado 9.000 BTUs", "R$ 1.700,00"]].map(([a, b]) => (
                <div key={a} className="flex justify-between border-b border-slate-100 pb-2"><span>{a}</span><b>{b}</b></div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">✓ Aprovado e assinado pelo cliente em 19/05 22:25</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="btn-secondary btn-sm">Baixar PDF</span>
              <span className="btn-whatsapp btn-sm">WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold">Do cliente ao recibo em minutos</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="card p-5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</div>
              <div className="mt-3 font-semibold">{t}</div>
              <p className="text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Tudo que seu negócio precisa</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon name={f.icon} /></div>
                <div className="mt-3 font-semibold">{f.title}</div>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Profissionalize seu negócio hoje</h2>
        <p className="mt-2 text-slate-600">Abra no celular ou no computador. Seus dados ficam salvos na nuvem.</p>
        <Link href="/cadastro" className="btn-primary mt-6 px-8 py-3 text-base">Criar minha conta grátis</Link>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} OrçaFácil</footer>
    </div>
  );
}
